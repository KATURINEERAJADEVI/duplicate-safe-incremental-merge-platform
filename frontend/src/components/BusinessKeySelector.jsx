import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowRight, Play, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function BusinessKeySelector({
  schemaComparison,
  selectedKeys,
  onKeyToggle,
  onSelectCompositeKey,
  onStartAnalysis,
  isAnalyzing,
  analysisProgress
}) {
  if (!schemaComparison) return null;

  const { common_columns, is_compatible, compatibility_reason, suggested_business_keys } = schemaComparison;

  return (
    <div className="glass-card" style={{
      marginTop: '1.5rem',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <KeyRound size={22} color="var(--cyan)" />
        <div>
          <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>
            Business Key Selection & Schema Alignment
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Select the common unique column(s) that identify business entities across both datasets.
          </p>
        </div>
      </div>

      {!is_compatible ? (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#f43f5e',
          fontSize: '0.85rem'
        }}>
          <strong>Incompatible Datasets:</strong> {compatibility_reason}
        </div>
      ) : (
        <>
          {/* Quick presets / suggested business keys */}
          {suggested_business_keys?.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Suggested Keys:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {suggested_business_keys.map((composite, idx) => {
                  const keyStr = composite.join(' + ');
                  const isCurrent = composite.length === selectedKeys.length && composite.every(k => selectedKeys.includes(k));
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectCompositeKey(composite)}
                      className={`btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <Sparkles size={13} />
                      {keyStr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Common Columns Checklist */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Available Shared Columns:
            </span>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
              marginTop: '0.5rem'
            }}>
              {common_columns.map((col) => {
                const isSelected = selectedKeys.includes(col);
                return (
                  <label
                    key={col}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.65rem 0.9rem',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onKeyToggle(col)}
                      style={{ accentColor: 'var(--cyan)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                      {col}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selected Key Summary Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Primary Business Key:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <code style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan)' }}>
                  [ {selectedKeys.length > 0 ? selectedKeys.join(' + ') : 'None selected'} ]
                </code>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedKeys.length === 0 || isAnalyzing}
              onClick={onStartAnalysis}
              style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Processing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="#ffffff" />
                  <span>START DUPLICATE-SAFE MERGE ANALYSIS</span>
                </>
              )}
            </button>
          </div>

          {/* Pipeline execution progress checklist */}
          {isAnalyzing && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              backgroundColor: '#090d16',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
                Executing Pipeline Diagnostics:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {[
                  { id: 'uploading', label: 'Uploading' },
                  { id: 'validating', label: 'Validating' },
                  { id: 'uniqueness', label: 'Checking uniqueness' },
                  { id: 'duplicates', label: 'Detecting duplicates' },
                  { id: 'lineage', label: 'Building lineage' },
                  { id: 'rootcause', label: 'Analyzing root cause' },
                  { id: 'ready', label: 'Ready' },
                ].map((step, idx) => {
                  const isDone = analysisProgress >= idx + 1;
                  const isCurrent = analysisProgress === idx;
                  return (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        color: isDone ? '#10b981' : isCurrent ? 'var(--cyan)' : 'var(--text-muted)'
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} color="#10b981" />
                      ) : isCurrent ? (
                        <Loader2 size={16} className="spinner" color="var(--cyan)" />
                      ) : (
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #334155', display: 'inline-block' }} />
                      )}
                      <span style={{ fontWeight: isDone || isCurrent ? 600 : 400 }}>
                        {step.label} {isDone && '✓'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
