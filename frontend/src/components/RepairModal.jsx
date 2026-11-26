import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RepairModal({
  duplicateGroup,
  actionType = 'APPROVE', // APPROVE, REJECT, QUARANTINE
  onClose,
  onConfirm
}) {
  const [approver, setApprover] = useState('Senior Data Engineer');
  const [reason, setReason] = useState(duplicateGroup?.recommendation_reason || '');

  if (!duplicateGroup) return null;

  const isApprove = actionType === 'APPROVE';
  const isQuarantine = actionType === 'QUARANTINE';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      id: duplicateGroup.duplicate_group_id,
      action: actionType,
      approved_by: approver,
      reason: reason
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isApprove ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isApprove ? '#10b981' : '#f59e0b'
            }}>
              {isApprove ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                {isApprove ? 'Confirm Attribution Repair' : isQuarantine ? 'Move to Quarantine' : 'Reject Repair'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target Group: <strong>{duplicateGroup.duplicate_group_id}</strong>
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem'
          }}>
            <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              <strong>Business Key:</strong> {duplicateGroup.business_key}
            </p>
            <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              <strong>Root Cause:</strong> {duplicateGroup.root_cause?.replace(/_/g, ' ')} ({Math.round(duplicateGroup.confidence * 100)}% confidence)
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Deterministic Action:</strong>{' '}
              <span className={`badge ${isApprove ? 'badge-emerald' : 'badge-amber'}`}>
                {duplicateGroup.recommended_action}
              </span>
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Authorized By
            </label>
            <input
              type="text"
              className="form-input"
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Audit Justification / Rationale
            </label>
            <textarea
              className="form-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem'
          }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isApprove ? 'btn-success' : isQuarantine ? 'btn-warning' : 'btn-danger'}`}
            >
              <CheckCircle2 size={16} />
              <span>Confirm & Execute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
