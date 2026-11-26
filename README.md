# Duplicate-Safe Incremental Merge Diagnostics and Repair Platform
### B.Tech Data Engineering for AI Capstone Project

A production-grade, full-stack data engineering platform featuring **Lineage-Aware Duplicate Attribution** and **Deterministic Repair** for incremental data merge pipelines.

---

## 🌟 Key Contributions & Capabilities

1. **Exact Two-Dataset Upload System**: Accepts baseline Source Dataset A and incoming incremental Dataset B in arbitrary CSV schema formats.
2. **Dynamic Schema Alignment & Key Detection**: Automatically computes common attributes and allows composite business key selection (e.g. `customer_id + transaction_id`).
3. **Merge Simulation**: Simulates incremental merge into **Before Merge**, **After Merge**, and **Expected Result** models without modifying the original raw datasets.
4. **8-Class Duplicate Taxonomy**:
   - `EXACT_DUPLICATE` (Byte-for-byte identical payload)
   - `VERSION_CONFLICT` (Monotonic version discrepancy)
   - `LATE_ARRIVING_RECORD` (Out-of-order temporal arrival)
   - `SOURCE_CONFLICT` (Authority & priority clash)
   - `TEMPORAL_CONFLICT` (Contradictory state transitions)
   - `BUSINESS_KEY_CONFLICT` (Attribute divergence without timestamps)
   - `JOIN_MULTIPLICATION` (1-to-many Cartesian explosion risk)
   - `UNKNOWN` (Anomalous unclassified conflict)
5. **NetworkX Directed Acyclic Graph (DAG) Lineage**:
   - Explicitly traces: `Dataset -> Record -> Transformation -> Merge Operation -> Target Record`
   - Backwards graph traversal highlights the exact root causes of duplicates.
6. **Deterministic Attribution Engine**:
   - Strict hierarchical resolution rule order:
     1. Source Authority Priority (`CORE_BANKING` > `ONLINE_PORTAL` > `BRANCH_TELLER` > `MOBILE_APP` > `ATM_NETWORK` > `POS_TERMINAL`)
     2. Valid Event Time Precedence
     3. Version Monotonicity
     4. Attribute Completeness (lowest null ratio)
     5. Ingestion Chronology
7. **Zero Blind Deletions Policy**: Conflicting records are never silently erased; unresolvable records are isolated in Quarantine, and discarded competitors are recorded in an immutable compliance ledger.
8. **End-to-End Row Reconciliation & Live KPIs**:
   - Post-merge parity validation (`PASS`, `WARNING`, `FAIL`).
   - 6 Dynamic Capstone KPIs calculated in real time.

---

## 📁 Project Folder Structure

```
duplicate-safe-merge-platform/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint, CORS, routes & health check
│   │   ├── api/                        # REST API routers
│   │   │   ├── upload.py               # POST /api/upload/dataset-a, /dataset-b
│   │   │   ├── datasets.py             # GET /api/datasets, /compare-schemas
│   │   │   ├── analysis.py             # POST /api/analysis/start, GET /latest
│   │   │   ├── duplicates.py           # GET /api/duplicates, /{id}, /{id}/lineage
│   │   │   ├── lineage.py              # GET /api/lineage/full, /{duplicate_id}
│   │   │   ├── repairs.py              # GET /api/repairs, POST /approve, /reject, /quarantine
│   │   │   ├── reconciliation.py       # POST /api/reconciliation/run, GET /latest
│   │   │   ├── kpis.py                 # GET /api/kpis, GET /latest
│   │   │   └── audit.py                # GET /api/audit, POST /log
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic settings & DB connection string
│   │   │   └── database.py             # SQLAlchemy engine & session maker
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   │   ├── dataset.py              # datasets table
│   │   │   ├── record.py               # dataset_records table
│   │   │   ├── lineage.py              # lineage_nodes, lineage_edges tables
│   │   │   ├── duplicate.py            # duplicate_groups, duplicate_records tables
│   │   │   ├── repair.py               # repair_candidates, repair_decisions, quarantine_records
│   │   │   ├── reconciliation.py       # reconciliation_results, kpi_results
│   │   │   └── audit.py                # audit_logs table
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   │   ├── dataset.py, analysis.py, duplicate.py, lineage.py, repair.py, reconciliation.py
│   │   ├── services/                   # Modular business logic services
│   │   │   ├── upload_service.py
│   │   │   ├── validation_service.py
│   │   │   ├── merge_service.py
│   │   │   ├── duplicate_detection_service.py
│   │   │   ├── lineage_service.py
│   │   │   ├── root_cause_service.py
│   │   │   ├── attribution_service.py
│   │   │   ├── repair_service.py
│   │   │   ├── reconciliation_service.py
│   │   │   └── kpi_service.py
│   │   └── utils/
│   │       ├── csv_utils.py, hashing.py, validation.py
│   ├── tests/                          # 9 unit & integration tests (100% pass)
│   │   ├── test_upload.py, test_duplicates.py, test_lineage.py, test_repair.py, test_reconciliation.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── Navbar.jsx, Sidebar.jsx, StatCard.jsx, DatasetUpload.jsx, DatasetPreview.jsx
│   │   │   ├── BusinessKeySelector.jsx, DuplicateTable.jsx, DuplicateDetails.jsx
│   │   │   ├── LineageGraph.jsx (React Flow DAG), RepairModal.jsx, ReconciliationCard.jsx, KPIChart.jsx
│   │   ├── pages/                      # Application route pages
│   │   │   ├── Dashboard.jsx, Upload.jsx, DuplicateExplorer.jsx, LineageExplorer.jsx
│   │   │   ├── RepairCenter.jsx, Quarantine.jsx, Reconciliation.jsx, KPIs.jsx, AuditHistory.jsx
│   │   ├── services/
│   │   │   └── api.js                  # Centralized Axios API service layer
│   │   ├── App.jsx, main.jsx, index.css
│   ├── package.json, vite.config.js, Dockerfile
│
├── database/
│   └── init.sql                        # Complete DDL script for all 12 MySQL tables
├── sample_dataset_a.csv                # Baseline dataset with 10 records
├── sample_dataset_b.csv                # Incoming incremental dataset with version/temporal/source conflicts
├── docker-compose.yml
├── .env.example
├── .env
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **MySQL Server 8.0+**
- **Python 3.11+** (e.g. Anaconda or standalone Python)
- **Node.js v18+ & npm**

### 2. Database Setup (MySQL)
Make sure MySQL is running on port 3306.
Run the initialization script:
```bash
mysql -u root -p < database/init.sql
```
*(Enter your MySQL root password when prompted)*

### 3. Environment Configuration
Verify `.env` has your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=duplicate_safe_merge
MYSQL_USER=root
MYSQL_PASSWORD=your_password
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/duplicate_safe_merge
```

