from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Boolean, Enum
from backend.app.core.database import Base

class RepairCandidate(Base):
    __tablename__ = "repair_candidates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    duplicate_group_id = Column(String(50), nullable=False, index=True)
    candidate_record_id = Column(Integer, nullable=True)
    preferred_role = Column(String(50), nullable=False)
    priority_score = Column(Float, nullable=False, default=0.0)
    rationale = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class RepairDecision(Base):
    __tablename__ = "repair_decisions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    duplicate_group_id = Column(String(50), nullable=False, index=True)
    decision = Column(Enum('ACCEPT_A', 'ACCEPT_B', 'MERGE', 'QUARANTINE', 'REJECT', name="repair_decision_enum"), nullable=False)
    approved_by = Column(String(100), nullable=False, default="Data Engineer")
    timestamp = Column(DateTime, default=datetime.utcnow)
    reason = Column(Text, nullable=False)
    executed = Column(Boolean, default=True)
    result_record_id = Column(Integer, nullable=True)

class QuarantineRecord(Base):
    __tablename__ = "quarantine_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    duplicate_group_id = Column(String(50), nullable=False, index=True)
    business_key = Column(String(255), nullable=False)
    dataset_a_data = Column(JSON, nullable=True)
    dataset_b_data = Column(JSON, nullable=True)
    conflict_details = Column(Text, nullable=False)
    root_cause = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False, default=0.0)
    status = Column(Enum('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED', name="quarantine_status_enum"), default="PENDING", index=True)
    quarantined_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
