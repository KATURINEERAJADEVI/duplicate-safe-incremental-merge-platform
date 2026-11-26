from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ReconciliationResponse(BaseModel):
    id: int
    run_id: str
    total_source_a_records: int
    total_source_b_records: int
    total_expected_records: int
    total_actual_records: int
    total_duplicate_records: int
    total_repaired_records: int
    total_quarantined_records: int
    missing_records: int
    unexpected_records: int
    status: str # PASS, WARNING, FAIL
    details_json: Optional[Dict[str, Any]] = None
    calculated_at: datetime

    class Config:
        from_attributes = True

class KPIResponse(BaseModel):
    id: int
    run_id: str
    kpi_1_attribution_precision: float
    kpi_2_ambiguous_merges_prevented: int
    kpi_3_reconciliation_accuracy: float
    kpi_4_false_block_rate: float
    kpi_5_runtime_overhead_ms: float
    kpi_6_lineage_coverage: float
    computed_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    operation: str
    dataset: str
    duplicate_id: Optional[str] = None
    decision: Optional[str] = None
    reason: Optional[str] = None
    user: str
    metadata_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
