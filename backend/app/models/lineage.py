from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum
from backend.app.core.database import Base

class LineageNode(Base):
    __tablename__ = "lineage_nodes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    node_id = Column(String(100), unique=True, nullable=False, index=True)
    node_type = Column(Enum('DATASET', 'RECORD', 'TRANSFORMATION', 'MERGE', 'TARGET', name="lineage_node_type_enum"), nullable=False, index=True)
    dataset_id = Column(Integer, nullable=True)
    record_id = Column(Integer, nullable=True)
    operation_id = Column(String(100), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LineageEdge(Base):
    __tablename__ = "lineage_edges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    from_node = Column(String(100), nullable=False, index=True)
    to_node = Column(String(100), nullable=False, index=True)
    relationship = Column(String(50), nullable=False)
    operation_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
