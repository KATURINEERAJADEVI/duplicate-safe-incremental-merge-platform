import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, ArrowRight, AlertCircle, FileCheck, Layers } from 'lucide-react';
import api from '../services/api';
import DatasetUploadCard from '../components/DatasetUpload';
import DatasetPreview from '../components/DatasetPreview';
import BusinessKeySelector from '../components/BusinessKeySelector';

export default function UploadPage() {
  const navigate = useNavigate();

  const [previewA, setPreviewA] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [schemaComparison, setSchemaComparison] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisSummary, setAnalysisSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // When both datasets are uploaded, compare schemas
  useEffect(() => {
    if (previewA?.id && previewB?.id) {
      const compare = async () => {
        try {
          const comp = await api.compareSchemas(previewA.id, previewB.id);
          setSchemaComparison(comp);
          if (comp.suggested_business_keys?.length > 0) {
            setSelectedKeys(comp.suggested_business_keys[0]);
          } else if (comp.common_columns?.length > 0) {
            setSelectedKeys([comp.common_columns[0]]);
          }
        } catch (err) {
          console.error('Schema comparison error:', err);
          setErrorMessage('Failed to compare dataset schemas: ' + (err.response?.data?.detail || err.message));
        }
      };
      compare();
    }
  }, [previewA?.id, previewB?.id]);

  const handleUploadA = async (file) => {
    try {
      setLoadingA(true);
      setErrorMessage('');
      const data = await api.uploadDatasetA(file);
      setPreviewA(data);
    } catch (err) {
      setErrorMessage('Upload failed for Dataset A: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingA(false);
    }
  };

  const handleUploadB = async (file) => {
    try {
      setLoadingB(true);
      setErrorMessage('');
      const data = await api.uploadDatasetB(file);
      setPreviewB(data);
    } catch (err) {
      setErrorMessage('Upload failed for Dataset B: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingB(false);
    }
  };

  const handleKeyToggle = (col) => {
    setSelectedKeys((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleStartAnalysis = async () => {
    if (!previewA?.id || !previewB?.id) {
      setErrorMessage('Both Dataset A and Dataset B must be uploaded first.');
      return;
    }
    if (selectedKeys.length === 0) {
      setErrorMessage('Please select at least one column for the Business Key.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage('');
      setAnalysisProgress(1); // Uploading & Validating

      // Simulate live step progression for visual feedback
      const timer1 = setTimeout(() => setAnalysisProgress(2), 400); // Checking uniqueness
      const timer2 = setTimeout(() => setAnalysisProgress(3), 800); // Detecting duplicates
      const timer3 = setTimeout(() => setAnalysisProgress(4), 1200); // Building lineage
      const timer4 = setTimeout(() => setAnalysisProgress(5), 1600); // Root cause

      const summary = await api.startAnalysis(previewA.id, previewB.id, selectedKeys);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      setAnalysisProgress(7); // Ready
      setAnalysisSummary(summary);
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage('Analysis pipeline failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="page-container">
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Dataset Upload & Merge Configuration
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Upload exactly two datasets: Source Dataset A (Base) and Source Dataset B (Incoming Incremental) to initiate lineage-aware deduplication.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: 'var(--radius-md)',
          color: '#f43f5e',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Upload Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1: Dataset A */}
        <DatasetUploadCard
          role="SOURCE_A"
          title="Dataset A: Source Dataset"
          subtitle="The baseline / existing historical records"
          preview={previewA}
          isLoading={loadingA}
          onFileSelect={handleUploadA}
        />

        {/* Card 2: Dataset B */}
        <DatasetUploadCard
          role="SOURCE_B"
          title="Dataset B: Incoming / Incremental"
          subtitle="The delta / incremental merge payload"
          preview={previewB}
          isLoading={loadingB}
          onFileSelect={handleUploadB}
        />
      </div>

      {/* Notification when both are ready */}
      {previewA && previewB && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#10b981',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <CheckCircle2 size={20} />
          <span>Both datasets uploaded successfully. Common schema analyzed below.</span>
        </div>
      )}

      {/* Business Key Selection */}
      {previewA && previewB && schemaComparison && (
        <BusinessKeySelector
          schemaComparison={schemaComparison}
          selectedKeys={selectedKeys}
          onKeyToggle={handleKeyToggle}
          onSelectCompositeKey={(keys) => setSelectedKeys(keys)}
          onStartAnalysis={handleStartAnalysis}
          isAnalyzing={isAnalyzing}
          analysisProgress={analysisProgress}
        />
      )}

      {/* Analysis Result Banner */}
      {analysisSummary && (
        <div className="glass-card" style={{
          marginTop: '2rem',
          border: '1px solid var(--emerald)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.9))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>Analysis Complete</span>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                Pipeline Successfully Finished ({analysisSummary.total_elapsed_ms} ms)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Detected <strong>{analysisSummary.duplicate_groups_count}</strong> conflicting groups (
                {analysisSummary.exact_duplicates} exact duplicates, {analysisSummary.conflicting_records} complex conflicts).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/lineage')}
              >
                View Lineage DAG
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/duplicates')}
              >
                <span>Open Duplicate Explorer</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview Section */}
      <div style={{ marginTop: '2.5rem' }}>
        {previewA && <DatasetPreview preview={previewA} />}
        {previewB && <DatasetPreview preview={previewB} />}
      </div>
    </div>
  );
}
