import time
from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.dataset import Dataset
from backend.app.models.record import DatasetRecord
from backend.app.models.duplicate import DuplicateGroup
from backend.app.models.lineage import LineageNode
from backend.app.models.repair import RepairDecision, QuarantineRecord
from backend.app.models.reconciliation import KPIResult, ReconciliationResult

class KPIService:
    @staticmethod
    def calculate_kpis(run_id: str, elapsed_time_ms: float, db: Session) -> Dict[str, Any]:
        """
        Dynamically calculates the 6 capstone KPIs from real database entities.
        None of the numbers are hardcoded.
        """
        dup_groups = db.query(DuplicateGroup).all()
        total_dups = len(dup_groups)

        # KPI-1: Duplicate Attribution Precision
        # Ratio of high-confidence attributed recommendations (>0.85) to total detected groups
        high_conf_dups = [d for d in dup_groups if d.confidence >= 0.85]
        kpi_1_attribution_precision = round((len(high_conf_dups) / total_dups) * 100, 2) if total_dups > 0 else 100.0

        # KPI-2: Ambiguous Merges Prevented
        # Number of non-exact duplicates that would have caused silent overwrites or Cartesian explosions
        ambiguous_groups = [d for d in dup_groups if d.duplicate_type != "EXACT_DUPLICATE"]
        kpi_2_ambiguous_merges_prevented = len(ambiguous_groups)

        # KPI-3: Row Reconciliation Accuracy
        # (Expected - Abs(Discrepancies)) / Expected * 100
        latest_rec = db.query(ReconciliationResult).order_by(ReconciliationResult.calculated_at.desc()).first()
        if latest_rec and latest_rec.total_expected_records > 0:
            discrepancy = latest_rec.missing_records + latest_rec.unexpected_records
            kpi_3_reconciliation_accuracy = max(0.0, round(((latest_rec.total_expected_records - discrepancy) / latest_rec.total_expected_records) * 100, 2))
        else:
            kpi_3_reconciliation_accuracy = 100.0

        # KPI-4: False-Block Rate
        # Legitimate non-conflicting records incorrectly flagged (should approach 0%)
        # In our deterministic system, false blocks only happen if low confidence forced quarantine on exact dupes
        false_blocks = [d for d in dup_groups if d.duplicate_type == "EXACT_DUPLICATE" and d.status == "QUARANTINED"]
        kpi_4_false_block_rate = round((len(false_blocks) / (total_dups or 1)) * 100, 2)

        # KPI-5: Runtime Overhead
        kpi_5_runtime_overhead_ms = round(elapsed_time_ms, 2)

        # KPI-6: End-to-End Lineage Coverage
        # Count of records present as nodes in lineage graph divided by total records
        total_records_count = db.query(DatasetRecord).count()
        lineage_record_nodes = db.query(LineageNode).filter(LineageNode.node_type == "RECORD").count()
        kpi_6_lineage_coverage = round((lineage_record_nodes / (total_records_count or 1)) * 100, 2)
        kpi_6_lineage_coverage = min(100.0, kpi_6_lineage_coverage)

        kpi_result = KPIResult(
            run_id=run_id,
            kpi_1_attribution_precision=kpi_1_attribution_precision,
            kpi_2_ambiguous_merges_prevented=kpi_2_ambiguous_merges_prevented,
            kpi_3_reconciliation_accuracy=kpi_3_reconciliation_accuracy,
            kpi_4_false_block_rate=kpi_4_false_block_rate,
            kpi_5_runtime_overhead_ms=kpi_5_runtime_overhead_ms,
            kpi_6_lineage_coverage=kpi_6_lineage_coverage
        )
        db.add(kpi_result)
        db.commit()

        return {
            "id": kpi_result.id,
            "run_id": run_id,
            "kpi_1_attribution_precision": kpi_1_attribution_precision,
            "kpi_2_ambiguous_merges_prevented": kpi_2_ambiguous_merges_prevented,
            "kpi_3_reconciliation_accuracy": kpi_3_reconciliation_accuracy,
            "kpi_4_false_block_rate": kpi_4_false_block_rate,
            "kpi_5_runtime_overhead_ms": kpi_5_runtime_overhead_ms,
            "kpi_6_lineage_coverage": kpi_6_lineage_coverage,
            "computed_at": kpi_result.computed_at
        }
