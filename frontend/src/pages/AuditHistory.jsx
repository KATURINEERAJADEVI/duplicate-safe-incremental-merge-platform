import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Filter, FileText, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function AuditHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [operationFilter, setOperationFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditHistory(operationFilter || null);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [operationFilter]);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              Immutable Audit History
            </h2>
            <span className="badge badge-emerald">Compliance Ledger</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Permanent trace of every upload, merge simulation, attribution decision, repair approval, and quarantine action.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="form-select"
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            style={{ width: '220px' }}
          >
            <option value="">All Operations</option>
            <option value="DATASET_UPLOAD">Dataset Upload</option>
            <option value="ANALYSIS_COMPLETED">Analysis Completed</option>
            <option value="REPAIR_APPROVED">Repair Approved</option>
            <option value="REPAIR_REJECTED">Repair Rejected</option>
            <option value="RECORD_QUARANTINED">Record Quarantined</option>
            <option value="RECONCILIATION_RUN">Reconciliation Run</option>
          </select>

          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchAudit}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Operation</th>
              <th>Target Dataset</th>
              <th>Duplicate ID</th>
              <th>Decision</th>
              <th>Reason / Justification</th>
              <th>Authorized User</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td>
                  <span className={`badge ${
                    log.operation.includes('APPROVED') ? 'badge-emerald' : log.operation.includes('QUARANTINED') ? 'badge-amber' : 'badge-cyan'
                  }`} style={{ fontSize: '0.7rem' }}>
                    {log.operation?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: '#ffffff' }}>{log.dataset}</td>
                <td>
                  {log.duplicate_id ? (
                    <code style={{ color: 'var(--cyan)', fontWeight: 700 }}>{log.duplicate_id}</code>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  {log.decision ? (
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{log.decision}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td style={{ maxWidth: '320px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {log.reason}
                </td>
                <td>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>{log.user}</span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No audit logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
