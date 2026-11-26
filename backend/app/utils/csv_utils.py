import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple

def inspect_csv(file_path: Path) -> Dict[str, Any]:
    """
    Inspects a CSV file using Pandas and returns structural metadata:
    row count, column count, column names, data types, null count, duplicate count,
    file size, and sample records.
    """
    df = pd.read_csv(file_path)
    file_size = file_path.stat().st_size
    
    # Handle NaN values
    df_clean = df.replace({np.nan: None})
    
    column_types = {col: str(df[col].dtype) for col in df.columns}
    null_counts = {col: int(df[col].isna().sum()) for col in df.columns}
    
    # Count duplicates based on all columns
    duplicate_rows_count = int(df.duplicated().sum())
    
    # Sample records (up to 10 rows)
    sample_records = df_clean.head(10).to_dict(orient="records")
    
    return {
        "filename": file_path.name,
        "file_size": file_size,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "column_types": column_types,
        "null_counts": null_counts,
        "duplicate_rows_count": duplicate_rows_count,
        "sample_records": sample_records,
    }

def load_csv_dataframe(file_path: Path) -> pd.DataFrame:
    """
    Loads CSV into a clean Pandas DataFrame.
    """
    df = pd.read_csv(file_path)
    return df
