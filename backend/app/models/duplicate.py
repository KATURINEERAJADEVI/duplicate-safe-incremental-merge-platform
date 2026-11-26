from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, Enum
from backend.app.core.database import Base

class DuplicateGroup(Base):
    __tablename__ = "duplicate_groups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    duplicate_group_id = Column(String(50), unique=True, nullable=False, index=True)
    business_key = Column(String(255), nullable=False, index=True)
    duplicate_type = Column(String(50), nullable=False)
    risk_level = Column(Enum('HIGH', 'MEDIUM', 'LOW', name="dup_risk_level_enum"), nullable=False, default='MEDIUM')
    root_cause = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False, default=0.0)
    evidence = Column(Text, nullable=True)
    recommended_action = Column(Enum('ACCEPT_A', 'ACCEPT_B', 'MERGE', 'QUARANTINE', name="dup_rec_action_enum"), nullable=False, default='QUARANTINE')
    recommendation_reason = Column(Text, nullable=True)
    status = Column(Enum('PENDING', 'APPROVED', 'REJECTED', 'QUARANTINED', 'RESOLVED', name="dup_status_enum"), nullable=False, default='PENDING', index=True)
    dataset_a_record_id = Column(Integer, nullable=True)
    dataset_b_record_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DuplicateRecord(Base):
    __tablename__ = "duplicate_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    duplicate_group_id = Column(String(50), nullable=False, index=True)
    record_id = Column(Integer, nullable=False)
    dataset_role = Column(Enum('SOURCE_A', 'SOURCE_B', name="dup_rec_role_enum"), nullable=False)
    business_key = Column(String(255), nullable=False)
    record_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
