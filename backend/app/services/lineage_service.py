import json
from typing import List, Dict, Any, Optional
import networkx as nx
from sqlalchemy.orm import Session

from backend.app.models.dataset import Dataset
from backend.app.models.record import DatasetRecord
from backend.app.models.lineage import LineageNode, LineageEdge
from backend.app.models.duplicate import DuplicateGroup

class LineageService:
    @staticmethod
    def build_lineage_graph(
        dataset_a_id: int, 
        dataset_b_id: int, 
        key_columns: List[str], 
        db: Session
    ) -> Dict[str, Any]:
        """
        Constructs a complete lineage Directed Acyclic Graph (DAG) using NetworkX.
        Persists nodes and edges into MySQL tables lineage_nodes and lineage_edges.
        """
        # Clear existing lineage
        db.query(LineageEdge).delete()
        db.query(LineageNode).delete()
        db.commit()

        G = nx.DiGraph()

        ds_a = db.query(Dataset).filter(Dataset.id == dataset_a_id).first()
        ds_b = db.query(Dataset).filter(Dataset.id == dataset_b_id).first()

        recs_a = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_a_id).all()
        recs_b = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_b_id).all()

        nodes_to_insert = []
        edges_to_insert = []

        # 1. Dataset Root Nodes
        node_ds_a = f"DATASET_{ds_a.id}_A"
        node_ds_b = f"DATASET_{ds_b.id}_B"

        G.add_node(node_ds_a, node_type="DATASET", label=f"Dataset A: {ds_a.dataset_name}", dataset_id=ds_a.id)
        G.add_node(node_ds_b, node_type="DATASET", label=f"Dataset B: {ds_b.dataset_name}", dataset_id=ds_b.id)

        nodes_to_insert.append(LineageNode(
            node_id=node_ds_a,
            node_type="DATASET",
            dataset_id=ds_a.id,
            metadata_json={"role": "SOURCE_A", "filename": ds_a.filename, "rows": ds_a.row_count}
        ))
        nodes_to_insert.append(LineageNode(
            node_id=node_ds_b,
            node_type="DATASET",
            dataset_id=ds_b.id,
            metadata_json={"role": "SOURCE_B", "filename": ds_b.filename, "rows": ds_b.row_count}
        ))

        # Track merge and target nodes by business key
        merge_nodes_created = set()
        target_nodes_created = set()

        # Helper for adding record paths
        def process_dataset_records(records, parent_ds_node, role_suffix):
            for r in records:
                rec_node_id = f"REC_{role_suffix}_{r.id}"
                trans_node_id = f"TRANS_{role_suffix}_{r.id}"
                safe_bk = r.business_key.replace(" ", "_")
                merge_node_id = f"MERGE_{safe_bk}"
                target_node_id = f"TARGET_{safe_bk}"

                # Record Node
                rec_label = f"Record {role_suffix}: {r.record_json.get('record_id', r.id)}"
                G.add_node(rec_node_id, node_type="RECORD", label=rec_label, record_id=r.id)
                nodes_to_insert.append(LineageNode(
                    node_id=rec_node_id,
                    node_type="RECORD",
                    dataset_id=r.dataset_id,
                    record_id=r.id,
                    metadata_json={"business_key": r.business_key, "payload": r.record_json}
                ))

                # Edge: Dataset -> Record
                G.add_edge(parent_ds_node, rec_node_id, relationship="CONTAINS")
                edges_to_insert.append(LineageEdge(
                    from_node=parent_ds_node,
                    to_node=rec_node_id,
                    relationship="CONTAINS"
                ))

                # Transformation Node
                trans_label = f"Standardize & Validate ({role_suffix})"
                G.add_node(trans_node_id, node_type="TRANSFORMATION", label=trans_label)
                nodes_to_insert.append(LineageNode(
                    node_id=trans_node_id,
                    node_type="TRANSFORMATION",
                    operation_id=f"OP_VALIDATE_{role_suffix}",
                    metadata_json={"type": "NORMALIZATION", "applied_key": key_columns}
                ))

                # Edge: Record -> Transformation
                G.add_edge(rec_node_id, trans_node_id, relationship="STANDARDIZED_BY")
                edges_to_insert.append(LineageEdge(
                    from_node=rec_node_id,
                    to_node=trans_node_id,
                    relationship="STANDARDIZED_BY"
                ))

                # Merge Node
                if merge_node_id not in merge_nodes_created:
                    merge_label = f"Merge Op [{r.business_key}]"
                    G.add_node(merge_node_id, node_type="MERGE", label=merge_label)
                    nodes_to_insert.append(LineageNode(
                        node_id=merge_node_id,
                        node_type="MERGE",
                        operation_id=f"OP_MERGE_{safe_bk}",
                        metadata_json={"business_key": r.business_key}
                    ))
                    merge_nodes_created.add(merge_node_id)

                # Edge: Transformation -> Merge
                G.add_edge(trans_node_id, merge_node_id, relationship="INPUT_TO_MERGE")
                edges_to_insert.append(LineageEdge(
                    from_node=trans_node_id,
                    to_node=merge_node_id,
                    relationship="INPUT_TO_MERGE"
                ))

                # Target Node
                if target_node_id not in target_nodes_created:
                    target_label = f"Target Record [{r.business_key}]"
                    G.add_node(target_node_id, node_type="TARGET", label=target_label)
                    nodes_to_insert.append(LineageNode(
                        node_id=target_node_id,
                        node_type="TARGET",
                        metadata_json={"business_key": r.business_key, "status": "DEDUPLICATED"}
                    ))
                    target_nodes_created.add(target_node_id)

                    # Edge: Merge -> Target
                    G.add_edge(merge_node_id, target_node_id, relationship="PRODUCES_TARGET")
                    edges_to_insert.append(LineageEdge(
                        from_node=merge_node_id,
                        to_node=target_node_id,
                        relationship="PRODUCES_TARGET"
                    ))

        process_dataset_records(recs_a, node_ds_a, "A")
        process_dataset_records(recs_b, node_ds_b, "B")

        db.bulk_save_objects(nodes_to_insert)
        db.bulk_save_objects(edges_to_insert)
        db.commit()

        return {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "is_dag": nx.is_directed_acyclic_graph(G),
            "merge_operations_count": len(merge_nodes_created),
            "target_records_count": len(target_nodes_created)
        }

    @staticmethod
    def get_lineage_for_duplicate(duplicate_group_id: str, db: Session) -> Dict[str, Any]:
        """
        Traverses the NetworkX lineage graph backwards for a specific duplicate group.
        Shows exact path:
        Source Dataset -> Source Record -> Transformation -> Merge Operation -> Target Record
        and provides highlighted React Flow format.
        """
        dup_group = db.query(DuplicateGroup).filter(DuplicateGroup.duplicate_group_id == duplicate_group_id).first()
        if not dup_group:
            return LineageService.get_full_lineage(db=db)

        # Retrieve all lineage nodes and edges
        all_nodes = db.query(LineageNode).all()
        all_edges = db.query(LineageEdge).all()

        G = nx.DiGraph()
        for n in all_nodes:
            G.add_node(n.node_id, node_type=n.node_type, metadata=n.metadata_json or {})
        for e in all_edges:
            G.add_edge(e.from_node, e.to_node, relationship=e.relationship)

        safe_bk = dup_group.business_key.replace(" ", "_")
        target_node_id = f"TARGET_{safe_bk}"
        merge_node_id = f"MERGE_{safe_bk}"

        # Backward traversal: find all ancestors of target/merge node
        highlighted_nodes = set()
        if target_node_id in G:
            ancestors = nx.ancestors(G, target_node_id)
            highlighted_nodes = ancestors.union({target_node_id, merge_node_id})
        elif merge_node_id in G:
            ancestors = nx.ancestors(G, merge_node_id)
            highlighted_nodes = ancestors.union({merge_node_id})

        # Also find direct records involved
        if dup_group.dataset_a_record_id:
            highlighted_nodes.add(f"REC_A_{dup_group.dataset_a_record_id}")
            highlighted_nodes.add(f"TRANS_A_{dup_group.dataset_a_record_id}")
        if dup_group.dataset_b_record_id:
            highlighted_nodes.add(f"REC_B_{dup_group.dataset_b_record_id}")
            highlighted_nodes.add(f"TRANS_B_{dup_group.dataset_b_record_id}")

        return LineageService._format_react_flow(all_nodes, all_edges, highlighted_nodes, duplicate_group_id)

    @staticmethod
    def get_full_lineage(db: Session) -> Dict[str, Any]:
        """
        Returns the entire lineage graph formatted for React Flow.
        """
        all_nodes = db.query(LineageNode).all()
        all_edges = db.query(LineageEdge).all()
        return LineageService._format_react_flow(all_nodes, all_edges, set(), None)

    @staticmethod
    def _format_react_flow(nodes: List[LineageNode], edges: List[LineageEdge], highlighted: set, dg_id: Optional[str]) -> Dict[str, Any]:
        """
        Calculates 2D canvas coordinates (x, y) by stage hierarchy:
        Stage 0: DATASET (x = 50)
        Stage 1: RECORD (x = 350)
        Stage 2: TRANSFORMATION (x = 650)
        Stage 3: MERGE (x = 950)
        Stage 4: TARGET (x = 1250)
        """
        stage_order = {
            "DATASET": 0,
            "RECORD": 1,
            "TRANSFORMATION": 2,
            "MERGE": 3,
            "TARGET": 4
        }

        # Filter nodes if a specific duplicate group is selected to keep graph clean and readable
        nodes_to_render = nodes
        if highlighted:
            nodes_to_render = [n for n in nodes if n.node_id in highlighted]

        # Count items per stage for clean vertical spacing
        stage_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
        rf_nodes = []
        for n in nodes_to_render:
            stage = stage_order.get(n.node_type, 2)
            y_pos = 60 + stage_counts[stage] * 120
            stage_counts[stage] += 1

            is_hl = n.node_id in highlighted if highlighted else False

            rf_nodes.append({
                "id": n.node_id,
                "type": "default",
                "position": {"x": 50 + stage * 280, "y": y_pos},
                "data": {
                    "label": f"[{n.node_type}] {n.node_id}",
                    "node_id": n.node_id,
                    "node_type": n.node_type,
                    "dataset_id": n.dataset_id,
                    "record_id": n.record_id,
                    "metadata": n.metadata_json or {},
                    "is_highlighted": is_hl
                }
            })

        active_node_ids = set(n["id"] for n in rf_nodes)
        rf_edges = []
        for e in edges:
            if e.from_node in active_node_ids and e.to_node in active_node_ids:
                is_edge_hl = (e.from_node in highlighted and e.to_node in highlighted) if highlighted else False
                rf_edges.append({
                    "id": f"e_{e.from_node}_{e.to_node}",
                    "source": e.from_node,
                    "target": e.to_node,
                    "label": e.relationship,
                    "animated": is_edge_hl,
                    "style": {
                        "stroke": "#06b6d4" if is_edge_hl else "#64748b",
                        "strokeWidth": 3 if is_edge_hl else 1.5
                    }
                })

        return {
            "duplicate_group_id": dg_id,
            "nodes": rf_nodes,
            "edges": rf_edges,
            "summary": {
                "nodes_count": len(rf_nodes),
                "edges_count": len(rf_edges),
                "highlighted_count": len(highlighted)
            },
            "lineage_stats": {str(k): v for k, v in stage_counts.items()}
        }
