from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RepairActionRequest(BaseModel):
    decision: str # ACCEPT_A, ACCEPT_B, MERGE, QUARANTINE, REJECT
    approved_by: Optional[str] = "Data Engineer"
    reason: Optional[str] = "Manual approval of attribution recommendation"

class RepairDecisionResponse(BaseModel):
    id: int
    duplicate_group_id: str
    decision: str
    approved_by: str
    timestamp: datetime
    reason: str
    executed: bool
    result_record_id: Optional[int] = None

class QuarantineRecordResponse(BaseModel):
    id: int
    duplicate_group_id: str
    business_key: str
    dataset_a_data: Optional[Dict[str, Any]] = None
    dataset_b_data: Optional[Dict[str, Any]] = None
    conflict_details: str
    root_cause: str
    confidence: float
    status: str
    quarantined_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
