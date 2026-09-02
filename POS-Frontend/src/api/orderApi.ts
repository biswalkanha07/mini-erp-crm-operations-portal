import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const orderAPI = {
  createOrder: (data: any) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getAllOrders: (status?: string) => api.get('/orders', { params: status ? { status } : {} }),
  updateOrderStatus: (id: string, data: any) => api.patch(`/orders/${id}`, data),
};
