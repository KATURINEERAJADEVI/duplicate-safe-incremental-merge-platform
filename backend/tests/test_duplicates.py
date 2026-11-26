import pytest
import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.services.duplicate_detection_service import DuplicateDetectionService
from backend.app.services.root_cause_service import RootCauseService
from backend.app.services.attribution_service import AttributionService
from backend.app.models.record import DatasetRecord

client = TestClient(app)

def test_duplicate_detection_and_classification():
    csv_a = "record_id,customer_id,transaction_id,amount,version,source_id,event_time\nREC1,C1,TX1,100,1,ATM,2026-01-01 10:00:00\nREC2,C2,TX2,200,1,POS,2026-01-01 11:00:00\n"
    csv_b = "record_id,customer_id,transaction_id,amount,version,source_id,event_time\nREC1,C1,TX1,100,2,ATM,2026-01-01 10:05:00\nREC3,C3,TX3,300,1,WEB,2026-01-01 12:00:00\n"

    res_a = client.post("/api/upload/dataset-a", files={"file": ("a.csv", io.BytesIO(csv_a.encode()), "text/csv")})
    res_b = client.post("/api/upload/dataset-b", files={"file": ("b.csv", io.BytesIO(csv_b.encode()), "text/csv")})

    ds_a_id = res_a.json()["id"]
    ds_b_id = res_b.json()["id"]

    db = SessionLocal()
    try:
        dup_groups = DuplicateDetectionService.detect_duplicates(ds_a_id, ds_b_id, ["customer_id", "transaction_id"], db)
        assert len(dup_groups) >= 1
        dg = dup_groups[0]
        assert dg.business_key == "C1-TX1"
        assert dg.duplicate_type == "VERSION_CONFLICT"
        assert dg.root_cause == "VERSION_CONFLICT"
        assert dg.recommended_action == "ACCEPT_B"
        assert dg.confidence >= 0.90

        # Root cause diagnostic verification
        rc_info = RootCauseService.analyze_root_cause(dg, db)
        assert rc_info["confidence"] >= 0.90
        assert "VERSION_CONFLICT" in rc_info["root_cause"]

        # Attribution engine verification
        attr_info = AttributionService.evaluate_attribution(dg, db)
        assert attr_info["recommended_action"] == "ACCEPT_B"
        assert "Event time precedence" in attr_info["reason"] or "Version" in attr_info["reason"]
    finally:
        db.close()
