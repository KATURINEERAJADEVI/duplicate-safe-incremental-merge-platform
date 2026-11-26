import os
import shutil
import json
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from backend.app.core.config import settings
from backend.app.models.dataset import Dataset
from backend.app.models.record import DatasetRecord
from backend.app.models.audit import AuditLog
from backend.app.utils.csv_utils import inspect_csv
from backend.app.utils.hashing import compute_record_hash

class UploadService:
    @staticmethod
    def handle_upload(file: UploadFile, role: str, db: Session) -> dict:
        """
        Saves uploaded CSV file, registers dataset in MySQL, and indexes initial records.
        """
        role_upper = role.upper()
        if role_upper not in ["SOURCE_A", "SOURCE_B"]:
            raise ValueError(f"Invalid dataset role: {role}")

        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{role_upper.lower()}_{timestamp_str}_{file.filename}"
        dest_path = settings.UPLOAD_DIR / safe_filename

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Inspect CSV
        meta = inspect_csv(dest_path)

        # Save to MySQL datasets table
        dataset_name = f"Dataset {role_upper[-1]} ({file.filename})"
        dataset = Dataset(
            dataset_name=dataset_name,
            dataset_role=role_upper,
            filename=safe_filename,
            file_size=meta["file_size"],
            row_count=meta["row_count"],
            column_count=meta["column_count"],
            status="UPLOADED"
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        # Ingest records into dataset_records table
        df = pd.read_csv(dest_path)
        df_clean = df.replace({np.nan: None})

        records_to_insert = []
        for idx, row in df_clean.iterrows():
            row_dict = row.to_dict()
            rec_hash = compute_record_hash(row_dict)
            
            # Extract common indexed columns if present
            source_id = str(row_dict.get("source_id", "")) if row_dict.get("source_id") is not None else None
            
            raw_event_time = row_dict.get("event_time") or row_dict.get("timestamp") or row_dict.get("created_at")
            parsed_event_time = None
            if raw_event_time:
                try:
                    parsed_event_time = pd.to_datetime(raw_event_time).to_pydatetime()
                except Exception:
                    parsed_event_time = None

            version_val = 1
            if "version" in row_dict and row_dict["version"] is not None:
                try:
                    version_val = int(row_dict["version"])
                except Exception:
                    version_val = 1

            # Default temporary business key until confirmed by user
            temp_bk = str(row_dict.get("record_id") or row_dict.get("id") or f"ROW_{idx}")

            rec = DatasetRecord(
                dataset_id=dataset.id,
                record_hash=rec_hash,
                business_key=temp_bk,
                record_json=row_dict,
                source_id=source_id,
                event_time=parsed_event_time,
                version=version_val
            )
            records_to_insert.append(rec)

        db.bulk_save_objects(records_to_insert)
        
        # Log audit entry
        audit = AuditLog(
            operation="DATASET_UPLOAD",
            dataset=dataset_name,
            reason=f"Uploaded {role_upper} with {meta['row_count']} rows, {meta['column_count']} columns",
            user="Data Engineer",
            metadata_json={"filename": file.filename, "file_size": meta["file_size"]}
        )
        db.add(audit)
        db.commit()

        preview_data = {
            "id": dataset.id,
            "dataset_name": dataset.dataset_name,
            "dataset_role": dataset.dataset_role,
            "filename": dataset.filename,
            "file_size": dataset.file_size,
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
            "columns": meta["columns"],
            "column_types": meta["column_types"],
            "null_counts": meta["null_counts"],
            "duplicate_rows_count": meta["duplicate_rows_count"],
            "sample_records": meta["sample_records"]
        }

        return preview_data
