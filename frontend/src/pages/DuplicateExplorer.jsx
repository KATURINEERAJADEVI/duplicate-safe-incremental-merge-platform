import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import DuplicateTable from '../components/DuplicateTable';
import DuplicateDetails from '../components/DuplicateDetails';
import RepairModal from '../components/RepairModal';

export default function DuplicateExplorer() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [modalGroup, setModalGroup] = useState(null);
  const [modalAction, setModalAction] = useState('APPROVE');

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (typeFilter) params.duplicate_type = typeFilter;
      if (riskFilter) params.risk_level = riskFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await api.getDuplicates(params);
      setDuplicates(data);
    } catch (err) {
      console.error('Failed to load duplicates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [typeFilter, riskFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDuplicates();
  };

  const handleViewDetails = async (id) => {
    try {
      const detail = await api.getDuplicateDetails(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to fetch details:', err);
    }
  };

  const handleOpenRepairModal = (group, action = 'APPROVE') => {
    setModalGroup(group);
    setModalAction(action);
  };

  const handleExecuteRepair = async ({ id, action, approved_by, reason }) => {
    try {
      if (action === 'APPROVE') {
        await api.approveRepair(id, approved_by, reason);
      } else if (action === 'REJECT') {
        await api.rejectRepair(id, approved_by, reason);
      } else if (action === 'QUARANTINE') {
        await api.quarantineRepair(id, approved_by, reason);
      }

      setModalGroup(null);
      setSelectedDetail(null);
      fetchDuplicates();
    } catch (err) {
      console.error('Repair execution failed:', err);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
            Duplicate Explorer & Diagnostics
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Review, trace, and arbitrate records identified by the lineage attribution engine.
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDuplicates}>
          <RefreshCw size={14} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Duplicate ID (e.g. DG-0001) or Business Key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div style={{ flex: '1 1 180px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Duplicate Types</option>
              <option value="EXACT_DUPLICATE">Exact Duplicate</option>
              <option value="VERSION_CONFLICT">Version Conflict</option>
              <option value="LATE_ARRIVING_RECORD">Late-Arriving Record</option>
              <option value="SOURCE_CONFLICT">Source Priority Conflict</option>
              <option value="TEMPORAL_CONFLICT">Temporal Conflict</option>
              <option value="BUSINESS_KEY_CONFLICT">Business Key Conflict</option>
              <option value="JOIN_MULTIPLICATION">Join Multiplication</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div style={{ flex: '0 1 150px' }}>
            <select
              className="form-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ flex: '0 1 150px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="QUARANTINED">Quarantined</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Main Duplicates Table */}
      <DuplicateTable
        duplicates={duplicates}
        onSelectDuplicate={handleViewDetails}
        onOpenRepairModal={(dg) => handleOpenRepairModal(dg, 'APPROVE')}
      />

      {/* Deep Detail Inspection Modal */}
      {selectedDetail && (
        <DuplicateDetails
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onApprove={(d) => handleOpenRepairModal(d, 'APPROVE')}
          onReject={(d) => handleOpenRepairModal(d, 'REJECT')}
          onQuarantine={(d) => handleOpenRepairModal(d, 'QUARANTINE')}
        />
      )}

      {/* Confirmation Repair Modal */}
      {modalGroup && (
        <RepairModal
          duplicateGroup={modalGroup}
          actionType={modalAction}
          onClose={() => setModalGroup(null)}
          onConfirm={handleExecuteRepair}
        />
      )}
    </div>
  );
}
