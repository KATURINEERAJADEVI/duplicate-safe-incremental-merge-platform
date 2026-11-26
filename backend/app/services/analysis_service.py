import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.dataset import Dataset
from backend.app.models.audit import AuditLog
from backend.app.services.validation_service import ValidationService
from backend.app.services.merge_service import MergeService
from backend.app.services.duplicate_detection_service import DuplicateDetectionService
from backend.app.services.lineage_service import LineageService
from backend.app.services.root_cause_service import RootCauseService
from backend.app.services.attribution_service import AttributionService
from backend.app.services.reconciliation_service import ReconciliationService
from backend.app.services.kpi_service import KPIService

class AnalysisService:
    @staticmethod
    def run_full_pipeline(
        dataset_a_id: int, 
        dataset_b_id: int, 
        key_columns: List[str], 
        source_priorities: Optional[Dict[str, int]], 
        db: Session
    ) -> Dict[str, Any]:
        """
        Orchestrates the entire Duplicate-Safe Merge pipeline:
        1. Schema validation & pre-merge uniqueness
        2. Merge simulation (A + B)
        3. Duplicate detection & classification
        4. Lineage DAG graph construction (NetworkX)
        5. Root-cause analysis & confidence calculation
        6. Attribution & repair candidate generation
        7. Initial reconciliation snapshot
        8. Dynamic KPI computation
        """
        start_time = time.time()
        run_id = f"RUN-{uuid.uuid4().hex[:8].upper()}"

        ds_a = db.query(Dataset).filter(Dataset.id == dataset_a_id).first()
        ds_b = db.query(Dataset).filter(Dataset.id == dataset_b_id).first()
        if not ds_a or not ds_b:
            raise HTTPException(status_code=404, detail="Dataset A or Dataset B not found.")

        steps_log = []

        # Step 1: Schema Validation
        s1_start = time.time()
        schema_comp = ValidationService.compare_uploaded_datasets(dataset_a_id, dataset_b_id, db)
        if not schema_comp["is_compatible"]:
            raise HTTPException(status_code=400, detail=schema_comp["compatibility_reason"])
        steps_log.append({
            "step_id": "SCHEMA_VALIDATION",
            "name": "Schema Validation & Compatibility",
            "status": "completed",
            "duration_ms": round((time.time() - s1_start) * 1000, 2),
            "details": f"Verified {len(schema_comp['common_columns'])} shared attributes."
        })

        # Step 2: Pre-merge Uniqueness Check
        s2_start = time.time()
        uniq_a = ValidationService.validate_pre_merge_uniqueness(dataset_a_id, key_columns, db)
        uniq_b = ValidationService.validate_pre_merge_uniqueness(dataset_b_id, key_columns, db)
        steps_log.append({
            "step_id": "PRE_MERGE_UNIQUENESS",
            "name": "Pre-Merge Uniqueness Check",
            "status": "completed",
            "duration_ms": round((time.time() - s2_start) * 1000, 2),
            "details": f"Dataset A unique keys: {uniq_a['unique_keys']}, Dataset B unique keys: {uniq_b['unique_keys']}."
        })

        # Step 3: Merge Simulation
        s3_start = time.time()
        sim_result = MergeService.simulate_incremental_merge(dataset_a_id, dataset_b_id, key_columns, db)
        steps_log.append({
            "step_id": "SIMULATE_MERGE",
            "name": "Incremental Merge Simulation",
            "status": "completed",
            "duration_ms": round((time.time() - s3_start) * 1000, 2),
            "details": f"Simulated {sim_result['naive_after_merge']['total_rows']} total rows with {len(sim_result['overlapping_keys'])} overlapping business keys."
        })

        # Step 4: Duplicate Detection
        s4_start = time.time()
        dup_groups = DuplicateDetectionService.detect_duplicates(dataset_a_id, dataset_b_id, key_columns, db)
        steps_log.append({
            "step_id": "DETECT_DUPLICATES",
            "name": "Lineage-Aware Duplicate Detection",
            "status": "completed",
            "duration_ms": round((time.time() - s4_start) * 1000, 2),
            "details": f"Identified {len(dup_groups)} conflicting duplicate groups."
        })

        # Step 5: Build Lineage Graph
        s5_start = time.time()
        lineage_stats = LineageService.build_lineage_graph(dataset_a_id, dataset_b_id, key_columns, db)
        steps_log.append({
            "step_id": "BUILD_LINEAGE",
            "name": "Lineage DAG Construction",
            "status": "completed",
            "duration_ms": round((time.time() - s5_start) * 1000, 2),
            "details": f"Constructed NetworkX graph with {lineage_stats['total_nodes']} nodes and {lineage_stats['total_edges']} edges."
        })

        # Step 6: Root Cause & Attribution
        s6_start = time.time()
        for dg in dup_groups:
            RootCauseService.analyze_root_cause(dg, db)
            AttributionService.evaluate_attribution(dg, db, source_priorities)
        steps_log.append({
            "step_id": "ROOT_CAUSE_ATTRIBUTION",
            "name": "Root-Cause & Attribution Diagnostics",
            "status": "completed",
            "duration_ms": round((time.time() - s6_start) * 1000, 2),
            "details": "Attributed root cause and generated deterministic repair recommendations."
        })

        # Step 7: Reconciliation
        s7_start = time.time()
        rec_summary = ReconciliationService.run_reconciliation(dataset_a_id, dataset_b_id, db)
        steps_log.append({
            "step_id": "RECONCILIATION",
            "name": "Row Reconciliation",
            "status": "completed",
            "duration_ms": round((time.time() - s7_start) * 1000, 2),
            "details": f"Reconciliation status: {rec_summary['status']} (Expected: {rec_summary['total_expected_records']}, Actual: {rec_summary['total_actual_records']})."
        })

        # Step 8: Dynamic KPIs
        s8_start = time.time()
        total_elapsed_ms = (time.time() - start_time) * 1000
        kpi_summary = KPIService.calculate_kpis(run_id, total_elapsed_ms, db)
        steps_log.append({
            "step_id": "KPI_CALCULATION",
            "name": "Performance & Quality KPIs",
            "status": "completed",
            "duration_ms": round((time.time() - s8_start) * 1000, 2),
            "details": f"KPI-1 Precision: {kpi_summary['kpi_1_attribution_precision']}%, Ambiguous Prevented: {kpi_summary['kpi_2_ambiguous_merges_prevented']}."
        })

        # Update dataset statuses
        ds_a.status = "ANALYZED"
        ds_b.status = "ANALYZED"

        audit = AuditLog(
            operation="ANALYSIS_COMPLETED",
            dataset=f"{ds_a.dataset_name} + {ds_b.dataset_name}",
            reason=f"Pipeline run {run_id} completed successfully in {round(total_elapsed_ms, 2)}ms.",
            user="Data Engineer",
            metadata_json={"run_id": run_id, "total_dups": len(dup_groups), "business_key": key_columns}
        )
        db.add(audit)
        db.commit()

        exact_count = sum(1 for d in dup_groups if d.duplicate_type == "EXACT_DUPLICATE")
        conflicts_count = len(dup_groups) - exact_count
        quarantine_candidates = sum(1 for d in dup_groups if d.recommended_action == "QUARANTINE")

        return {
            "run_id": run_id,
            "dataset_a_id": dataset_a_id,
            "dataset_b_id": dataset_b_id,
            "business_key": key_columns,
            "started_at": datetime.utcfromtimestamp(start_time),
            "completed_at": datetime.utcnow(),
            "status": "COMPLETED",
            "total_elapsed_ms": round(total_elapsed_ms, 2),
            "steps": steps_log,
            "total_a_records": ds_a.row_count,
            "total_b_records": ds_b.row_count,
            "duplicate_groups_count": len(dup_groups),
            "exact_duplicates": exact_count,
            "conflicting_records": conflicts_count,
            "quarantine_candidates": quarantine_candidates,
            "reconciliation_status": rec_summary["status"],
            "kpis": kpi_summary
        }