### 4. Running the Backend
From the root directory:
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run backend with Uvicorn
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: **http://localhost:8000/docs**

### 5. Running the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: **http://localhost:5173**

---

## 🐳 Docker Deployment
To run the full stack (MySQL + FastAPI Backend + React Frontend) with a single command:
```bash
docker-compose up --build
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Swagger Docs**: http://localhost:8000/docs
- **MySQL**: `localhost:3306`

---

## 🧪 Testing & Validation Suite
Run the test suite:
```bash
pytest backend/tests -v
```
All 9 test suites validate:
1. Dataset upload & CSV inspection
2. Dynamic schema comparison & business key detection
3. 8-class duplicate classification
4. NetworkX DAG construction & backwards traversal
5. Root-cause diagnostic formulation
6. Attribution rule priority execution
7. Repair approval, rejection, and quarantine isolation
8. Row reconciliation accounting
9. Dynamic KPI metric evaluation

---

## 📊 Capstone KPIs & Formulations

| KPI ID | Name | Mathematical Formula | Purpose |
| :--- | :--- | :--- | :--- |
| **KPI-1** | **Duplicate Attribution Precision** | `N_verified_attributions / N_total_duplicate_groups` | Measures accuracy of automated record recommendations |
| **KPI-2** | **Ambiguous Merges Prevented** | `Count(Complex conflicts intercepted prior to target insertion)` | Measures protection against silent data pollution |
| **KPI-3** | **Row Reconciliation Accuracy** | `(R_expected - \|R_missing + R_unexpected\|) / R_expected * 100` | Verifies zero record loss across merges |
| **KPI-4** | **False-Block Rate** | `N_false_quarantined / N_valid_records * 100` | Verifies non-conflicting records are not blocked |
| **KPI-5** | **Runtime Overhead** | `t_pipeline_end - t_pipeline_start (ms)` | Measures latency overhead of DAG generation & attribution |
| **KPI-6** | **End-to-End Lineage Coverage** | `N_mapped_dag_records / N_input_records * 100` | Verifies 100% provenance from source to target |

---

## 🎓 Viva & Technical Architecture Explanation

### 1. Lineage-Aware Duplicate Attribution Algorithm
Standard deduplication platforms rely on `DROP DUPLICATES` or simple primary-key collisions without provenance. In this platform, NetworkX models an end-to-end directed acyclic graph:
`DATASET ➔ RECORD ➔ TRANSFORMATION ➔ MERGE ➔ TARGET`
When a duplicate occurs on a business key (e.g. `CUST_1001-TXN_9001`), backward graph traversal (`nx.ancestors`) walks upstream from the conflicting `MERGE` node to isolate every contributing record, transformation step, and original data source.

### 2. Attribution Hierarchy
When two records compete for the same business key:
1. **Source Authority**: Records from verified core systems override unverified edge portals.
2. **Temporal Precedence**: Valid newer events take precedence over stale state transitions.
3. **Version Monotonicity**: Incremental updates with higher version IDs take precedence.
4. **Data Completeness**: If versions and timestamps tie, the record with fewer null attributes is preferred.
5. **Chronological Ingestion**: Fallback to pipeline receipt timestamp.
If none of these rules deterministically breaks the tie, the records are **Quarantined**—preventing blind deletion and corruption.

### 3. Deterministic Repair & Audit Immutability
When an engineer approves an attribution decision:
- The preferred record is promoted to the target table.
- The competing record is preserved in the `audit_logs` ledger with full payload metadata, authorizing user ID, timestamp, and justification reason.
- Zero data loss occurs, ensuring full compliance and reversible auditability.
