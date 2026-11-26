from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.reconciliation import ReconciliationResult
from backend.app.schemas.reconciliation import ReconciliationResponse
from backend.app.services.reconciliation_service import ReconciliationService

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])

@router.post("/run", response_model=ReconciliationResponse)
def run_reconciliation(
    dataset_a_id: int = Query(...), 
    dataset_b_id: int = Query(...), 
    db: Session = Depends(get_db)
):
    """
    Executes row reconciliation across before-merge, after-merge, and expected target records.
    Calculates missing/unexpected rows and PASS / WARNING / FAIL status.
    """
    return ReconciliationService.run_reconciliation(dataset_a_id, dataset_b_id, db)

@router.get("/latest", response_model=ReconciliationResponse)
def get_latest_reconciliation(db: Session = Depends(get_db)):
    """
    Returns the most recent reconciliation outcome.
    """
    latest = db.query(ReconciliationResult).order_by(ReconciliationResult.calculated_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No reconciliation records found.")
    return latest

@router.get("/{id}", response_model=ReconciliationResponse)
def get_reconciliation_by_id(id: str, db: Session = Depends(get_db)):
    """
    Returns reconciliation result by ID or Run ID.
    """
    if id.isdigit():
        res = db.query(ReconciliationResult).filter(ReconciliationResult.id == int(id)).first()
    else:
        res = db.query(ReconciliationResult).filter(ReconciliationResult.run_id == id).first()

    if not res:
        raise HTTPException(status_code=404, detail="Reconciliation result not found.")
    return res
