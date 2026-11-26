from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Enum
from backend.app.core.database import Base

class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(String(100), unique=True, nullable=False, index=True)
    total_source_a_records = Column(Integer, default=0)
    total_source_b_records = Column(Integer, default=0)
    total_expected_records = Column(Integer, default=0)
    total_actual_records = Column(Integer, default=0)
    total_duplicate_records = Column(Integer, default=0)
    total_repaired_records = Column(Integer, default=0)
    total_quarantined_records = Column(Integer, default=0)
    missing_records = Column(Integer, default=0)
    unexpected_records = Column(Integer, default=0)
    status = Column(Enum('PASS', 'WARNING', 'FAIL', name="reconciliation_status_enum"), default="PASS")
    details_json = Column(JSON, nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow)

class KPIResult(Base):
    __tablename__ = "kpi_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(String(100), nullable=False, index=True)
    kpi_1_attribution_precision = Column(Float, default=0.0)
    kpi_2_ambiguous_merges_prevented = Column(Integer, default=0)
    kpi_3_reconciliation_accuracy = Column(Float, default=0.0)
    kpi_4_false_block_rate = Column(Float, default=0.0)
    kpi_5_runtime_overhead_ms = Column(Float, default=0.0)
    kpi_6_lineage_coverage = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=datetime.utcnow)
