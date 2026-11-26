from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.dataset import Dataset
from backend.app.schemas.dataset import DatasetResponse, SchemaComparison
from backend.app.services.validation_service import ValidationService

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetResponse])
def get_all_datasets(db: Session = Depends(get_db)):
    """
    Returns list of all uploaded datasets.
    """
    return db.query(Dataset).order_by(Dataset.uploaded_at.desc()).all()

@router.get("/compare-schemas", response_model=SchemaComparison)
def compare_schemas(
    dataset_a_id: int = Query(...), 
    dataset_b_id: int = Query(...), 
    db: Session = Depends(get_db)
):
    """
    Compares schemas between uploaded Dataset A and Dataset B.
    Extracts common columns and suggests business keys.
    """
    return ValidationService.compare_uploaded_datasets(dataset_a_id, dataset_b_id, db)

@router.get("/{id}", response_model=DatasetResponse)
def get_dataset_by_id(id: int, db: Session = Depends(get_db)):
    """
    Returns metadata for a specific dataset.
    """
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return dataset

@router.post("/reset")
def reset_all_data(db: Session = Depends(get_db)):
    """
    Purges all datasets, records, duplicates, repairs, quarantine, and audit logs.
    Restores the database to a completely clean state.
    """
    from sqlalchemy import text
    tables = [
        'audit_logs', 'kpi_results', 'reconciliation_results', 'quarantine_records',
        'repair_decisions', 'repair_candidates', 'duplicate_records', 'duplicate_groups',
        'lineage_edges', 'lineage_nodes', 'dataset_records', 'datasets'
    ]
    db.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
    for t in tables:
        db.execute(text(f"TRUNCATE TABLE {t};"))
    db.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
    db.commit()

    from backend.app.core.config import settings
    for d in [settings.UPLOAD_DIR, settings.PROCESSED_DIR, settings.QUARANTINE_DIR, settings.REPAIRED_DIR]:
        if d.exists():
            for f in d.glob("*"):
                if f.is_file():
                    try:
                        f.unlink()
                    except Exception:
                        pass

    from backend.app.api.analysis import _last_analysis_result
    _last_analysis_result.clear()

    return {"status": "success", "message": "All datasets and analysis data have been completely purged."}

