from typing import Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.dataset import Dataset
from backend.app.models.record import DatasetRecord
from backend.app.utils.validation import compare_schemas, suggest_business_keys

class ValidationService:
    @staticmethod
    def compare_uploaded_datasets(dataset_a_id: int, dataset_b_id: int, db: Session) -> Dict[str, Any]:
        """
        Retrieves Dataset A and B and compares schemas to show common columns, differences,
        and suggested business keys.
        """
        ds_a = db.query(Dataset).filter(Dataset.id == dataset_a_id).first()
        ds_b = db.query(Dataset).filter(Dataset.id == dataset_b_id).first()

        if not ds_a or not ds_b:
            raise HTTPException(status_code=404, detail="One or both datasets not found.")

        # Sample one record to inspect keys
        rec_a = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == ds_a.id).first()
        rec_b = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == ds_b.id).first()

        cols_a = list(rec_a.record_json.keys()) if rec_a else []
        cols_b = list(rec_b.record_json.keys()) if rec_b else []

        common, a_only, b_only, is_compatible, reason = compare_schemas(cols_a, cols_b)
        suggested_keys = suggest_business_keys(common)

        return {
            "dataset_a": {
                "id": ds_a.id,
                "dataset_name": ds_a.dataset_name,
                "dataset_role": ds_a.dataset_role,
                "row_count": ds_a.row_count,
                "column_count": ds_a.column_count,
                "columns": cols_a
            },
            "dataset_b": {
                "id": ds_b.id,
                "dataset_name": ds_b.dataset_name,
                "dataset_role": ds_b.dataset_role,
                "row_count": ds_b.row_count,
                "column_count": ds_b.column_count,
                "columns": cols_b
            },
            "common_columns": common,
            "a_only_columns": a_only,
            "b_only_columns": b_only,
            "is_compatible": is_compatible,
            "compatibility_reason": reason,
            "suggested_business_keys": suggested_keys
        }

    @staticmethod
    def validate_pre_merge_uniqueness(dataset_id: int, key_columns: List[str], db: Session) -> Dict[str, Any]:
        """
        Performs pre-merge uniqueness check within a single dataset.
        Identifies internal duplicates prior to merging.
        """
        records = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_id).all()
        key_counts: Dict[str, int] = {}
        
        for r in records:
            bk_val = "-".join([str(r.record_json.get(c, "")).strip() for c in key_columns])
            key_counts[bk_val] = key_counts.get(bk_val, 0) + 1

        internal_dups = {k: v for k, v in key_counts.items() if v > 1}
        
        return {
            "dataset_id": dataset_id,
            "total_records": len(records),
            "unique_keys": len(key_counts),
            "internal_duplicate_keys_count": len(internal_dups),
            "is_strictly_unique": len(internal_dups) == 0,
            "internal_duplicates": internal_dups
        }
