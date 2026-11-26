from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.duplicate import DuplicateGroup
from backend.app.models.record import DatasetRecord

class RootCauseService:
    @staticmethod
    def analyze_root_cause(dup_group: DuplicateGroup, db: Session) -> Dict[str, Any]:
        """
        Deep root cause analysis utilizing record lineage, schema, versioning,
        and temporal signals to provide comprehensive diagnostic evidence.
        """
        rec_a = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_a_record_id).first() if dup_group.dataset_a_record_id else None
        rec_b = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_b_record_id).first() if dup_group.dataset_b_record_id else None

        analysis_result = {
            "duplicate_group_id": dup_group.duplicate_group_id,
            "root_cause": dup_group.root_cause,
            "confidence": dup_group.confidence,
            "risk_level": dup_group.risk_level,
            "evidence": dup_group.evidence,
            "lineage_context": {
                "source_a_record_id": rec_a.id if rec_a else None,
                "source_b_record_id": rec_b.id if rec_b else None,
                "business_key": dup_group.business_key,
                "detection_rule": dup_group.duplicate_type
            },
            "suggested_mitigation": RootCauseService._get_mitigation(dup_group.root_cause)
        }
        return analysis_result

    @staticmethod
    def _get_mitigation(root_cause: str) -> str:
        mitigations = {
            "RETRY_OR_BACKFILL": "Safe deduplication: Retain existing base record A and deduplicate idempotent incoming payload B.",
            "VERSION_CONFLICT": "Apply SCD Type 1 or Type 2 version-overwrite: Retain record with higher monotonic version number.",
            "LATE_ARRIVING_DATA": "Out-of-order event detection: Discard or quarantine stale update to prevent time-travel data corruption.",
            "SOURCE_PRIORITY_CONFLICT": "Apply governance priority hierarchy: Prefer authoritative core system over secondary edge channels.",
            "TEMPORAL_OVERLAP": "Apply timestamp-based ordering: Retain latest state transition.",
            "JOIN_MULTIPLICATION": "Cardinality violation: Quarantine to prevent Cartesian blowup; inspect source data producer for key uniqueness.",
            "MULTIPLE_SOURCE_RECORDS": "Manual arbitration: Attribute values diverge without temporal clues; route to Quarantine.",
            "UNKNOWN": "Data anomaly: Quarantine pending manual data engineer inspection."
        }
        return mitigations.get(root_cause, "Review records in Repair Center.")
