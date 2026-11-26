import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, Eye } from 'lucide-react';
import api from '../services/api';

export default function QuarantinePage() {
  const [quarantineRecords, setQuarantineRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inspectRecord, setInspectRecord] = useState(null);

  const fetchQuarantine = async () => {
    try {
      setLoading(true);
      const data = await api.getQuarantineRecords();
      setQuarantineRecords(data);
    } catch (err) {
      console.error('Failed to load quarantine records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuarantine();
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              Quarantine Isolation Center
            </h2>
            <span className="badge badge-amber">Zero Blind Deletions</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Conflicting records that cannot be deterministically arbitrated are quarantined here to prevent data loss or silent corruption.
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchQuarantine}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quarantine Table */}
      {quarantineRecords.length > 0 ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Duplicate ID</th>
                <th>Business Key</th>
                <th>Conflict Details</th>
                <th>Root Cause</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Quarantined At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quarantineRecords.map((q) => (
                <tr key={q.id}>
                  <td>
                    <code style={{ fontWeight: 700, color: '#f59e0b' }}>
                      {q.duplicate_group_id}
                    </code>
                  </td>
                  <td>
                    <strong style={{ color: '#ffffff' }}>{q.business_key}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {q.conflict_details}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      {q.root_cause?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{Math.round(q.confidence * 100)}%</td>
                  <td>
                    <span className="badge badge-amber">{q.status}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(q.quarantined_at).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setInspectRecord(q)}
                    >
                      <Eye size={13} />
                      <span>Inspect Payload</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <ShieldAlert size={36} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h4 style={{ color: '#ffffff', marginBottom: '0.4rem' }}>Quarantine Vault Clean</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No records are currently isolated in quarantine. All merges have been cleanly resolved.
          </p>
        </div>
      )}

      {/* Inspect Modal */}
      {inspectRecord && (
        <div className="modal-overlay" onClick={() => setInspectRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              Quarantine Record Payload: {inspectRecord.duplicate_group_id}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Business Key: <strong>{inspectRecord.business_key}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h5 style={{ color: 'var(--cyan)', marginBottom: '0.4rem' }}>Dataset A Payload</h5>
                <pre style={{
                  backgroundColor: '#090d16',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  color: '#38bdf8',
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(inspectRecord.dataset_a_data || {}, null, 2)}
                </pre>
              </div>

              <div>
                <h5 style={{ color: 'var(--purple)', marginBottom: '0.4rem' }}>Dataset B Payload</h5>
                <pre style={{
                  backgroundColor: '#090d16',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  color: '#c084fc',
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(inspectRecord.dataset_b_data || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setInspectRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
