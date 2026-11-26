import React, { useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DatasetUploadCard({
  role,
  title,
  subtitle,
  preview,
  isLoading,
  onFileSelect,
}) {
  const fileInputRef = useRef(null);
  const isA = role === 'SOURCE_A';
  const accentColor = isA ? 'var(--cyan)' : 'var(--purple)';

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      borderTop: `4px solid ${accentColor}`,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className={`badge ${isA ? 'badge-cyan' : 'badge-purple'}`} style={{ marginBottom: '0.4rem' }}>
            {role.replace('_', ' ')}
          </span>
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>{title}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>

        {preview && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#10b981',
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={16} />
            <span>Ready</span>
          </div>
        )}
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = accentColor)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: isA ? 'var(--cyan-glow)' : 'var(--purple-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor
        }}>
          {isLoading ? (
            <div className="spinner" style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${accentColor}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          ) : (
            <Upload size={22} />
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {preview ? 'Click or drag to replace CSV' : 'Click or drag CSV file here'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Supports comma-delimited (.csv) records
          </p>
        </div>

        <button type="button" className={`btn btn-sm ${isA ? 'btn-primary' : 'btn-secondary'}`} style={{ pointerEvents: 'none', marginTop: '0.25rem' }}>
          Choose CSV File
        </button>
      </div>

      {/* Metadata Overview if Uploaded */}
      {preview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Filename:</span>
            <p style={{ fontWeight: 600, color: '#ffffff', wordBreak: 'break-all' }}>{preview.filename}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>File Size:</span>
            <p style={{ fontWeight: 600, color: '#ffffff' }}>{(preview.file_size / 1024).toFixed(1)} KB</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Rows:</span>
            <p style={{ fontWeight: 700, color: accentColor, fontSize: '1rem' }}>{preview.row_count.toLocaleString()}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Columns:</span>
            <p style={{ fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>{preview.column_count}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Duplicate Rows:</span>
            <p style={{ fontWeight: 600, color: preview.duplicate_rows_count > 0 ? '#f59e0b' : '#10b981' }}>
              {preview.duplicate_rows_count}
            </p>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Nulls Count:</span>
            <p style={{ fontWeight: 600, color: '#94a3b8' }}>
              {Object.values(preview.null_counts || {}).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
