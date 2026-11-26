import React from 'react';
import { X, Check, AlertOctagon, ShieldAlert, GitFork, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DuplicateDetails({
  detail,
  onClose,
  onApprove,
  onReject,
  onQuarantine
}) {
  const navigate = useNavigate();
  if (!detail) return null;

  const recA = detail.dataset_a_record || {};
  const recB = detail.dataset_b_record || {};
  const allKeys = Array.from(new Set([...Object.keys(recA), ...Object.keys(recB)]));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <code style={{ fontSize: '1.15rem', color: 'var(--cyan)', fontWeight: 800 }}>
                {detail.duplicate_group_id}
              </code>
              <span className="badge badge-purple">{detail.duplicate_type?.replace(/_/g, ' ')}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Business Key: <strong style={{ color: '#ffffff' }}>{detail.business_key}</strong>
            </p>
          </div>

          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Diagnostic Banner */}
        <div style={{
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyan)', fontWeight: 700 }}>
              Root Cause Diagnostics
            </span>
            <span className="badge badge-emerald">
              Confidence: {Math.round(detail.confidence * 100)}%
            </span>
          </div>
          <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '0.25rem' }}>
            {detail.root_cause?.replace(/_/g, ' ')}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong>Evidence:</strong> {detail.evidence}
          </p>
        </div>

        {/* Attribution Engine Decision Recommendation */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={18} color="#10b981" />
            <h5 style={{ fontSize: '0.9rem', color: '#ffffff' }}>Attribution Engine Recommendation:</h5>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
              {detail.recommended_action}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {detail.recommendation_reason}
          </p>
        </div>

        {/* Side-by-Side Payload Comparison */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Payload Attribute Comparison (Differences Highlighted)
          </h5>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th style={{ color: 'var(--cyan)' }}>Dataset A (Base)</th>
                  <th style={{ color: 'var(--purple)' }}>Dataset B (Incremental)</th>
                  <th>Match</th>
                </tr>
              </thead>
              <tbody>
                {allKeys.map((k) => {
                  const valA = recA[k];
                  const valB = recB[k];
                  const isDiff = String(valA) !== String(valB);
                  return (
                    <tr key={k} style={{ backgroundColor: isDiff ? 'rgba(245, 158, 11, 0.06)' : 'transparent' }}>
                      <td style={{ fontWeight: 600, color: '#94a3b8' }}>{k}</td>
                      <td style={{ color: isDiff ? '#38bdf8' : '#cbd5e1' }}>
                        {valA !== undefined ? String(valA) : <span style={{ color: '#ef4444' }}>absent</span>}
                      </td>
                      <td style={{ color: isDiff ? '#c084fc' : '#cbd5e1' }}>
                        {valB !== undefined ? String(valB) : <span style={{ color: '#ef4444' }}>absent</span>}
                      </td>
                      <td>
                        {isDiff ? (
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>DIFF</span>
                        ) : (
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>MATCH</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              navigate(`/lineage?dup=${detail.duplicate_group_id}`);
            }}
          >
            <GitFork size={16} />
            <span>Open in Lineage DAG</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => onQuarantine(detail)}
            >
              <ShieldAlert size={16} />
              <span>Quarantine</span>
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onReject(detail)}
            >
              <AlertOctagon size={16} />
              <span>Reject</span>
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => onApprove(detail)}
            >
              <Check size={16} />
              <span>Approve ({detail.recommended_action})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
