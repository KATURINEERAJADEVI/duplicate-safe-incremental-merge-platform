from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DuplicateGroupSummary(BaseModel):
    id: int
    duplicate_group_id: str
    business_key: str
    duplicate_type: str
    risk_level: str
    root_cause: str
    confidence: float
    recommended_action: str
    recommendation_reason: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DuplicateDetailResponse(DuplicateGroupSummary):
    evidence: Optional[str] = None
    dataset_a_record: Optional[Dict[str, Any]] = None
    dataset_b_record: Optional[Dict[str, Any]] = None
    all_conflicting_records: List[Dict[str, Any]] = []
    lineage_path: Optional[Dict[str, Any]] = None

class DuplicateFilterParams(BaseModel):
    duplicate_type: Optional[str] = None
    risk_level: Optional[str] = None
    root_cause: Optional[str] = None
    status: Optional[str] = None
    search: Optional[str] = None
