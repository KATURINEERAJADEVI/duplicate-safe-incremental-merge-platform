from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.models.dataset import Dataset
from backend.app.models.duplicate import DuplicateGroup
from backend.app.models.record import DatasetRecord
from backend.app.models.repair import RepairDecision, QuarantineRecord
from backend.app.models.audit import AuditLog

class RepairService:
    @staticmethod
    def approve_repair(
        duplicate_group_id: str, 
        approved_by: str, 
        custom_reason: Optional[str], 
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes user-approved repair.
        Preserves non-selected record in immutable audit history.
        Updates target record and records repair decision.
        """
        dup_group = db.query(DuplicateGroup).filter(DuplicateGroup.duplicate_group_id == duplicate_group_id).first()
        if not dup_group:
            raise HTTPException(status_code=404, detail="Duplicate group not found.")

        decision_action = dup_group.recommended_action
        final_reason = custom_reason or dup_group.recommendation_reason or "Approved attribution recommendation"

        # Determine target record ID
        result_rec_id = None
        if decision_action == "ACCEPT_A":
            result_rec_id = dup_group.dataset_a_record_id
        elif decision_action == "ACCEPT_B":
            result_rec_id = dup_group.dataset_b_record_id

        # Record decision
        repair_decision = RepairDecision(
            duplicate_group_id=duplicate_group_id,
            decision=decision_action,
            approved_by=approved_by,
            reason=final_reason,
            executed=True,
            result_record_id=result_rec_id
        )
        db.add(repair_decision)

        # Update duplicate group status
        dup_group.status = "APPROVED" if decision_action != "QUARANTINE" else "QUARANTINED"

        # If quarantined, add to quarantine records
        if decision_action == "QUARANTINE":
            rec_a = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_a_record_id).first() if dup_group.dataset_a_record_id else None
            rec_b = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_b_record_id).first() if dup_group.dataset_b_record_id else None
            
            quar_rec = QuarantineRecord(
                duplicate_group_id=duplicate_group_id,
                business_key=dup_group.business_key,
                dataset_a_data=rec_a.record_json if rec_a else None,
                dataset_b_data=rec_b.record_json if rec_b else None,
                conflict_details=dup_group.evidence or "Conflict moved to quarantine",
                root_cause=dup_group.root_cause,
                confidence=dup_group.confidence,
                status="PENDING"
            )
            db.add(quar_rec)

        # Immutable Audit Log
        audit = AuditLog(
            operation="REPAIR_APPROVED",
            dataset="Dataset A + B",
            duplicate_id=duplicate_group_id,
            decision=decision_action,
            reason=final_reason,
            user=approved_by,
            metadata_json={
                "business_key": dup_group.business_key,
                "root_cause": dup_group.root_cause,
                "confidence": dup_group.confidence,
                "retained_record_id": result_rec_id
            }
        )
        db.add(audit)
        db.commit()

        return {
            "duplicate_group_id": duplicate_group_id,
            "status": "APPROVED",
            "decision": decision_action,
            "retained_record_id": result_rec_id,
            "approved_by": approved_by,
            "timestamp": datetime.utcnow()
        }

    @staticmethod
    def reject_repair(
        duplicate_group_id: str, 
        rejected_by: str, 
        reason: Optional[str], 
        db: Session
    ) -> Dict[str, Any]:
        """
        Rejects repair recommendation without executing changes.
        """
        dup_group = db.query(DuplicateGroup).filter(DuplicateGroup.duplicate_group_id == duplicate_group_id).first()
        if not dup_group:
            raise HTTPException(status_code=404, detail="Duplicate group not found.")

        dup_group.status = "REJECTED"

        repair_decision = RepairDecision(
            duplicate_group_id=duplicate_group_id,
            decision="REJECT",
            approved_by=rejected_by,
            reason=reason or "User manually rejected attribution recommendation",
            executed=False
        )
        db.add(repair_decision)

        audit = AuditLog(
            operation="REPAIR_REJECTED",
            dataset="Dataset A + B",
            duplicate_id=duplicate_group_id,
            decision="REJECT",
            reason=reason or "Manually rejected",
            user=rejected_by
        )
        db.add(audit)
        db.commit()

        return {"duplicate_group_id": duplicate_group_id, "status": "REJECTED"}

    @staticmethod
    def quarantine_duplicate(
        duplicate_group_id: str, 
        quarantined_by: str, 
        reason: Optional[str], 
        db: Session
    ) -> Dict[str, Any]:
        """
        Manually shifts a duplicate pair directly to Quarantine.
        """
        dup_group = db.query(DuplicateGroup).filter(DuplicateGroup.duplicate_group_id == duplicate_group_id).first()
        if not dup_group:
            raise HTTPException(status_code=404, detail="Duplicate group not found.")

        dup_group.status = "QUARANTINED"
        dup_group.recommended_action = "QUARANTINE"

        rec_a = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_a_record_id).first() if dup_group.dataset_a_record_id else None
        rec_b = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_b_record_id).first() if dup_group.dataset_b_record_id else None

        quar_rec = QuarantineRecord(
            duplicate_group_id=duplicate_group_id,
            business_key=dup_group.business_key,
            dataset_a_data=rec_a.record_json if rec_a else None,
            dataset_b_data=rec_b.record_json if rec_b else None,
            conflict_details=reason or "Manually moved to quarantine by engineer",
            root_cause=dup_group.root_cause,
            confidence=dup_group.confidence,
            status="PENDING"
        )
        db.add(quar_rec)

        repair_decision = RepairDecision(
            duplicate_group_id=duplicate_group_id,
            decision="QUARANTINE",
            approved_by=quarantined_by,
            reason=reason or "Manually directed to quarantine",
            executed=True
        )
        db.add(repair_decision)

        audit = AuditLog(
            operation="RECORD_QUARANTINED",
            dataset="Dataset A + B",
            duplicate_id=duplicate_group_id,
            decision="QUARANTINE",
            reason=reason or "Moved to quarantine",
            user=quarantined_by
        )
        db.add(audit)
        db.commit()

        return {"duplicate_group_id": duplicate_group_id, "status": "QUARANTINED"}

    @staticmethod
    def build_repaired_records(
        db: Session, 
        dataset_a_id: Optional[int] = None, 
        dataset_b_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Builds the Golden Master repaired dataset rows from Dataset A and B.
        Applies approved repair decisions:
        - Clean non-duplicate records from A and B are preserved.
        - For duplicates with APPROVED decisions:
          * ACCEPT_B: uses Record B
          * ACCEPT_A: uses Record A
          * MERGE: merges Record A with non-null attributes of Record B
        - For duplicates with QUARANTINED status: omitted from clean master dataset.
        - For duplicates with REJECTED status: defaults to preserving baseline Record A.
        - For PENDING duplicates: uses recommended action (or baseline Record A).
        """
        ds_a_query = db.query(Dataset).filter(Dataset.dataset_role == "SOURCE_A")
        ds_b_query = db.query(Dataset).filter(Dataset.dataset_role == "SOURCE_B")
        if dataset_a_id:
            ds_a_query = ds_a_query.filter(Dataset.id == dataset_a_id)
        if dataset_b_id:
            ds_b_query = ds_b_query.filter(Dataset.id == dataset_b_id)

        ds_a = ds_a_query.order_by(Dataset.id.desc()).first()
        ds_b = ds_b_query.order_by(Dataset.id.desc()).first()

        recs_a = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == ds_a.id).all() if ds_a else []
        recs_b = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == ds_b.id).all() if ds_b else []

        recs_a_map = {r.id: r for r in recs_a}
        recs_b_map = {r.id: r for r in recs_b}

        # Query all duplicate groups
        dup_groups = db.query(DuplicateGroup).all()

        # Track which record IDs are involved in duplicate groups
        dup_rec_a_ids = {dg.dataset_a_record_id for dg in dup_groups if dg.dataset_a_record_id}
        dup_rec_b_ids = {dg.dataset_b_record_id for dg in dup_groups if dg.dataset_b_record_id}

        clean_rows = []

        # 1. Add non-duplicate records from Dataset A
        for r in recs_a:
            if r.id not in dup_rec_a_ids:
                clean_rows.append(dict(r.record_json))

        # 2. Add non-duplicate records from Dataset B
        for r in recs_b:
            if r.id not in dup_rec_b_ids:
                clean_rows.append(dict(r.record_json))

        # 3. For each duplicate group, apply resolution
        for dg in dup_groups:
            latest_decision = db.query(RepairDecision).filter(
                RepairDecision.duplicate_group_id == dg.duplicate_group_id
            ).order_by(RepairDecision.timestamp.desc()).first()

            action = latest_decision.decision if latest_decision else dg.recommended_action
            status = dg.status

            rec_a = recs_a_map.get(dg.dataset_a_record_id)
            rec_b = recs_b_map.get(dg.dataset_b_record_id)

            if status == "QUARANTINED" or action == "QUARANTINE":
                # Exclude from clean golden master
                continue
            elif action == "ACCEPT_B":
                if rec_b:
                    clean_rows.append(dict(rec_b.record_json))
                elif rec_a:
                    clean_rows.append(dict(rec_a.record_json))
            elif action == "ACCEPT_A":
                if rec_a:
                    clean_rows.append(dict(rec_a.record_json))
                elif rec_b:
                    clean_rows.append(dict(rec_b.record_json))
            elif action == "MERGE":
                merged = dict(rec_a.record_json) if rec_a else {}
                if rec_b and rec_b.record_json:
                    for k, v in rec_b.record_json.items():
                        if v is not None and str(v).strip() != "":
                            merged[k] = v
                clean_rows.append(merged)
            elif status == "REJECTED" or action == "REJECT":
                if rec_a:
                    clean_rows.append(dict(rec_a.record_json))
            else:
                if dg.recommended_action == "ACCEPT_B" and rec_b:
                    clean_rows.append(dict(rec_b.record_json))
                elif rec_a:
                    clean_rows.append(dict(rec_a.record_json))

        return clean_rows

    @staticmethod
    def export_repaired_csv(
        db: Session, 
        dataset_a_id: Optional[int] = None, 
        dataset_b_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generates and saves the final clean Golden Master CSV dataset.
        """
        clean_rows = RepairService.build_repaired_records(db, dataset_a_id, dataset_b_id)
        df = pd.DataFrame(clean_rows) if clean_rows else pd.DataFrame()

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"golden_master_repaired_{timestamp}.csv"
        filepath = settings.REPAIRED_DIR / filename
        settings.REPAIRED_DIR.mkdir(parents=True, exist_ok=True)

        df.to_csv(filepath, index=False)

        # Log audit entry
        audit = AuditLog(
            operation="REPAIRED_DATASET_EXPORTED",
            dataset="Golden Master Merged",
            reason=f"Exported golden master repaired dataset with {len(clean_rows)} clean records.",
            user="Data Engineer",
            metadata_json={"filename": filename, "row_count": len(clean_rows), "columns": list(df.columns)}
        )
        db.add(audit)
        db.commit()

        return {
            "filename": filename,
            "filepath": str(filepath),
            "total_rows": len(clean_rows),
            "columns": list(df.columns)
        }

    @staticmethod
    def export_quarantine_csv(db: Session) -> Dict[str, Any]:
        """
        Generates and saves the Quarantine records CSV dataset.
        """
        records = db.query(QuarantineRecord).all()
        rows = []
        for q in records:
            rows.append({
                "duplicate_group_id": q.duplicate_group_id,
                "business_key": q.business_key,
                "conflict_details": q.conflict_details,
                "root_cause": q.root_cause,
                "confidence": q.confidence,
                "status": q.status,
                "quarantined_at": q.quarantined_at,
                "dataset_a_payload": str(q.dataset_a_data),
                "dataset_b_payload": str(q.dataset_b_data)
            })
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["duplicate_group_id", "business_key", "conflict_details", "root_cause", "confidence", "status", "quarantined_at"])

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"quarantine_records_{timestamp}.csv"
        filepath = settings.QUARANTINE_DIR / filename
        settings.QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)

        df.to_csv(filepath, index=False)
        return {
            "filename": filename,
            "filepath": str(filepath),
            "total_rows": len(rows),
            "columns": list(df.columns)
        }
