from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.lineage_service import LineageService
from backend.app.schemas.lineage import LineageGraphResponse

router = APIRouter(prefix="/lineage", tags=["Lineage"])

@router.get("/full", response_model=LineageGraphResponse)
def get_full_lineage_graph(db: Session = Depends(get_db)):
    """
    Returns complete lineage graph across all datasets, records, transformations,
    merges, and targets.
    """
    return LineageService.get_full_lineage(db=db)

@router.get("/{duplicate_id}", response_model=LineageGraphResponse)
def get_duplicate_lineage_graph(duplicate_id: str, db: Session = Depends(get_db)):
    """
    Returns backward-traversed lineage graph highlighting the exact path of the duplicate.
    """
    return LineageService.get_lineage_for_duplicate(duplicate_id, db=db)
