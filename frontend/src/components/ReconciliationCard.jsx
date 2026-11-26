import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Database } from 'lucide-react';

export default function ReconciliationCard({ reconciliation }) {
  if (!reconciliation) return null;

  const getStatusDisplay = (status) => {
    switch (status?.toUpperCase()) {
      case 'PASS':
        return {
          icon: CheckCircle,
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: 'PASS: Zero Missing Records, Deterministic Parity Achieved'
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          text: 'WARNING: Quarantined Records Awaiting Manual Arbitration'
        };
      default:
        return {
          icon: XCircle,
          color: '#f43f5e',
          bg: 'rgba(244, 63, 94, 0.15)',
          border: 'rgba(244, 63, 94, 0.4)',
          text: 'FAIL: Row Discrepancy or Unaccounted Record Loss'
        };
    }
  };

  const statusInfo = getStatusDisplay(reconciliation.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Status Alert Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        backgroundColor: statusInfo.bg,
        border: `1px solid ${statusInfo.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: `0 0 25px ${statusInfo.bg}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: statusInfo.color
          }}>
            <StatusIcon size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>
              Reconciliation Outcome: <span style={{ color: statusInfo.color }}>{reconciliation.status}</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {statusInfo.text}
            </p>
          </div>
        </div>

        <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Run ID: {reconciliation.run_id}
        </code>
      </div>

      {/* Row Accounting Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source A Records</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)' }}>{reconciliation.total_source_a_records}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source B Records</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--purple)' }}>{reconciliation.total_source_b_records}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Clean Rows</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>{reconciliation.total_expected_records}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actual Target Rows</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{reconciliation.total_actual_records}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duplicate Groups</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{reconciliation.total_duplicate_records}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quarantined Rows</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e' }}>{reconciliation.total_quarantined_records}</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Missing Records</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: reconciliation.missing_records > 0 ? '#ef4444' : '#10b981' }}>
            {reconciliation.missing_records}
          </p>
        </div>
      </div>
    </div>
  );
}
