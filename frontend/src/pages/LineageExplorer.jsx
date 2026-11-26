import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GitFork, Layers, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import LineageGraph from '../components/LineageGraph';

export default function LineageExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDupId = searchParams.get('dup') || '';

  const [duplicates, setDuplicates] = useState([]);
  const [selectedDupId, setSelectedDupId] = useState(initialDupId);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], summary: {}, lineage_stats: {} });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load available duplicate groups for dropdown
  useEffect(() => {
    const loadDuplicates = async () => {
      try {
        const data = await api.getDuplicates();
        setDuplicates(data);
      } catch (err) {
        console.error('Failed to load duplicate list for lineage:', err);
      }
    };
    loadDuplicates();
  }, []);

  // Fetch lineage graph
  const fetchLineage = async (dupId) => {
    try {
      setLoading(true);
      setSelectedNode(null);
      let data;
      if (dupId) {
        data = await api.getDuplicateLineage(dupId);
      } else {
        data = await api.getFullLineage();
      }
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load lineage graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineage(selectedDupId);
  }, [selectedDupId]);

  const handleDuplicateChange = (e) => {
    const val = e.target.value;
    setSelectedDupId(val);
    if (val) {
      setSearchParams({ dup: val });
    } else {
      setSearchParams({});
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              Lineage DAG Explorer
            </h2>
            <span className="badge badge-cyan">NetworkX Engine</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Interactive Directed Acyclic Graph showing complete backward attribution from Target Record to Source Datasets.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedDupId}
            onChange={handleDuplicateChange}
            style={{ width: '280px' }}
          >
            <option value="">Full Lineage DAG (All Records)</option>
            {duplicates.map((dg) => (
              <option key={dg.duplicate_group_id} value={dg.duplicate_group_id}>
                {dg.duplicate_group_id} — {dg.business_key} ({dg.duplicate_type})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchLineage(selectedDupId)}
          >
            <RefreshCw size={14} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Right Inspector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
        {/* Left: React Flow Graph */}
        <div style={{ position: 'relative' }}>
          {/* Legend Banner */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '1rem',
            fontSize: '0.75rem',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <span>Dataset</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#818cf8' }} />
              <span>Record</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span>Transform</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ec4899' }} />
              <span>Merge</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Target</span>
            </div>
          </div>

          <LineageGraph
            nodes={graphData.nodes || []}
            edges={graphData.edges || []}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Right Inspector Panel */}
        {selectedNode && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '620px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={18} color="var(--cyan)" />
                <h4 style={{ fontSize: '1rem', color: '#ffffff' }}>Node Inspector</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Node ID</span>
              <p style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '0.95rem' }}>{selectedNode.id}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stage Classification</span>
              <p>
                <span className="badge badge-purple" style={{ marginTop: '0.2rem' }}>
                  {selectedNode.data?.node_type}
                </span>
              </p>
            </div>

            {selectedNode.data?.record_id && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Internal Record ID</span>
                <p style={{ fontWeight: 600, color: '#ffffff' }}>#{selectedNode.data.record_id}</p>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Metadata & Attributes</span>
              <pre style={{
                marginTop: '0.4rem',
                padding: '0.75rem',
                backgroundColor: '#090d16',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: '#38bdf8',
                overflowX: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(selectedNode.data?.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
