import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Activity, Cpu } from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const [health, setHealth] = useState({ status: 'checking', database: { status: 'checking' } });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (err) {
        setHealth({ status: 'offline', database: { status: 'disconnected' } });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health.status === 'healthy';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
        }}>
          <ShieldCheck size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Duplicate-Safe Incremental Merge Platform
            </h1>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              Lineage-Aware Attribution
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            B.Tech Data Engineering for AI Capstone Project
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Database Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.85rem',
          backgroundColor: '#1e293b',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem'
        }}>
          <Database size={15} color={isHealthy ? '#10b981' : '#f43f5e'} />
          <span style={{ color: 'var(--text-secondary)' }}>MySQL 8.0:</span>
          <span style={{
            fontWeight: 700,
            color: isHealthy ? '#10b981' : '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isHealthy ? '#10b981' : '#f43f5e',
              display: 'inline-block',
              boxShadow: isHealthy ? '0 0 8px #10b981' : 'none'
            }} />
            {isHealthy ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Engine mode badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.85rem',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          fontSize: '0.8rem',
          color: 'var(--cyan)'
        }}>
          <Cpu size={15} />
          <span style={{ fontWeight: 600 }}>Deterministic DAG Active</span>
        </div>

        {/* Quick Purge / Reset Button */}
        <button
          type="button"
          onClick={async () => {
            if (window.confirm('Are you sure you want to purge all uploaded datasets, duplicate records, and audit logs to start completely fresh?')) {
              try {
                await api.resetAllData();
                window.location.href = '/upload';
              } catch (err) {
                alert('Reset failed: ' + (err.response?.data?.detail || err.message));
              }
            }
          }}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }}
          title="Purge all datasets and reset platform"
        >
          Reset All Data
        </button>
      </div>
    </header>
  );
}
