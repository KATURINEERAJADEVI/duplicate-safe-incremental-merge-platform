import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Award, Zap, ShieldCheck, Target, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import KPIChart from '../components/KPIChart';

export default function KPIsPage() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const data = await api.getKPIs();
      setKpis(data);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              Capstone Key Performance Indicators (KPIs)
            </h2>
            <span className="badge badge-purple">AI & Data Engineering Core</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Live mathematical evaluation of attribution accuracy, merge safety, runtime overhead, and lineage coverage.
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchKPIs}>
          <RefreshCw size={14} />
          <span>Refresh KPIs</span>
        </button>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="KPI-1: Attribution Precision"
          value={kpis ? `${kpis.kpi_1_attribution_precision}%` : 'N/A'}
          subtitle="Formula: (High-Confidence Attributions) / (Total Duplicate Groups)"
          icon={Target}
          color="cyan"
          badge="Target > 90%"
        />
        <StatCard
          title="KPI-2: Ambiguous Merges Prevented"
          value={kpis ? kpis.kpi_2_ambiguous_merges_prevented : 'N/A'}
          subtitle="Intercepted conflicts before corrupting production data"
          icon={ShieldCheck}
          color="emerald"
          badge="Integrity Guard"
        />
        <StatCard
          title="KPI-3: Row Reconciliation Accuracy"
          value={kpis ? `${kpis.kpi_3_reconciliation_accuracy}%` : 'N/A'}
          subtitle="Formula: (Expected Clean Rows - Discrepancies) / Expected"
          icon={CheckCircle2}
          color="cyan"
          badge="100% Target"
        />
        <StatCard
          title="KPI-4: False-Block Rate"
          value={kpis ? `${kpis.kpi_4_false_block_rate}%` : 'N/A'}
          subtitle="Formula: (Valid Rows Misquarantined) / (Total Valid Rows)"
          icon={Award}
          color="amber"
          badge="Target < 2%"
        />
        <StatCard
          title="KPI-5: Runtime Overhead"
          value={kpis ? `${kpis.kpi_5_runtime_overhead_ms} ms` : 'N/A'}
          subtitle="End-to-end execution latency for DAG traversal and checks"
          icon={Zap}
          color="purple"
          badge="Sub-second"
        />
        <StatCard
          title="KPI-6: Lineage Coverage"
          value={kpis ? `${kpis.kpi_6_lineage_coverage}%` : 'N/A'}
          subtitle="Formula: (Lineage Record Nodes) / (Total Source Rows)"
          icon={BarChart3}
          color="emerald"
          badge="100% Target"
        />
      </div>

      {/* KPI Visual Charts */}
      {kpis && <KPIChart kpis={kpis} />}

      {/* Mathematical Formulations Table */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '1rem' }}>
          KPI Mathematical Formulations & Validation Criteria
        </h4>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>KPI Identifier</th>
                <th>Metric Name</th>
                <th>Mathematical Formula</th>
                <th>Target Threshold</th>
                <th>Live Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>KPI-1</code></td>
                <td>Duplicate Attribution Precision</td>
                <td><code>N_verified_attributions / N_total_duplicate_groups</code></td>
                <td>&gt; 90.0%</td>
                <td><strong style={{ color: 'var(--cyan)' }}>{kpis ? `${kpis.kpi_1_attribution_precision}%` : 'Pending'}</strong></td>
              </tr>
              <tr>
                <td><code>KPI-2</code></td>
                <td>Ambiguous Merges Prevented</td>
                <td><code>Count(Complex conflicts intercepted prior to target insertion)</code></td>
                <td>Maximized</td>
                <td><strong style={{ color: '#10b981' }}>{kpis ? kpis.kpi_2_ambiguous_merges_prevented : 'Pending'}</strong></td>
              </tr>
              <tr>
                <td><code>KPI-3</code></td>
                <td>Row Reconciliation Accuracy</td>
                <td><code>(R_expected - |R_missing + R_unexpected|) / R_expected * 100</code></td>
                <td>100.0%</td>
                <td><strong style={{ color: 'var(--cyan)' }}>{kpis ? `${kpis.kpi_3_reconciliation_accuracy}%` : 'Pending'}</strong></td>
              </tr>
              <tr>
                <td><code>KPI-4</code></td>
                <td>False-Block Rate</td>
                <td><code>N_false_quarantined / N_valid_records * 100</code></td>
                <td>&lt; 2.0%</td>
                <td><strong style={{ color: '#f59e0b' }}>{kpis ? `${kpis.kpi_4_false_block_rate}%` : 'Pending'}</strong></td>
              </tr>
              <tr>
                <td><code>KPI-5</code></td>
                <td>Runtime Overhead</td>
                <td><code>t_pipeline_end - t_pipeline_start (milliseconds)</code></td>
                <td>&lt; 5000 ms</td>
                <td><strong style={{ color: '#8b5cf6' }}>{kpis ? `${kpis.kpi_5_runtime_overhead_ms} ms` : 'Pending'}</strong></td>
              </tr>
              <tr>
                <td><code>KPI-6</code></td>
                <td>End-to-End Lineage Coverage</td>
                <td><code>N_mapped_dag_records / N_input_records * 100</code></td>
                <td>100.0%</td>
                <td><strong style={{ color: '#10b981' }}>{kpis ? `${kpis.kpi_6_lineage_coverage}%` : 'Pending'}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
