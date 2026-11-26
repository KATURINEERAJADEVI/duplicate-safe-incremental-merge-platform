import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.dataset import Dataset
from backend.app.utils.csv_utils import inspect_csv
from backend.app.utils.validation import compare_schemas, suggest_business_keys

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["type"] == "MySQL"

def test_csv_validation_and_inspection(tmp_path):
    csv_file = tmp_path / "test.csv"
    csv_file.write_text("id,name,amount\n1,Alice,100\n2,Bob,200\n1,Alice,100\n")
    meta = inspect_csv(csv_file)
    assert meta["row_count"] == 3
    assert meta["column_count"] == 3
    assert meta["duplicate_rows_count"] == 1
    assert "name" in meta["columns"]

def test_schema_comparison():
    cols_a = ["customer_id", "transaction_id", "amount", "status"]
    cols_b = ["customer_id", "transaction_id", "vendor_id", "status"]
    common, a_only, b_only, is_comp, reason = compare_schemas(cols_a, cols_b)
    assert is_comp is True
    assert "customer_id" in common
    assert "transaction_id" in common
    assert a_only == ["amount"]
    assert b_only == ["vendor_id"]

def test_business_key_detection():
    common = ["customer_id", "transaction_id", "amount"]
    keys = suggest_business_keys(common)
    assert ["customer_id", "transaction_id"] in keys

def test_upload_dataset_a_and_b():
    csv_content_a = "record_id,customer_id,transaction_id,amount,version\nREC_A1,C101,TX1,100.0,1\nREC_A2,C102,TX2,250.0,1\n"
    csv_content_b = "record_id,customer_id,transaction_id,amount,version\nREC_B1,C101,TX1,100.0,2\nREC_B3,C103,TX3,500.0,1\n"
    
    file_a = ("test_a.csv", io.BytesIO(csv_content_a.encode('utf-8')), "text/csv")
    res_a = client.post("/api/upload/dataset-a", files={"file": file_a})
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["dataset_role"] == "SOURCE_A"
    assert data_a["row_count"] == 2

    file_b = ("test_b.csv", io.BytesIO(csv_content_b.encode('utf-8')), "text/csv")
    res_b = client.post("/api/upload/dataset-b", files={"file": file_b})
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["dataset_role"] == "SOURCE_B"
    assert data_b["row_count"] == 2
