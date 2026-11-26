import React, { useState } from 'react';
import { Table, Eye, Layers } from 'lucide-react';

export default function DatasetPreview({ preview }) {
  const [activeTab, setActiveTab] = useState('data');

  if (!preview) return null;

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={18} color="var(--cyan)" />
          <h4 style={{ fontSize: '1rem', color: '#ffffff' }}>
            Data Preview & Schema: <span style={{ color: 'var(--cyan)' }}>{preview.dataset_name}</span>
          </h4>
        </div>

        {/* Tab switch: Data vs Schema */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'data' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('data')}
          >
            Sample Rows ({preview.sample_records?.length || 0})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('schema')}
          >
            Columns & Types ({preview.columns?.length || 0})
          </button>
        </div>
      </div>

      {activeTab === 'data' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {preview.columns?.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.sample_records?.map((row, idx) => (
                <tr key={idx}>
                  {preview.columns?.map((col) => (
                    <td key={col} style={{ whiteSpace: 'nowrap' }}>
                      {row[col] !== null && row[col] !== undefined ? (
                        String(row[col])
                      ) : (
                        <span style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '0.75rem' }}>null</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Inferred Data Type</th>
                <th>Null Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.columns?.map((col) => {
                const nulls = preview.null_counts?.[col] || 0;
                const dtype = preview.column_types?.[col] || 'string';
                return (
                  <tr key={col}>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{col}</td>
                    <td>
                      <code style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>{dtype}</code>
                    </td>
                    <td>{nulls}</td>
                    <td>
                      {nulls > 0 ? (
                        <span className="badge badge-amber">Nullable</span>
                      ) : (
                        <span className="badge badge-emerald">Non-Null</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
