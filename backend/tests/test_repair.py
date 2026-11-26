import pytest
import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.services.duplicate_detection_service import DuplicateDetectionService
from backend.app.services.repair_service import RepairService
from backend.app.models.duplicate import DuplicateGroup
from backend.app.models.repair import RepairDecision, QuarantineRecord

client = TestClient(app)

def test_repair_approval_and_quarantine():
    csv_a = "record_id,customer_id,transaction_id,amount,version\nRA1,C50,T50,100,1\n"
    csv_b = "record_id,customer_id,transaction_id,amount,version\nRB1,C50,T50,100,2\n"

    res_a = client.post("/api/upload/dataset-a", files={"file": ("rep_a.csv", io.BytesIO(csv_a.encode()), "text/csv")})
    res_b = client.post("/api/upload/dataset-b", files={"file": ("rep_b.csv", io.BytesIO(csv_b.encode()), "text/csv")})

    ds_a_id = res_a.json()["id"]
    ds_b_id = res_b.json()["id"]

    db = SessionLocal()
    try:
        dup_groups = DuplicateDetectionService.detect_duplicates(ds_a_id, ds_b_id, ["customer_id", "transaction_id"], db)
        dg_id = dup_groups[0].duplicate_group_id

        # Approve repair
        appr_res = RepairService.approve_repair(dg_id, "Senior DE", "Approved higher version update", db)
        assert appr_res["status"] == "APPROVED"
        assert appr_res["decision"] == "ACCEPT_B"

        # Check DB decision record
        dec = db.query(RepairDecision).filter(RepairDecision.duplicate_group_id == dg_id).first()
        assert dec is not None
        assert dec.executed is True

        # Test quarantine
        quar_res = RepairService.quarantine_duplicate(dg_id, "Senior DE", "Manual quarantine test", db)
        assert quar_res["status"] == "QUARANTINED"

        quar_rec = db.query(QuarantineRecord).filter(QuarantineRecord.duplicate_group_id == dg_id).first()
        assert quar_rec is not None
        assert quar_rec.status == "PENDING"
    finally:
        db.close()
