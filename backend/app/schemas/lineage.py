from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class LineageNodeSchema(BaseModel):
    id: str
    type: str # default, input, output, custom
    data: Dict[str, Any] # label, node_type, dataset_id, record_id, metadata, is_highlighted
    position: Dict[str, float] # x, y

class LineageEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = False
    style: Optional[Dict[str, Any]] = None

class LineageGraphResponse(BaseModel):
    duplicate_group_id: Optional[str] = None
    nodes: List[LineageNodeSchema]
    edges: List[LineageEdgeSchema]
    summary: Dict[str, Any]
    lineage_stats: Dict[str, int]
