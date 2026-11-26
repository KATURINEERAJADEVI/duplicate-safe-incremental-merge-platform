import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import DuplicateExplorer from './pages/DuplicateExplorer';
import LineageExplorer from './pages/LineageExplorer';
import RepairCenter from './pages/RepairCenter';
import QuarantinePage from './pages/Quarantine';
import ReconciliationPage from './pages/Reconciliation';
import KPIsPage from './pages/KPIs';
import AuditHistoryPage from './pages/AuditHistory';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/duplicates" element={<DuplicateExplorer />} />
            <Route path="/lineage" element={<LineageExplorer />} />
            <Route path="/repairs" element={<RepairCenter />} />
            <Route path="/quarantine" element={<QuarantinePage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/kpis" element={<KPIsPage />} />
            <Route path="/audit" element={<AuditHistoryPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
