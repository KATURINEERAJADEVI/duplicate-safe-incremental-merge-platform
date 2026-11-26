import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Datasets & Upload
  uploadDatasetA: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload/dataset-a', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadDatasetB: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload/dataset-b', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getDatasets: async () => {
    const response = await apiClient.get('/datasets');
    return response.data;
  },

  getDatasetById: async (id) => {
    const response = await apiClient.get(`/datasets/${id}`);
    return response.data;
  },

  compareSchemas: async (datasetAId, datasetBId) => {
    const response = await apiClient.get('/datasets/compare-schemas', {
      params: { dataset_a_id: datasetAId, dataset_b_id: datasetBId },
    });
    return response.data;
  },

  // Analysis
  startAnalysis: async (datasetAId, datasetBId, businessKeyColumns, sourcePriorityMap = null) => {
    const response = await apiClient.post('/analysis/start', {
      dataset_a_id: datasetAId,
      dataset_b_id: datasetBId,
      business_key_columns: businessKeyColumns,
      source_priority_map: sourcePriorityMap,
    });
    return response.data;
  },

  getLatestAnalysis: async () => {
    const response = await apiClient.get('/analysis/latest');
    return response.data;
  },

  // Duplicates
  getDuplicates: async (filters = {}) => {
    const response = await apiClient.get('/duplicates', { params: filters });
    return response.data;
  },

  getDuplicateDetails: async (id) => {
    const response = await apiClient.get(`/duplicates/${id}`);
    return response.data;
  },

  getDuplicateLineage: async (id) => {
    const response = await apiClient.get(`/duplicates/${id}/lineage`);
    return response.data;
  },

  // Lineage
  getFullLineage: async () => {
    const response = await apiClient.get('/lineage/full');
    return response.data;
  },

  // Repairs
  getRepairDecisions: async () => {
    const response = await apiClient.get('/repairs');
    return response.data;
  },

  approveRepair: async (id, approvedBy = 'Data Engineer', reason = '') => {
    const response = await apiClient.post(`/repairs/${id}/approve`, {
      decision: 'APPROVE',
      approved_by: approvedBy,
      reason: reason || 'Approved recommended attribution action',
    });
    return response.data;
  },

  rejectRepair: async (id, rejectedBy = 'Data Engineer', reason = '') => {
    const response = await apiClient.post(`/repairs/${id}/reject`, {
      decision: 'REJECT',
      approved_by: rejectedBy,
      reason: reason || 'Manually rejected attribution action',
    });
    return response.data;
  },

  quarantineRepair: async (id, quarantinedBy = 'Data Engineer', reason = '') => {
    const response = await apiClient.post(`/repairs/${id}/quarantine`, {
      decision: 'QUARANTINE',
      approved_by: quarantinedBy,
      reason: reason || 'Directed to quarantine',
    });
    return response.data;
  },

  getQuarantineRecords: async () => {
    const response = await apiClient.get('/quarantine');
    return response.data;
  },

  getRepairedPreview: async () => {
    const response = await apiClient.get('/repairs/preview-repaired');
    return response.data;
  },

  downloadRepairedDataset: async () => {
    const response = await apiClient.get('/repairs/export/repaired-dataset', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `golden_master_repaired_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  downloadQuarantineDataset: async () => {
    const response = await apiClient.get('/repairs/export/quarantine-dataset', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quarantine_records_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  // Reconciliation
  runReconciliation: async (datasetAId, datasetBId) => {
    const response = await apiClient.post('/reconciliation/run', null, {
      params: { dataset_a_id: datasetAId, dataset_b_id: datasetBId },
    });
    return response.data;
  },

  getLatestReconciliation: async () => {
    const response = await apiClient.get('/reconciliation/latest');
    return response.data;
  },

  // KPIs
  getKPIs: async () => {
    const response = await apiClient.get('/kpis/latest');
    return response.data;
  },

  getAllKPIs: async () => {
    const response = await apiClient.get('/kpis');
    return response.data;
  },

  // Audit
  getAuditHistory: async (operation = null, limit = 100) => {
    const response = await apiClient.get('/audit', {
      params: { operation, limit },
    });
    return response.data;
  },

  // Health
  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Reset Platform
  resetAllData: async () => {
    const response = await apiClient.post('/datasets/reset');
    return response.data;
  },
};

export default api;
