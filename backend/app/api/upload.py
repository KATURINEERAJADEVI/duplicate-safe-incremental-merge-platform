from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.upload_service import UploadService
from backend.app.schemas.dataset import DatasetPreview

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("/dataset-a", response_model=DatasetPreview)
async def upload_dataset_a(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    Uploads Source Dataset A (Base Dataset).
    Inspects columns, nulls, duplicates, and indexes records.
    """
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    return UploadService.handle_upload(file=file, role="SOURCE_A", db=db)

@router.post("/dataset-b", response_model=DatasetPreview)
async def upload_dataset_b(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    Uploads Source Dataset B (Incoming Incremental Dataset).
    Inspects columns, nulls, duplicates, and indexes records.
    """
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    return UploadService.handle_upload(file=file, role="SOURCE_B", db=db)
