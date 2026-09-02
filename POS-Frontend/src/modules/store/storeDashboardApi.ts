import { api } from '../../api';

export const storeDashboardAPI = {
  getStats: (storeId: string) => api.get(`/stores/${storeId}/dashboard/stats`),
  getMonthlySales: (storeId: string) => api.get(`/stores/${storeId}/dashboard/monthly-sales`),
  getPaymentSplit: (storeId: string) => api.get(`/stores/${storeId}/dashboard/payment-split`),
  getTopProducts: (storeId: string) => api.get(`/stores/${storeId}/dashboard/top-products`),
};


