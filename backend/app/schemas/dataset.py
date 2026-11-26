from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DatasetBase(BaseModel):
    dataset_name: str
    dataset_role: str
    filename: str
    file_size: int
    row_count: int
    column_count: int

class DatasetResponse(DatasetBase):
    id: int
    uploaded_at: datetime
    status: str

    class Config:
        from_attributes = True

class DatasetPreview(BaseModel):
    id: int
    dataset_name: str
    dataset_role: str
    filename: str
    file_size: int
    row_count: int
    column_count: int
    columns: List[str]
    column_types: Dict[str, str]
    null_counts: Dict[str, int]
    duplicate_rows_count: int
    sample_records: List[Dict[str, Any]]

class SchemaComparison(BaseModel):
    dataset_a: Optional[Dict[str, Any]] = None
    dataset_b: Optional[Dict[str, Any]] = None
    common_columns: List[str]
    a_only_columns: List[str]
    b_only_columns: List[str]
    is_compatible: bool
    compatibility_reason: str
    suggested_business_keys: List[List[str]]
