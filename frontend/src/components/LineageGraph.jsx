import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function LineageGraph({
  nodes = [],
  edges = [],
  onNodeClick,
  selectedNodeId,
}) {
  // Format nodes with custom styling based on stage & highlight
  const formattedNodes = useMemo(() => {
    return nodes.map((node) => {
      const isHl = node.data?.is_highlighted;
      const isSelected = node.id === selectedNodeId;
      const nodeType = node.data?.node_type;

      let borderColor = '#334155';
      let bgColor = '#0f172a';
      let textColor = '#f8fafc';

      if (nodeType === 'DATASET') {
        borderColor = '#38bdf8';
        bgColor = 'rgba(56, 189, 248, 0.15)';
      } else if (nodeType === 'RECORD') {
        borderColor = '#818cf8';
        bgColor = 'rgba(129, 140, 248, 0.15)';
      } else if (nodeType === 'TRANSFORMATION') {
        borderColor = '#f59e0b';
        bgColor = 'rgba(245, 158, 11, 0.15)';
      } else if (nodeType === 'MERGE') {
        borderColor = '#ec4899';
        bgColor = 'rgba(236, 72, 153, 0.15)';
      } else if (nodeType === 'TARGET') {
        borderColor = '#10b981';
        bgColor = 'rgba(16, 185, 129, 0.2)';
      }

      if (isHl || isSelected) {
        borderColor = '#06b6d4';
        bgColor = 'rgba(6, 182, 212, 0.25)';
      }

      return {
        ...node,
        style: {
          background: bgColor,
          color: textColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: isHl || isSelected ? '0 0 20px rgba(6, 182, 212, 0.6)' : '0 4px 12px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          minWidth: '160px',
          transition: 'all 0.2s ease',
        },
      };
    });
  }, [nodes, selectedNodeId]);

  // Format edges
  const formattedEdges = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.style?.stroke || '#06b6d4',
      },
      animated: e.animated !== undefined ? e.animated : true,
    }));
  }, [edges]);

  return (
    <div style={{ width: '100%', height: '620px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#090d16' }}>
      <ReactFlow
        nodes={formattedNodes}
        edges={formattedEdges}
        onNodeClick={(evt, node) => onNodeClick && onNodeClick(node)}
        fitView
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls style={{ fill: '#ffffff' }} />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.node_type === 'TARGET') return '#10b981';
            if (n.data?.node_type === 'MERGE') return '#ec4899';
            if (n.data?.node_type === 'TRANSFORMATION') return '#f59e0b';
            return '#06b6d4';
          }}
          style={{ background: '#0b1120', borderRadius: '8px', border: '1px solid #334155' }}
        />
      </ReactFlow>
    </div>
  );
}
