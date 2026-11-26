from datetime import datetime
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_name = Column(String(255), nullable=False)
    dataset_role = Column(Enum('SOURCE_A', 'SOURCE_B', name="dataset_role_enum"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=False, default=0)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(50), default="UPLOADED")

    records = relationship("DatasetRecord", back_populates="dataset", cascade="all, delete-orphan")
