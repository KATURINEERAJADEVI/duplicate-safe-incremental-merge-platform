import json
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
import pandas as pd

from backend.app.models.dataset import Dataset
from backend.app.models.record import DatasetRecord
from backend.app.models.duplicate import DuplicateGroup, DuplicateRecord
from backend.app.utils.hashing import compute_record_hash, compute_business_key_hash

class DuplicateDetectionService:
    @staticmethod
    def detect_duplicates(
        dataset_a_id: int, 
        dataset_b_id: int, 
        key_columns: List[str], 
        db: Session
    ) -> List[DuplicateGroup]:
        """
        Detects duplicates between Dataset A and Dataset B based on the selected business key.
        Classifies duplicates into the 8 specific required types.
        """
        # Clear previous duplicate groups for a fresh run
        db.query(DuplicateRecord).delete()
        db.query(DuplicateGroup).delete()
        db.commit()

        records_a = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_a_id).all()
        records_b = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_b_id).all()

        # Update business keys on records
        for r in records_a:
            r.business_key = compute_business_key_hash(r.record_json, key_columns)
        for r in records_b:
            r.business_key = compute_business_key_hash(r.record_json, key_columns)
        db.commit()

        # Group records by business key
        grouped_a: Dict[str, List[DatasetRecord]] = {}
        for r in records_a:
            grouped_a.setdefault(r.business_key, []).append(r)

        grouped_b: Dict[str, List[DatasetRecord]] = {}
        for r in records_b:
            grouped_b.setdefault(r.business_key, []).append(r)

        all_keys = set(grouped_a.keys()).union(set(grouped_b.keys()))
        detected_groups: List[DuplicateGroup] = []
        group_counter = 1

        for bk in sorted(list(all_keys)):
            recs_in_a = grouped_a.get(bk, [])
            recs_in_b = grouped_b.get(bk, [])

            # Duplicate occurs if key appears in both A and B, or multiple times in A or B
            is_cross_duplicate = len(recs_in_a) > 0 and len(recs_in_b) > 0
            is_internal_duplicate = len(recs_in_a) > 1 or len(recs_in_b) > 1

            if not (is_cross_duplicate or is_internal_duplicate):
                continue

            dg_id = f"DG-{group_counter:04d}"
            group_counter += 1

            # Pick representative records for comparison
            rec_a = recs_in_a[0] if recs_in_a else None
            rec_b = recs_in_b[0] if recs_in_b else None

            dup_type, risk_level, root_cause, conf, evidence, rec_action, rec_reason = DuplicateDetectionService._classify_duplicate(
                rec_a, rec_b, recs_in_a, recs_in_b
            )

            dup_group = DuplicateGroup(
                duplicate_group_id=dg_id,
                business_key=bk,
                duplicate_type=dup_type,
                risk_level=risk_level,
                root_cause=root_cause,
                confidence=conf,
                evidence=evidence,
                recommended_action=rec_action,
                recommendation_reason=rec_reason,
                status="PENDING",
                dataset_a_record_id=rec_a.id if rec_a else None,
                dataset_b_record_id=rec_b.id if rec_b else None
            )
            db.add(dup_group)
            db.flush()

            # Record duplicate references
            for r in recs_in_a:
                db.add(DuplicateRecord(
                    duplicate_group_id=dg_id,
                    record_id=r.id,
                    dataset_role="SOURCE_A",
                    business_key=bk,
                    record_data=r.record_json
                ))
            for r in recs_in_b:
                db.add(DuplicateRecord(
                    duplicate_group_id=dg_id,
                    record_id=r.id,
                    dataset_role="SOURCE_B",
                    business_key=bk,
                    record_data=r.record_json
                ))

            detected_groups.append(dup_group)

        db.commit()
        return detected_groups

    @staticmethod
    def _classify_duplicate(
        rec_a: DatasetRecord,
        rec_b: DatasetRecord,
        recs_in_a: List[DatasetRecord],
        recs_in_b: List[DatasetRecord]
    ) -> Tuple[str, str, str, float, str, str, str]:
        """
        Classifies the conflict into one of the 8 duplicate types:
        1. EXACT_DUPLICATE
        2. BUSINESS_KEY_CONFLICT
        3. LATE_ARRIVING_RECORD
        4. VERSION_CONFLICT
        5. SOURCE_CONFLICT
        6. TEMPORAL_CONFLICT
        7. JOIN_MULTIPLICATION
        8. UNKNOWN
        """
        # Check Join Multiplication
        if len(recs_in_a) > 1 or len(recs_in_b) > 1:
            evidence = f"Business key maps to {len(recs_in_a)} records in Dataset A and {len(recs_in_b)} records in Dataset B."
            return (
                "JOIN_MULTIPLICATION",
                "HIGH",
                "JOIN_MULTIPLICATION",
                0.96,
                evidence,
                "QUARANTINE",
                "One-to-many or many-to-many key explosion detected. Blind merge would cause Cartesian duplicate inflation."
            )

        if not rec_a or not rec_b:
            return (
                "UNKNOWN",
                "MEDIUM",
                "UNKNOWN",
                0.50,
                "Single-sided internal duplicate.",
                "QUARANTINE",
                "Unresolved internal duplicate requiring engineer review."
            )

        json_a = rec_a.record_json
        json_b = rec_b.record_json

        # 1. EXACT_DUPLICATE: all non-metadata values match
        hash_a = rec_a.record_hash
        hash_b = rec_b.record_hash
        if hash_a == hash_b:
            return (
                "EXACT_DUPLICATE",
                "LOW",
                "RETRY_OR_BACKFILL",
                0.99,
                "Dataset A and Dataset B contain 100% byte-for-byte identical payload fields.",
                "ACCEPT_A",
                "Identical payload. Keep existing Dataset A record and deduplicate incoming B safely."
            )

        # 2. VERSION_CONFLICT
        ver_a = json_a.get("version")
        ver_b = json_b.get("version")
        if ver_a is not None and ver_b is not None:
            try:
                va, vb = int(ver_a), int(ver_b)
                if va != vb:
                    if vb > va:
                        evidence = f"Dataset A version = {va}; Dataset B version = {vb}. Dataset B represents an updated state."
                        return (
                            "VERSION_CONFLICT",
                            "HIGH",
                            "VERSION_CONFLICT",
                            0.94,
                            evidence,
                            "ACCEPT_B",
                            f"Dataset B carries newer incremental version {vb} > {va}."
                        )
                    else:
                        evidence = f"Dataset A version = {va}; Dataset B version = {vb}. Dataset B represents an outdated state."
                        return (
                            "VERSION_CONFLICT",
                            "HIGH",
                            "VERSION_CONFLICT",
                            0.92,
                            evidence,
                            "ACCEPT_A",
                            f"Dataset A carries authoritative version {va} > incoming B version {vb}."
                        )
            except Exception:
                pass

        # 3. LATE_ARRIVING_RECORD / TEMPORAL_CONFLICT
        time_a = rec_a.event_time
        time_b = rec_b.event_time
        if time_a and time_b:
            if time_b < time_a:
                evidence = f"Dataset B event_time ({time_b}) is older than Dataset A existing event_time ({time_a})."
                return (
                    "LATE_ARRIVING_RECORD",
                    "HIGH",
                    "LATE_ARRIVING_DATA",
                    0.91,
                    evidence,
                    "ACCEPT_A",
                    "Late-arriving record detected out-of-order. Current base record is newer; discard or quarantine stale update."
                )
            elif time_b > time_a:
                evidence = f"Dataset B event_time ({time_b}) is strictly newer than Dataset A ({time_a})."
                return (
                    "TEMPORAL_CONFLICT",
                    "MEDIUM",
                    "TEMPORAL_OVERLAP",
                    0.88,
                    evidence,
                    "ACCEPT_B",
                    "Temporal precedence: Dataset B contains latest timestamped state transition."
                )

        # 4. SOURCE_CONFLICT
        src_a = str(json_a.get("source_id", "")).upper()
        src_b = str(json_b.get("source_id", "")).upper()
        if src_a and src_b and src_a != src_b:
            from backend.app.core.config import settings
            prio_a = settings.SOURCE_PRIORITIES.get(src_a, 5)
            prio_b = settings.SOURCE_PRIORITIES.get(src_b, 5)
            if prio_a != prio_b:
                preferred = "ACCEPT_B" if prio_b > prio_a else "ACCEPT_A"
                win_src = src_b if prio_b > prio_a else src_a
                evidence = f"Source A '{src_a}' priority = {prio_a}; Source B '{src_b}' priority = {prio_b}."
                return (
                    "SOURCE_CONFLICT",
                    "MEDIUM",
                    "SOURCE_PRIORITY_CONFLICT",
                    0.89,
                    evidence,
                    preferred,
                    f"Higher authority priority given to source '{win_src}'."
                )

        # 5. BUSINESS_KEY_CONFLICT
        differing_cols = [k for k in json_a if k in json_b and str(json_a[k]) != str(json_b[k])]
        evidence = f"Conflicting values across attribute(s): {', '.join(differing_cols)}."
        return (
            "BUSINESS_KEY_CONFLICT",
            "HIGH",
            "MULTIPLE_SOURCE_RECORDS",
            0.82,
            evidence,
            "QUARANTINE",
            "Attribute divergence without deterministic version or timestamp delta. Route to Quarantine."
        )
