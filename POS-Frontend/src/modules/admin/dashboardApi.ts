import axios from 'axios';

// const API_BASE = 'http://localhost:5050/api';
const API_BASE = 'https://apis.pos.hutechsolutions.in/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dashboard API endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getMonthlySales: () => api.get('/dashboard/monthly-sales'),
  getMostSoldProducts: () => api.get('/dashboard/most-sold-products'),
  getSalesTrend: () => api.get('/dashboard/sales-trend'),
  getProfitData: () => api.get('/dashboard/profit-data'),
  getCustomerStats: () => api.get('/dashboard/customer-stats'),
  getInventoryStats: () => api.get('/dashboard/inventory-stats'),
  getSalesByStore: () => api.get('/dashboard/sales-by-store'),
};
