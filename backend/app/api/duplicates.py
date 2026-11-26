from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.models.duplicate import DuplicateGroup, DuplicateRecord
from backend.app.models.record import DatasetRecord
from backend.app.schemas.duplicate import DuplicateGroupSummary, DuplicateDetailResponse
from backend.app.services.lineage_service import LineageService
from backend.app.schemas.lineage import LineageGraphResponse

router = APIRouter(prefix="/duplicates", tags=["Duplicates"])

@router.get("", response_model=List[DuplicateGroupSummary])
def get_duplicates(
    duplicate_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    root_cause: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns list of detected duplicate groups with optional filtering.
    """
    query = db.query(DuplicateGroup)

    if duplicate_type:
        query = query.filter(DuplicateGroup.duplicate_type == duplicate_type)
    if risk_level:
        query = query.filter(DuplicateGroup.risk_level == risk_level)
    if root_cause:
        query = query.filter(DuplicateGroup.root_cause == root_cause)
    if status:
        query = query.filter(DuplicateGroup.status == status)
    if search:
        query = query.filter(or_(
            DuplicateGroup.duplicate_group_id.ilike(f"%{search}%"),
            DuplicateGroup.business_key.ilike(f"%{search}%")
        ))

    return query.order_by(DuplicateGroup.id.asc()).all()

@router.get("/{id}", response_model=DuplicateDetailResponse)
def get_duplicate_details(id: str, db: Session = Depends(get_db)):
    """
    Returns complete details of a specific duplicate group,
    including raw payload of Record A and Record B, evidence, and lineage context.
    """
    # Look up by duplicate_group_id or numeric ID
    if id.isdigit():
        dup_group = db.query(DuplicateGroup).filter(DuplicateGroup.id == int(id)).first()
    else:
        dup_group = db.query(DuplicateGroup).filter(DuplicateGroup.duplicate_group_id == id).first()

    if not dup_group:
        raise HTTPException(status_code=404, detail="Duplicate group not found.")

    rec_a = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_a_record_id).first() if dup_group.dataset_a_record_id else None
    rec_b = db.query(DatasetRecord).filter(DatasetRecord.id == dup_group.dataset_b_record_id).first() if dup_group.dataset_b_record_id else None

    # Get all linked duplicate records
    dup_recs = db.query(DuplicateRecord).filter(DuplicateRecord.duplicate_group_id == dup_group.duplicate_group_id).all()
    all_recs = [{"id": dr.record_id, "role": dr.dataset_role, "data": dr.record_data} for dr in dup_recs]

    # Quick lineage path
    lineage_path = LineageService.get_lineage_for_duplicate(dup_group.duplicate_group_id, db)

    return DuplicateDetailResponse(
        id=dup_group.id,
        duplicate_group_id=dup_group.duplicate_group_id,
        business_key=dup_group.business_key,
        duplicate_type=dup_group.duplicate_type,
        risk_level=dup_group.risk_level,
        root_cause=dup_group.root_cause,
        confidence=dup_group.confidence,
        evidence=dup_group.evidence,
        recommended_action=dup_group.recommended_action,
        recommendation_reason=dup_group.recommendation_reason,
        status=dup_group.status,
        created_at=dup_group.created_at,
        dataset_a_record=rec_a.record_json if rec_a else None,
        dataset_b_record=rec_b.record_json if rec_b else None,
        all_conflicting_records=all_recs,
        lineage_path=lineage_path
    )

@router.get("/{id}/lineage", response_model=LineageGraphResponse)
def get_duplicate_lineage(id: str, db: Session = Depends(get_db)):
    """
    Returns highlighted React Flow lineage graph for the specific duplicate group.
    """
    dg_id = id
    if id.isdigit():
        dg = db.query(DuplicateGroup).filter(DuplicateGroup.id == int(id)).first()
        if dg:
            dg_id = dg.duplicate_group_id
    return LineageService.get_lineage_for_duplicate(dg_id, db)
