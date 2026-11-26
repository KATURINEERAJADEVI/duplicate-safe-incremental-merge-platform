import React, { useState, useEffect } from 'react';
import { X, Download, FileSpreadsheet, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function RepairedExportModal({ isOpen, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [quarDownloading, setQuarDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPreview = async () => {
        try {
          setLoading(true);
          const data = await api.getRepairedPreview();
          setPreview(data);
        } catch (err) {
          console.error('Failed to load repaired preview:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchPreview();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await api.downloadRepairedDataset();
    } catch (err) {
      alert('Download error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadQuarantine = async () => {
    try {
      setQuarDownloading(true);
      await api.downloadQuarantineDataset();
    } catch (err) {
      alert('Quarantine download error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setQuarDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}>
              <FileSpreadsheet size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Export Repaired Golden Master Dataset
                </h3>
                <span className="badge badge-emerald">Ready for Download</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Clean, deduplicated, and arbitrated records after deterministic attribution repairs.
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--emerald)" />
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Synthesizing golden master records from MySQL database...
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stat Pills */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              marginBottom: '1.25rem' 
            }}>
              <div style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.25)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Clean Golden Master Rows
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                  {preview?.total_rows || 0} Records
                </p>
              </div>

              <div style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: 'rgba(6, 182, 212, 0.1)', 
                border: '1px solid rgba(6, 182, 212, 0.25)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Attributes / Columns
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--cyan)', marginTop: '0.2rem' }}>
                  {preview?.columns?.length || 0} Columns
                </p>
              </div>

              <div style={{ 
                padding: '0.85rem 1rem', 
                backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                border: '1px solid rgba(139, 92, 246, 0.25)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Arbitration State
                </span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Deterministic Parity</span>
                </p>
              </div>
            </div>

            {/* Preview Table */}
            <div style={{ flex: 1, minHeight: '180px', maxHeight: '340px', overflowY: 'auto', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              {preview?.sample_rows && preview.sample_rows.length > 0 ? (
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1 }}>
                    <tr>
                      {preview.columns.map((col) => (
                        <th key={col} style={{ padding: '0.6rem 0.75rem' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_rows.map((row, idx) => (
                      <tr key={idx}>
                        {preview.columns.map((col) => (
                          <td key={col} style={{ padding: '0.55rem 0.75rem' }}>
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span style={{ color: 'var(--text-muted)' }}>null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No records to preview.
                </div>
              )}
            </div>

            {/* Modal Footer & Actions */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderTop: '1px solid var(--border-subtle)', 
              paddingTop: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadQuarantine}
                disabled={quarDownloading}
              >
                <ShieldAlert size={14} color="#f59e0b" />
                <span>{quarDownloading ? 'Exporting Quarantine...' : 'Download Quarantine CSV'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                    border: 'none',
                    fontWeight: 700,
                    padding: '0.55rem 1.25rem'
                  }}
                >
                  <Download size={16} />
                  <span>{downloading ? 'Downloading...' : 'Download Repaired CSV'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
