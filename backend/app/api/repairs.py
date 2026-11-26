from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.repair import RepairDecision, QuarantineRecord
from backend.app.schemas.repair import RepairDecisionResponse, QuarantineRecordResponse, RepairActionRequest
from backend.app.services.repair_service import RepairService

router = APIRouter(prefix="/repairs", tags=["Repairs"])

@router.get("", response_model=List[RepairDecisionResponse])
def get_repair_decisions(db: Session = Depends(get_db)):
    """
    Returns list of all executed repair decisions.
    """
    return db.query(RepairDecision).order_by(RepairDecision.timestamp.desc()).all()

@router.post("/{id}/approve")
def approve_repair(
    id: str, 
    payload: RepairActionRequest = Body(...), 
    db: Session = Depends(get_db)
):
    """
    Approves the recommended attribution repair.
    Retains preferred record, preserves conflicting record in immutable audit log,
    and updates target state.
    """
    return RepairService.approve_repair(
        duplicate_group_id=id,
        approved_by=payload.approved_by or "Data Engineer",
        custom_reason=payload.reason,
        db=db
    )

@router.post("/{id}/reject")
def reject_repair(
    id: str, 
    payload: RepairActionRequest = Body(...), 
    db: Session = Depends(get_db)
):
    """
    Rejects the recommended attribution repair without changing target records.
    """
    return RepairService.reject_repair(
        duplicate_group_id=id,
        rejected_by=payload.approved_by or "Data Engineer",
        reason=payload.reason,
        db=db
    )

@router.post("/{id}/quarantine")
def quarantine_duplicate(
    id: str, 
    payload: RepairActionRequest = Body(...), 
    db: Session = Depends(get_db)
):
    """
    Directly routes the duplicate group to Quarantine.
    """
    return RepairService.quarantine_duplicate(
        duplicate_group_id=id,
        quarantined_by=payload.approved_by or "Data Engineer",
        reason=payload.reason,
        db=db
    )

@router.get("/quarantine/all", response_model=List[QuarantineRecordResponse])
def get_quarantine_records(db: Session = Depends(get_db)):
    """
    Returns all records currently held in Quarantine.
    """
    return db.query(QuarantineRecord).order_by(QuarantineRecord.quarantined_at.desc()).all()

@router.get("/preview-repaired")
def preview_repaired_dataset(
    dataset_a_id: Optional[int] = Query(None),
    dataset_b_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns preview JSON of the clean Golden Master repaired dataset.
    """
    rows = RepairService.build_repaired_records(db, dataset_a_id, dataset_b_id)
    cols = list(rows[0].keys()) if rows else []
    return {
        "total_rows": len(rows),
        "columns": cols,
        "sample_rows": rows[:15]
    }

@router.get("/export/repaired-dataset")
def download_repaired_dataset(
    dataset_a_id: Optional[int] = Query(None),
    dataset_b_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads the clean Golden Master repaired CSV file.
    """
    export_info = RepairService.export_repaired_csv(db, dataset_a_id, dataset_b_id)
    return FileResponse(
        path=export_info["filepath"],
        media_type="text/csv",
        filename=export_info["filename"]
    )

@router.get("/export/quarantine-dataset")
def download_quarantine_dataset(db: Session = Depends(get_db)):
    """
    Generates and downloads the Quarantined records CSV file.
    """
    export_info = RepairService.export_quarantine_csv(db)
    return FileResponse(
        path=export_info["filepath"],
        media_type="text/csv",
        filename=export_info["filename"]
    )
