from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from backend.app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    operation = Column(String(100), nullable=False, index=True)
    dataset = Column(String(255), nullable=False)
    duplicate_id = Column(String(50), nullable=True)
    decision = Column(String(50), nullable=True)
    reason = Column(Text, nullable=True)
    user = Column(String(100), default="Data Engineer")
    metadata_json = Column(JSON, nullable=True)
