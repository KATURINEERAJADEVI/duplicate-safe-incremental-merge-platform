import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  GitFork, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Download,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RepairModal from '../components/RepairModal';
import RepairedExportModal from '../components/RepairedExportModal';

export default function RepairCenter() {
  const navigate = useNavigate();
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalGroup, setModalGroup] = useState(null);
  const [modalAction, setModalAction] = useState('APPROVE');
  const [successBanner, setSuccessBanner] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadDuplicates = async () => {
    try {
      setLoading(true);
      const data = await api.getDuplicates();
      setDuplicates(data);
    } catch (err) {
      console.error('Failed to load repair candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  const handleOpenAction = (group, action) => {
    setModalGroup(group);
    setModalAction(action);
  };

  const handleExecuteRepair = async ({ id, action, approved_by, reason }) => {
    try {
      if (action === 'APPROVE') {
        await api.approveRepair(id, approved_by, reason);
        setSuccessBanner(`Attribution repair for ${id} approved successfully! Competing record preserved in immutable audit log.`);
      } else if (action === 'REJECT') {
        await api.rejectRepair(id, approved_by, reason);
        setSuccessBanner(`Repair recommendation for ${id} rejected.`);
      } else if (action === 'QUARANTINE') {
        await api.quarantineRepair(id, approved_by, reason);
        setSuccessBanner(`Record group ${id} safely shifted to Quarantine.`);
      }
      setModalGroup(null);
      loadDuplicates();
      setTimeout(() => setSuccessBanner(''), 8000);
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleQuickDownload = async () => {
    try {
      setIsDownloading(true);
      await api.downloadRepairedDataset();
    } catch (err) {
      alert('Download error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsDownloading(false);
    }
  };

  const pendingCount = duplicates.filter((d) => d.status === 'PENDING').length;
  const approvedCount = duplicates.filter((d) => d.status === 'APPROVED').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              Repair Center & Attribution Arbitration
            </h2>
            <span className="badge badge-emerald">Deterministic Engine</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Inspect competing records, review attribution reasons, and execute user-approved deterministic repairs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-amber">{pendingCount} Pending</span>
          <span className="badge badge-emerald">{approvedCount} Approved</span>

          {/* Export & Download Buttons */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowExportModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Eye size={14} />
            <span>Preview Master</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleQuickDownload}
            disabled={isDownloading}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              border: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Download size={14} />
            <span>{isDownloading ? 'Downloading...' : 'Download Repaired CSV'}</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.25rem',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          color: '#10b981',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} />
            <span>{successBanner}</span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleQuickDownload}
            disabled={isDownloading}
            style={{
              background: '#10b981',
              color: '#0f172a',
              fontWeight: 700,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Download size={14} />
            <span>Download Updated File</span>
          </button>
        </div>
      )}

      {/* Repair Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {duplicates.map((dg) => {
          const isPending = dg.status === 'PENDING';
          return (
            <div
              key={dg.duplicate_group_id}
              className="glass-card"
              style={{
                borderLeft: `4px solid ${
                  dg.status === 'APPROVED' ? '#10b981' : dg.status === 'QUARANTINED' ? '#f59e0b' : '#06b6d4'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <code style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan)' }}>
                      {dg.duplicate_group_id}
                    </code>
                    <span className="badge badge-purple">{dg.duplicate_type?.replace(/_/g, ' ')}</span>
                    <span className={`badge ${dg.risk_level === 'HIGH' ? 'risk-high' : dg.risk_level === 'MEDIUM' ? 'risk-medium' : 'risk-low'}`}>
                      {dg.risk_level} Risk
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '0.3rem' }}>
                    Business Key: <strong>{dg.business_key}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${
                    dg.status === 'APPROVED' ? 'badge-emerald' : dg.status === 'QUARANTINED' ? 'badge-amber' : dg.status === 'REJECTED' ? 'badge-rose' : 'badge-cyan'
                  }`}>
                    {dg.status}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/lineage?dup=${dg.duplicate_group_id}`)}
                  >
                    <GitFork size={13} />
                    <span>View Lineage</span>
                  </button>
                </div>
              </div>

              {/* Diagnostic Rationale */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Root Cause Diagnostic:</span>
                  <p style={{ fontWeight: 600, color: '#ffffff' }}>
                    {dg.root_cause?.replace(/_/g, ' ')} ({Math.round(dg.confidence * 100)}% Confidence)
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended Attribution Action:</span>
                  <p style={{ fontWeight: 700, color: 'var(--cyan)' }}>
                    {dg.recommended_action}
                  </p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Engine Rationale:</span>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {dg.recommendation_reason}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-warning btn-sm"
                  onClick={() => handleOpenAction(dg, 'QUARANTINE')}
                >
                  <ShieldAlert size={14} />
                  <span>Quarantine</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleOpenAction(dg, 'REJECT')}
                >
                  <XCircle size={14} />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => handleOpenAction(dg, 'APPROVE')}
                >
                  <ShieldCheck size={14} />
                  <span>Approve & Execute Repair</span>
                </button>
              </div>
            </div>
          );
        })}

        {duplicates.length === 0 && !loading && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              No duplicate repair candidates detected yet. Run analysis from the Dataset Upload page.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalGroup && (
        <RepairModal
          duplicateGroup={modalGroup}
          actionType={modalAction}
          onClose={() => setModalGroup(null)}
          onConfirm={handleExecuteRepair}
        />
      )}

      {/* Repaired Golden Master Export Modal */}
      <RepairedExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
