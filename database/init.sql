-- Duplicate-Safe Incremental Merge Diagnostics and Repair Platform
-- MySQL Database Initialization Script

CREATE DATABASE IF NOT EXISTS duplicate_safe_merge 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE duplicate_safe_merge;

-- 1. Datasets Table
CREATE TABLE IF NOT EXISTS datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    dataset_role ENUM('SOURCE_A', 'SOURCE_B') NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    column_count INT NOT NULL DEFAULT 0,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'UPLOADED',
    INDEX idx_dataset_role (dataset_role),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB;

-- 2. Dataset Records Table
CREATE TABLE IF NOT EXISTS dataset_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    record_hash VARCHAR(64) NOT NULL,
    business_key VARCHAR(255) NOT NULL,
    record_json JSON NOT NULL,
    source_id VARCHAR(100) NULL,
    event_time DATETIME NULL,
    ingestion_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    INDEX idx_business_key (business_key),
    INDEX idx_record_hash (record_hash),
    INDEX idx_dataset_id (dataset_id)
) ENGINE=InnoDB;

-- 3. Lineage Nodes Table
CREATE TABLE IF NOT EXISTS lineage_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id VARCHAR(100) NOT NULL UNIQUE,
    node_type ENUM('DATASET', 'RECORD', 'TRANSFORMATION', 'MERGE', 'TARGET') NOT NULL,
    dataset_id INT NULL,
    record_id INT NULL,
    operation_id VARCHAR(100) NULL,
    metadata_json JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_node_id (node_id),
    INDEX idx_node_type (node_type)
) ENGINE=InnoDB;

-- 4. Lineage Edges Table
CREATE TABLE IF NOT EXISTS lineage_edges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_node VARCHAR(100) NOT NULL,
    to_node VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    operation_id VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_from_node (from_node),
    INDEX idx_to_node (to_node)
) ENGINE=InnoDB;

-- 5. Duplicate Groups Table
CREATE TABLE IF NOT EXISTS duplicate_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    duplicate_group_id VARCHAR(50) NOT NULL UNIQUE,
    business_key VARCHAR(255) NOT NULL,
    duplicate_type VARCHAR(50) NOT NULL,
    risk_level ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    root_cause VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.0,
    evidence TEXT NULL,
    recommended_action ENUM('ACCEPT_A', 'ACCEPT_B', 'MERGE', 'QUARANTINE') NOT NULL DEFAULT 'QUARANTINE',
    recommendation_reason TEXT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'QUARANTINED', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    dataset_a_record_id INT NULL,
    dataset_b_record_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dup_group_id (duplicate_group_id),
    INDEX idx_business_key (business_key),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 6. Duplicate Records Detail Table
CREATE TABLE IF NOT EXISTS duplicate_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    duplicate_group_id VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    dataset_role ENUM('SOURCE_A', 'SOURCE_B') NOT NULL,
    business_key VARCHAR(255) NOT NULL,
    record_data JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dup_rec_group (duplicate_group_id)
) ENGINE=InnoDB;

-- 7. Repair Candidates Table
CREATE TABLE IF NOT EXISTS repair_candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    duplicate_group_id VARCHAR(50) NOT NULL,
    candidate_record_id INT NULL,
    preferred_role VARCHAR(50) NOT NULL,
    priority_score FLOAT NOT NULL DEFAULT 0.0,
    rationale TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rep_cand_group (duplicate_group_id)
) ENGINE=InnoDB;

-- 8. Repair Decisions Table
CREATE TABLE IF NOT EXISTS repair_decisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    duplicate_group_id VARCHAR(50) NOT NULL,
    decision ENUM('ACCEPT_A', 'ACCEPT_B', 'MERGE', 'QUARANTINE', 'REJECT') NOT NULL,
    approved_by VARCHAR(100) NOT NULL DEFAULT 'Data Engineer',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    executed BOOLEAN DEFAULT TRUE,
    result_record_id INT NULL,
    INDEX idx_rep_dec_group (duplicate_group_id)
) ENGINE=InnoDB;

-- 9. Quarantine Records Table
CREATE TABLE IF NOT EXISTS quarantine_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    duplicate_group_id VARCHAR(50) NOT NULL,
    business_key VARCHAR(255) NOT NULL,
    dataset_a_data JSON NULL,
    dataset_b_data JSON NULL,
    conflict_details TEXT NOT NULL,
    root_cause VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.0,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    quarantined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    INDEX idx_quar_group (duplicate_group_id),
    INDEX idx_quar_status (status)
) ENGINE=InnoDB;

-- 10. Reconciliation Results Table
CREATE TABLE IF NOT EXISTS reconciliation_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(100) NOT NULL UNIQUE,
    total_source_a_records INT NOT NULL DEFAULT 0,
    total_source_b_records INT NOT NULL DEFAULT 0,
    total_expected_records INT NOT NULL DEFAULT 0,
    total_actual_records INT NOT NULL DEFAULT 0,
    total_duplicate_records INT NOT NULL DEFAULT 0,
    total_repaired_records INT NOT NULL DEFAULT 0,
    total_quarantined_records INT NOT NULL DEFAULT 0,
    missing_records INT NOT NULL DEFAULT 0,
    unexpected_records INT NOT NULL DEFAULT 0,
    status ENUM('PASS', 'WARNING', 'FAIL') NOT NULL DEFAULT 'PASS',
    details_json JSON NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rec_run (run_id)
) ENGINE=InnoDB;

-- 11. KPI Results Table
CREATE TABLE IF NOT EXISTS kpi_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(100) NOT NULL,
    kpi_1_attribution_precision FLOAT NOT NULL DEFAULT 0.0,
    kpi_2_ambiguous_merges_prevented INT NOT NULL DEFAULT 0,
    kpi_3_reconciliation_accuracy FLOAT NOT NULL DEFAULT 0.0,
    kpi_4_false_block_rate FLOAT NOT NULL DEFAULT 0.0,
    kpi_5_runtime_overhead_ms FLOAT NOT NULL DEFAULT 0.0,
    kpi_6_lineage_coverage FLOAT NOT NULL DEFAULT 0.0,
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_kpi_run (run_id)
) ENGINE=InnoDB;

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    operation VARCHAR(100) NOT NULL,
    dataset VARCHAR(255) NOT NULL,
    duplicate_id VARCHAR(50) NULL,
    decision VARCHAR(50) NULL,
    reason TEXT NULL,
    user VARCHAR(100) NOT NULL DEFAULT 'Data Engineer',
    metadata_json JSON NULL,
    INDEX idx_audit_op (operation),
    INDEX idx_audit_time (timestamp)
) ENGINE=InnoDB;
