import pytest
import io
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.services.duplicate_detection_service import DuplicateDetectionService
from backend.app.services.lineage_service import LineageService

client = TestClient(app)

def test_lineage_generation_and_traversal():
    csv_a = "record_id,customer_id,transaction_id,amount\nRA1,C10,T10,50\n"
    csv_b = "record_id,customer_id,transaction_id,amount\nRB1,C10,T10,50\n"

    res_a = client.post("/api/upload/dataset-a", files={"file": ("lineage_a.csv", io.BytesIO(csv_a.encode()), "text/csv")})
    res_b = client.post("/api/upload/dataset-b", files={"file": ("lineage_b.csv", io.BytesIO(csv_b.encode()), "text/csv")})

    ds_a_id = res_a.json()["id"]
    ds_b_id = res_b.json()["id"]

    db = SessionLocal()
    try:
        # Detect duplicates
        dup_groups = DuplicateDetectionService.detect_duplicates(ds_a_id, ds_b_id, ["customer_id", "transaction_id"], db)
        assert len(dup_groups) >= 1
        dg_id = dup_groups[0].duplicate_group_id

        # Generate Lineage Graph
        stats = LineageService.build_lineage_graph(ds_a_id, ds_b_id, ["customer_id", "transaction_id"], db)
        assert stats["total_nodes"] > 0
        assert stats["total_edges"] > 0
        assert stats["is_dag"] is True

        # Test Backwards Lineage Traversal
        traversed = LineageService.get_lineage_for_duplicate(dg_id, db)
        assert traversed["summary"]["nodes_count"] > 0
        assert traversed["summary"]["highlighted_count"] > 0

        # Verify that all 5 lineage hierarchy stages exist
        node_types = set(n["data"]["node_type"] for n in traversed["nodes"])
        assert "DATASET" in node_types
        assert "RECORD" in node_types
        assert "TRANSFORMATION" in node_types
        assert "MERGE" in node_types
        assert "TARGET" in node_types
    finally:
        db.close()
