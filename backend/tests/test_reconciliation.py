import pytest
import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.services.reconciliation_service import ReconciliationService
from backend.app.services.kpi_service import KPIService

client = TestClient(app)

def test_reconciliation_and_kpi_calculation():
    csv_a = "record_id,customer_id,transaction_id,amount\nRA1,C90,T90,500\nRA2,C91,T91,600\n"
    csv_b = "record_id,customer_id,transaction_id,amount\nRB1,C90,T90,500\nRB3,C92,T92,700\n"

    res_a = client.post("/api/upload/dataset-a", files={"file": ("rec_a.csv", io.BytesIO(csv_a.encode()), "text/csv")})
    res_b = client.post("/api/upload/dataset-b", files={"file": ("rec_b.csv", io.BytesIO(csv_b.encode()), "text/csv")})

    ds_a_id = res_a.json()["id"]
    ds_b_id = res_b.json()["id"]

    db = SessionLocal()
    try:
        # Run reconciliation
        rec_res = ReconciliationService.run_reconciliation(ds_a_id, ds_b_id, db)
        assert rec_res["total_source_a_records"] == 2
        assert rec_res["total_source_b_records"] == 2
        assert rec_res["status"] in ["PASS", "WARNING"]

        # Run KPI calculation
        kpis = KPIService.calculate_kpis("RUN_TEST", 125.5, db)
        assert kpis["kpi_1_attribution_precision"] >= 0.0
        assert kpis["kpi_3_reconciliation_accuracy"] >= 0.0
        assert kpis["kpi_5_runtime_overhead_ms"] == 125.5
        assert kpis["kpi_6_lineage_coverage"] >= 0.0
    finally:
        db.close()
