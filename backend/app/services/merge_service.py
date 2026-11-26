from typing import Dict, Any, List
from sqlalchemy.orm import Session
import pandas as pd

from backend.app.models.dataset import Dataset
from backend.app.models.record import DatasetRecord

class MergeService:
    @staticmethod
    def simulate_incremental_merge(dataset_a_id: int, dataset_b_id: int, key_columns: List[str], db: Session) -> Dict[str, Any]:
        """
        Simulates an incremental merge of Dataset A (base) + Dataset B (incoming).
        Original datasets remain completely untouched.
        Produces BEFORE MERGE, AFTER MERGE (naive), and EXPECTED RESULT models.
        """
        records_a = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_a_id).all()
        records_b = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_b_id).all()

        dict_a = [r.record_json for r in records_a]
        dict_b = [r.record_json for r in records_b]

        # Map by business key
        def get_bk(row):
            return "-".join([str(row.get(c, "")).strip() for c in key_columns])

        keys_a = set(get_bk(r) for r in dict_a)
        keys_b = set(get_bk(r) for r in dict_b)

        overlapping_keys = keys_a.intersection(keys_b)
        unique_to_a = keys_a - keys_b
        unique_to_b = keys_b - keys_a

        total_a = len(dict_a)
        total_b = len(dict_b)
        naive_after_total = total_a + total_b

        # Expected result count = unique keys across both datasets
        all_unique_keys = keys_a.union(keys_b)
        expected_total = len(all_unique_keys)

        return {
            "business_key_columns": key_columns,
            "before_merge": {
                "source_a_count": total_a,
                "source_b_incoming_count": total_b,
                "unique_keys_a": len(keys_a),
                "unique_keys_b": len(keys_b)
            },
            "naive_after_merge": {
                "total_rows": naive_after_total,
                "duplicate_rows_introduced": len(overlapping_keys),
                "risk": "DATA_BLOAT_AND_INTEGRITY_VIOLATION" if overlapping_keys else "CLEAN_APPEND"
            },
            "expected_result": {
                "expected_clean_rows": expected_total,
                "overlapping_business_keys_count": len(overlapping_keys),
                "new_keys_introduced_by_b": len(unique_to_b),
                "retained_unmodified_keys_a": len(unique_to_a)
            },
            "overlapping_keys": list(overlapping_keys)
        }
