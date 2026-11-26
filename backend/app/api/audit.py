from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.schemas.reconciliation import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_history(
    operation: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    """
    Returns immutable audit history of all dataset merges, approvals, rejections,
    and quarantine movements.
    """
    query = db.query(AuditLog)
    if operation:
        query = query.filter(AuditLog.operation == operation)
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.post("/log", response_model=AuditLogResponse)
def create_audit_entry(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    Creates an explicit audit log event.
    """
    entry = AuditLog(
        operation=payload.get("operation", "MANUAL_ACTION"),
        dataset=payload.get("dataset", "System"),
        duplicate_id=payload.get("duplicate_id"),
        decision=payload.get("decision"),
        reason=payload.get("reason"),
        user=payload.get("user", "Data Engineer"),
        metadata_json=payload.get("metadata")
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
