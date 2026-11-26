import hashlib
import json
from typing import Any, Dict, List

def compute_record_hash(record_dict: Dict[str, Any], exclude_keys: List[str] = None) -> str:
    """
    Computes a deterministic SHA-256 hash of a dictionary record.
    Keys are sorted and null/whitespace values are normalized.
    """
    if exclude_keys is None:
        exclude_keys = ["id", "record_id", "ingestion_time", "created_at", "uploaded_at"]
    
    clean_dict = {}
    for k, v in record_dict.items():
        if k in exclude_keys:
            continue
        # Normalize types
        if v is None:
            clean_dict[k] = ""
        else:
            clean_dict[k] = str(v).strip()
            
    serialized = json.dumps(clean_dict, sort_keys=True)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

def compute_business_key_hash(record_dict: Dict[str, Any], key_columns: List[str]) -> str:
    """
    Computes a concatenated string and hash for the business key.
    """
    parts = []
    for col in key_columns:
        val = record_dict.get(col, "")
        parts.append(str(val).strip() if val is not None else "")
    return "-".join(parts)
