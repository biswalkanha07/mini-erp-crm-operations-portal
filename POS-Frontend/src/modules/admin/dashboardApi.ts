import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

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

// ERP Dashboard Types
export interface ERPOverviewData {
  customers: {
    total: number;
    active: number;
    leads: number;
    inactive: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalStockQuantity: number;
    estimatedInventoryValue: number;
  };
  challans: {
    total: number;
    today: number;
    draft: number;
    confirmed: number;
    cancelled: number;
    todayConfirmedAmount: number;
  };
  followUps: {
    due: number;
    upcoming: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    actionUrl: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    productName: string;
    sku: string;
    currentStock: number;
    minimumStock: number;
    warehouseLocation: string;
    unitPrice: number;
  }>;
  recentChallans: Array<{
    id: string;
    challanNumber: string;
    customerName: string;
    customerCompany?: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
  recentStockMovements: Array<{
    id: string;
    productName: string;
    sku: string;
    movementType: string;
    quantityChanged: number;
    reason: string;
    referenceId?: string;
    createdByName: string;
    createdAt: string;
  }>;
  upcomingFollowUps: Array<{
    id: string;
    name: string;
    businessName?: string;
    phone: string;
    status: string;
    followUpDate: string;
  }>;
}

// Dashboard API endpoints
export const dashboardAPI = {
  getERPOverview: () => api.get<{ success: boolean; data: ERPOverviewData }>('/dashboard/overview'),
  getStats: () => api.get('/dashboard/stats'),
  getMonthlySales: () => api.get('/dashboard/monthly-sales'),
  getMostSoldProducts: () => api.get('/dashboard/most-sold-products'),
  getSalesTrend: () => api.get('/dashboard/sales-trend'),
  getProfitData: () => api.get('/dashboard/profit-data'),
  getCustomerStats: () => api.get('/dashboard/customer-stats'),
  getInventoryStats: () => api.get('/dashboard/inventory-stats'),
  getSalesByStore: () => api.get('/dashboard/sales-by-store'),
};
