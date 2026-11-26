import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  AlertTriangle, 
  GitFork, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  BarChart3, 
  History 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Dataset Upload', path: '/upload', icon: UploadCloud },
  { name: 'Duplicate Explorer', path: '/duplicates', icon: AlertTriangle },
  { name: 'Lineage Explorer', path: '/lineage', icon: GitFork },
  { name: 'Repair Center', path: '/repairs', icon: Wrench },
  { name: 'Quarantine', path: '/quarantine', icon: ShieldAlert },
  { name: 'Reconciliation', path: '/reconciliation', icon: CheckCircle2 },
  { name: 'KPI Metrics', path: '/kpis', icon: BarChart3 },
  { name: 'Audit History', path: '/audit', icon: History },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0b1120',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      gap: '0.4rem',
      flexShrink: 0
    }}>
      <div style={{ padding: '0 0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
          Navigation Engine
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--cyan)' : '3px solid transparent',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{
        padding: '1rem',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          Rule Precedence
        </p>
        <p>1. Priority ➔ 2. Event Time ➔ 3. Version ➔ 4. Completeness ➔ 5. Ingestion</p>
      </div>
    </aside>
  );
}
