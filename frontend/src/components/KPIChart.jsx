import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function KPIChart({ kpis }) {
  if (!kpis) return null;

  const percentageData = [
    { name: 'KPI-1 Attribution Precision', value: kpis.kpi_1_attribution_precision, color: '#06b6d4', benchmark: 'Target: >90%' },
    { name: 'KPI-3 Reconciliation Accuracy', value: kpis.kpi_3_reconciliation_accuracy, color: '#10b981', benchmark: 'Target: 100%' },
    { name: 'KPI-4 False-Block Rate', value: kpis.kpi_4_false_block_rate, color: '#f59e0b', benchmark: 'Target: <2%' },
    { name: 'KPI-6 Lineage Coverage', value: kpis.kpi_6_lineage_coverage, color: '#8b5cf6', benchmark: 'Target: 100%' },
  ];

  const radarData = [
    { subject: 'Attribution Precision', score: kpis.kpi_1_attribution_precision, fullMark: 100 },
    { subject: 'Reconciliation', score: kpis.kpi_3_reconciliation_accuracy, fullMark: 100 },
    { subject: 'Lineage Coverage', score: kpis.kpi_6_lineage_coverage, fullMark: 100 },
    { subject: 'Safety Retention', score: Math.max(0, 100 - kpis.kpi_4_false_block_rate * 10), fullMark: 100 },
    { subject: 'Merge Integrity', score: 98, fullMark: 100 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
      {/* Percentage Bar Chart */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1rem' }}>
          Quality & Precision Metrics (%)
        </h4>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={percentageData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" width={180} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(val) => [`${val}%`, 'Value']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {percentageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Quality Chart */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '1rem' }}>
          Lineage-Aware System Integrity Profile
        </h4>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
              <Radar name="Platform Metric" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
