from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.reconciliation import KPIResult
from backend.app.schemas.reconciliation import KPIResponse

router = APIRouter(prefix="/kpis", tags=["KPIs"])

@router.get("", response_model=List[KPIResponse])
def get_all_kpis(db: Session = Depends(get_db)):
    """
    Returns historical KPI records.
    """
    return db.query(KPIResult).order_by(KPIResult.computed_at.desc()).all()

@router.get("/latest", response_model=KPIResponse)
def get_latest_kpis(db: Session = Depends(get_db)):
    """
    Returns the most recent calculated KPIs for the current analysis run.
    """
    latest = db.query(KPIResult).order_by(KPIResult.computed_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No KPI records found yet.")
    return latest
