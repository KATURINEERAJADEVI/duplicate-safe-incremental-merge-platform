import React from 'react';
import { Eye, GitFork, Wrench, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DuplicateTable({
  duplicates,
  onSelectDuplicate,
  onOpenRepairModal
}) {
  const navigate = useNavigate();

  const getRiskBadge = (risk) => {
    switch (risk?.toUpperCase()) {
      case 'HIGH':
        return <span className="badge risk-high">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="badge risk-medium">MEDIUM RISK</span>;
      case 'LOW':
        return <span className="badge risk-low">LOW RISK</span>;
      default:
        return <span className="badge">{risk}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <span className="badge badge-emerald">APPROVED</span>;
      case 'REJECTED':
        return <span className="badge badge-rose">REJECTED</span>;
      case 'QUARANTINED':
        return <span className="badge badge-amber">QUARANTINED</span>;
      default:
        return <span className="badge badge-cyan">PENDING</span>;
    }
  };

  if (!duplicates || duplicates.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          No duplicate groups found matching your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Duplicate ID</th>
            <th>Business Key</th>
            <th>Duplicate Type</th>
            <th>Root Cause</th>
            <th>Confidence</th>
            <th>Risk</th>
            <th>Recommendation</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {duplicates.map((dg) => (
            <tr key={dg.duplicate_group_id}>
              <td>
                <code style={{ fontWeight: 700, color: 'var(--cyan)' }}>
                  {dg.duplicate_group_id}
                </code>
              </td>
              <td>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>
                  {dg.business_key}
                </span>
              </td>
              <td>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  {dg.duplicate_type?.replace(/_/g, ' ')}
                </span>
              </td>
              <td>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {dg.root_cause?.replace(/_/g, ' ')}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '40px', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round(dg.confidence * 100)}%`,
                      height: '100%',
                      backgroundColor: dg.confidence > 0.85 ? '#10b981' : dg.confidence > 0.7 ? '#f59e0b' : '#f43f5e'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {Math.round(dg.confidence * 100)}%
                  </span>
                </div>
              </td>
              <td>{getRiskBadge(dg.risk_level)}</td>
              <td>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {dg.recommended_action}
                </span>
              </td>
              <td>{getStatusBadge(dg.status)}</td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="View Deep Attribution Details"
                    onClick={() => onSelectDuplicate(dg.duplicate_group_id)}
                  >
                    <Eye size={13} />
                    <span>Details</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="Explore Lineage Path"
                    onClick={() => navigate(`/lineage?dup=${dg.duplicate_group_id}`)}
                  >
                    <GitFork size={13} />
                    <span>Lineage</span>
                  </button>
                  {dg.status === 'PENDING' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      title="Open Repair Modal"
                      onClick={() => onOpenRepairModal(dg)}
                    >
                      <Wrench size={13} />
                      <span>Repair</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
