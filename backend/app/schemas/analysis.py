from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class BusinessKeyConfirmRequest(BaseModel):
    dataset_a_id: int
    dataset_b_id: int
    business_key_columns: List[str]

class AnalysisStartRequest(BaseModel):
    dataset_a_id: int
    dataset_b_id: int
    business_key_columns: List[str]
    source_priority_map: Optional[Dict[str, int]] = None

class AnalysisStep(BaseModel):
    step_id: str
    name: str
    status: str # pending, in_progress, completed, failed
    duration_ms: float = 0.0
    details: Optional[str] = None

class AnalysisSummaryResponse(BaseModel):
    run_id: str
    dataset_a_id: int
    dataset_b_id: int
    business_key: List[str]
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    steps: List[AnalysisStep]
    total_a_records: int
    total_b_records: int
    duplicate_groups_count: int
    exact_duplicates: int
    conflicting_records: int
    quarantine_candidates: int
    reconciliation_status: str
