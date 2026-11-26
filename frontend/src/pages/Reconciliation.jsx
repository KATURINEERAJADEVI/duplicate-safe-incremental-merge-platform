import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, Play } from 'lucide-react';
import api from '../services/api';
import ReconciliationCard from '../components/ReconciliationCard';

export default function ReconciliationPage() {
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      const data = await api.getLatestReconciliation();
      setReconciliation(data);
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              Row Reconciliation & Parity Verification
            </h2>
            <span className="badge badge-emerald">Audit Verified</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Mathematical validation comparing Expected vs Actual rows before and after the incremental merge.
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchReconciliation}>
          <RefreshCw size={14} />
          <span>Recalculate Parity</span>
        </button>
      </div>

      {reconciliation ? (
        <ReconciliationCard reconciliation={reconciliation} />
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            No reconciliation runs found yet. Complete an analysis run on the Dataset Upload page.
          </p>
        </div>
      )}
    </div>
  );
}
