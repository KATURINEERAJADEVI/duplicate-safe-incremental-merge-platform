from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class DatasetRecord(Base):
    __tablename__ = "dataset_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    record_hash = Column(String(64), nullable=False, index=True)
    business_key = Column(String(255), nullable=False, index=True)
    record_json = Column(JSON, nullable=False)
    source_id = Column(String(100), nullable=True)
    event_time = Column(DateTime, nullable=True)
    ingestion_time = Column(DateTime, default=datetime.utcnow)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="records")
