import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  AlertTriangle, 
  Flame, 
  Wrench, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  GitFork, 
  ArrowRight,
  TrendingUp,
  Play,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [quarantine, setQuarantine] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadRepaired = async () => {
    try {
      setIsDownloading(true);
      await api.downloadRepairedDataset();
    } catch (err) {
      alert('Download error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dsData, dupData, repData, quarData] = await Promise.all([
          api.getDatasets().catch(() => []),
          api.getDuplicates().catch(() => []),
          api.getRepairDecisions().catch(() => []),
          api.getQuarantineRecords().catch(() => []),
        ]);

        setDatasets(dsData);
        setDuplicates(dupData);
        setRepairs(repData);
        setQuarantine(quarData);

        const recData = await api.getLatestReconciliation().catch(() => null);
        const kpiData = await api.getKPIs().catch(() => null);
        setReconciliation(recData);
        setKpis(kpiData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dsA = datasets.find((d) => d.dataset_role === 'SOURCE_A');
  const dsB = datasets.find((d) => d.dataset_role === 'SOURCE_B');

  const highRiskCount = duplicates.filter((d) => d.risk_level === 'HIGH').length;
  const approvedRepairs = repairs.filter((r) => r.decision !== 'REJECT').length;

  // Chart data: Duplicate Types
  const typeMap = {};
  duplicates.forEach((d) => {
    const t = d.duplicate_type?.replace(/_/g, ' ') || 'Unknown';
    typeMap[t] = (typeMap[t] || 0) + 1;
  });
  const dupTypeChartData = Object.keys(typeMap).map((k) => ({ name: k, value: typeMap[k] }));

  // Chart data: Root Causes
  const causeMap = {};
  duplicates.forEach((d) => {
    const c = d.root_cause?.replace(/_/g, ' ') || 'Unknown';
    causeMap[c] = (causeMap[c] || 0) + 1;
  });
  const rootCauseChartData = Object.keys(causeMap).map((k) => ({ name: k, count: causeMap[k] }));

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  return (
    <div className="page-container">
      {/* Hero Welcome Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        padding: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-cyan">Platform Status: Active</span>
            <span className="badge badge-emerald">MySQL 8.0 Synced</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Lineage-Aware Duplicate Attribution Platform
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Deterministic conflict detection, DAG lineage backtracking, and zero-data-loss incremental merge diagnostics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {approvedRepairs > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadRepaired}
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
              <Download size={16} />
              <span>{isDownloading ? 'Downloading...' : 'Download Repaired CSV'}</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/duplicates')}
          >
            Explore Duplicates
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/upload')}
          >
            <Play size={16} fill="#ffffff" />
            <span>Upload & Run Merge</span>
          </button>
        </div>
      </div>

      {/* Top 9 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Dataset A (Base)"
          value={dsA ? dsA.row_count.toLocaleString() : '0'}
          subtitle={dsA ? dsA.filename : 'No base dataset uploaded'}
          icon={Database}
          color="cyan"
        />
        <StatCard
          title="Dataset B (Incoming)"
          value={dsB ? dsB.row_count.toLocaleString() : '0'}
          subtitle={dsB ? dsB.filename : 'No incremental dataset'}
          icon={Layers}
          color="purple"
        />
        <StatCard
          title="Duplicate Groups"
          value={duplicates.length}
          subtitle="Identified across datasets"
          icon={AlertTriangle}
          color="amber"
          badge={duplicates.length > 0 ? `${duplicates.length} Detected` : '0'}
        />
        <StatCard
          title="Critical Conflicts"
          value={highRiskCount}
          subtitle="High risk integrity threats"
          icon={Flame}
          color="rose"
        />
        <StatCard
          title="Repair Candidates"
          value={duplicates.filter((d) => d.status === 'PENDING').length}
          subtitle="Awaiting engineer approval"
          icon={Wrench}
          color="cyan"
        />
        <StatCard
          title="Approved Repairs"
          value={approvedRepairs}
          subtitle="Executed deterministic fixes"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Quarantined Records"
          value={quarantine.length}
          subtitle="Protected from data corruption"
          icon={ShieldAlert}
          color="amber"
        />
        <StatCard
          title="Reconciliation"
          value={reconciliation ? reconciliation.status : 'PENDING'}
          subtitle={reconciliation ? `Expected: ${reconciliation.total_expected_records} rows` : 'Run merge to verify'}
          icon={CheckCircle2}
          color={reconciliation?.status === 'PASS' ? 'emerald' : reconciliation?.status === 'WARNING' ? 'amber' : 'rose'}
        />
        <StatCard
          title="Lineage Coverage"
          value={kpis ? `${kpis.kpi_6_lineage_coverage}%` : '100%'}
          subtitle="End-to-end DAG tracing"
          icon={GitFork}
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Duplicate Types Distribution */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Duplicate Types Distribution</h4>
            <span className="badge badge-cyan">{duplicates.length} Total</span>
          </div>

          {dupTypeChartData.length > 0 ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dupTypeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {dupTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No duplicate data to display yet. Upload datasets to begin analysis.
            </div>
          )}
        </div>

        {/* Root Causes Diagnosis */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Root Cause Attribution</h4>
            <span className="badge badge-purple">Diagnostics</span>
          </div>

          {rootCauseChartData.length > 0 ? (
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rootCauseChartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                  <XAxis dataKey="name" stroke="#64748b" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No root cause data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
