from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.record import DatasetRecord
from backend.app.models.duplicate import DuplicateGroup
from backend.app.models.repair import RepairCandidate

class AttributionService:
    @staticmethod
    def evaluate_attribution(
        dup_group: DuplicateGroup, 
        db: Session,
        custom_priorities: Optional[Dict[str, int]] = None
    ) -> Dict[str, Any]:
        """
        Deterministic Attribution Engine.
        Evaluates competing records using ordered rules:
        1. Source priority
        2. Valid event time
        3. Version
        4. Data completeness (least nulls)
        5. Ingestion time
        
        Outputs recommended action: ACCEPT_A, ACCEPT_B, MERGE, or QUARANTINE.
        """
        rec_a = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_a_record_id).first() if dup_group.dataset_a_record_id else None
        rec_b = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_b_record_id).first() if dup_group.dataset_b_record_id else None

        if not rec_a or not rec_b:
            return {
                "recommended_action": "QUARANTINE",
                "recommended_record": None,
                "confidence": 0.50,
                "reason": "Missing competitor record in pair; routing to quarantine."
            }

        json_a = rec_a.record_json
        json_b = rec_b.record_json
        priorities = custom_priorities or settings.SOURCE_PRIORITIES

        # Rule 1: Source Priority
        src_a = str(json_a.get("source_id", "")).upper()
        src_b = str(json_b.get("source_id", "")).upper()
        prio_a = priorities.get(src_a, 5)
        prio_b = priorities.get(src_b, 5)

        if prio_a != prio_b:
            favored = "ACCEPT_B" if prio_b > prio_a else "ACCEPT_A"
            favored_rec = rec_b if prio_b > prio_a else rec_a
            win_score = max(prio_a, prio_b)
            reason = f"Source authority rule: '{src_b if prio_b > prio_a else src_a}' has higher priority ({win_score}) than '{src_a if prio_b > prio_a else src_b}'."
            AttributionService._save_candidate(dup_group.duplicate_group_id, favored_rec.id, favored, 0.95, reason, db)
            return {"recommended_action": favored, "recommended_record": "Record B" if prio_b > prio_a else "Record A", "confidence": 0.95, "reason": reason}

        # Rule 2: Valid Event Time (Temporal Precedence)
        time_a = rec_a.event_time
        time_b = rec_b.event_time
        if time_a and time_b and time_a != time_b:
            if time_b > time_a:
                reason = f"Event time precedence: Dataset B event time ({time_b}) is newer than Dataset A ({time_a})."
                AttributionService._save_candidate(dup_group.duplicate_group_id, rec_b.id, "ACCEPT_B", 0.93, reason, db)
                return {"recommended_action": "ACCEPT_B", "recommended_record": "Record B", "confidence": 0.93, "reason": reason}
            else:
                reason = f"Late arriving event detected: Dataset A event time ({time_a}) is newer than incoming B ({time_b})."
                AttributionService._save_candidate(dup_group.duplicate_group_id, rec_a.id, "ACCEPT_A", 0.93, reason, db)
                return {"recommended_action": "ACCEPT_A", "recommended_record": "Record A", "confidence": 0.93, "reason": reason}

        # Rule 3: Version
        ver_a = json_a.get("version")
        ver_b = json_b.get("version")
        if ver_a is not None and ver_b is not None:
            try:
                va, vb = int(ver_a), int(ver_b)
                if va != vb:
                    favored = "ACCEPT_B" if vb > va else "ACCEPT_A"
                    favored_rec = rec_b if vb > va else rec_a
                    reason = f"Version rule: Version {vb if vb > va else va} > Version {va if vb > va else vb}."
                    AttributionService._save_candidate(dup_group.duplicate_group_id, favored_rec.id, favored, 0.92, reason, db)
                    return {"recommended_action": favored, "recommended_record": "Record B" if vb > va else "Record A", "confidence": 0.92, "reason": reason}
            except Exception:
                pass

        # Rule 4: Data Completeness (least null / non-empty values)
        non_null_a = sum(1 for v in json_a.values() if v is not None and str(v).strip() != "")
        non_null_b = sum(1 for v in json_b.values() if v is not None and str(v).strip() != "")
        if non_null_a != non_null_b:
            favored = "ACCEPT_B" if non_null_b > non_null_a else "ACCEPT_A"
            favored_rec = rec_b if non_null_b > non_null_a else rec_a
            reason = f"Completeness rule: Favored record contains {max(non_null_a, non_null_b)} populated fields vs {min(non_null_a, non_null_b)} fields."
            AttributionService._save_candidate(dup_group.duplicate_group_id, favored_rec.id, favored, 0.88, reason, db)
            return {"recommended_action": favored, "recommended_record": "Record B" if non_null_b > non_null_a else "Record A", "confidence": 0.88, "reason": reason}

        # Rule 5: Ingestion Time
        ing_a = rec_a.ingestion_time
        ing_b = rec_b.ingestion_time
        if ing_a and ing_b and ing_a != ing_b:
            favored = "ACCEPT_B" if ing_b > ing_a else "ACCEPT_A"
            favored_rec = rec_b if ing_b > ing_a else rec_a
            reason = "Ingestion chronology: Retaining record with latest verified pipeline ingestion timestamp."
            AttributionService._save_candidate(dup_group.duplicate_group_id, favored_rec.id, favored, 0.85, reason, db)
            return {"recommended_action": favored, "recommended_record": "Record B" if ing_b > ing_a else "Record A", "confidence": 0.85, "reason": reason}

        # If perfectly equal or unresolvable -> QUARANTINE (NO BLIND DELETION)
        quarantine_reason = "Conflicting records cannot be deterministically resolved across all 5 attribution tiers. Quarantined to prevent data loss."
        AttributionService._save_candidate(dup_group.duplicate_group_id, None, "QUARANTINE", 0.60, quarantine_reason, db)
        return {"recommended_action": "QUARANTINE", "recommended_record": None, "confidence": 0.60, "reason": quarantine_reason}

    @staticmethod
    def _save_candidate(dg_id: str, rec_id: Optional[int], preferred: str, score: float, rationale: str, db: Session):
        cand = RepairCandidate(
            duplicate_group_id=dg_id,
            candidate_record_id=rec_id,
            preferred_role=preferred,
            priority_score=score,
            rationale=rationale
        )
        db.add(cand)
        db.commit()
