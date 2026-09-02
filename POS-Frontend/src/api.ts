import axios from 'axios';

// const API_BASE = 'http://localhost:5050/api';
const API_BASE = 'https://apis.pos.hutechsolutions.in/api';

// Create axios instance with default config
 export const api = axios.create({
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

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Unified login
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  
  // Signup endpoints
  organizationSignup: (data: { organizationId: string; email: string; password: string }) => api.post('/auth/organization/signup', data),
  storeSignup: (data: { storeId: string; email: string; password: string; token?: string }) => api.post('/auth/store/signup', data),
  verifyStoreSignupToken: (data: { email: string; storeId: string; token: string }) => api.post('/auth/store/verify-signup-token', data),
  
  // Legacy login endpoints (keeping for backward compatibility)
  organizationLogin: (data: { organizationId: string; email: string; password: string }) => api.post('/auth/organization/login', data),
  storeLogin: (data: { storeId: string; email: string; password: string }) => api.post('/auth/store/login', data),
  
  // Legacy register endpoints (keeping for backward compatibility)
  createOrganizationUser: (data: { name: string; email: string; password: string; organizationId: string; role?: string }) => api.post('/auth/organization/register', data),
  createStoreUser: (data: { name: string; email: string; password: string; storeId: string; role?: string }) => api.post('/auth/store/register', data),
  
  getProfile: () => api.get('/auth/profile'),
  
  // Password reset endpoints
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string; confirmPassword: string }) => api.post('/auth/reset-password', data),
};

// Organization API
export const organizationAPI = {
  getAll: () => api.get('/organizations'),
  getById: (id: string) => api.get(`/organizations/${id}`),
  create: (data: any) => api.post('/organizations', data),
  update: (id: string, data: any) => api.put(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
};

// Store API
export const storeAPI = {
  getAll: () => api.get('/stores'),
  getById: (id: string) => api.get(`/stores/${id}`),
  create: (data: any) => api.post('/stores', data),
  update: (id: string, data: any) => {
    console.log('Store API update called with:', { id, data });
    return api.put(`/stores/${id}`, data);
  },
  delete: (id: string) => api.delete(`/stores/${id}`),
  search: (params: Record<string, any>) => api.get('/stores/search', { params }),
  // Store pricing overrides
  listPrices: (storeId: string, sku?: string) => api.get(`/stores/${storeId}/prices${sku ? `?sku=${encodeURIComponent(sku)}` : ''}`),
  upsertPrice: (storeId: string, sku: string, data: any) => api.put(`/stores/${storeId}/prices/${sku}`, data),
  getEffectivePrice: (storeId: string, sku: string) => api.get(`/stores/${storeId}/prices/${sku}/effective`),
};

// Category API
export const categoryAPI = {
  getAll: (options?: { params?: any }) => {
    if (options && options.params) {
      return api.get('/categories', { params: options.params });
    }
    return api.get('/categories');
  },
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  search: (params: Record<string, any>) => api.get('/categories/search', { params }),
};

// Catalogue API
export const catalogueAPI = {
  getAll: (options?: { params?: any }) => {
    if (options && options.params) {
      return api.get('/catalogues', { params: options.params });
    }
    return api.get('/catalogues');
  },
  getById: (id: string) => api.get(`/catalogues/${id}`),
  create: (data: any) => api.post('/catalogues', data),
  update: (id: string, data: any) => api.put(`/catalogues/${id}`, data),
  delete: (id: string) => api.delete(`/catalogues/${id}`),
  getBySKU: (sku: string) => api.get(`/sales/product/sku/${sku}`),
  getByBarcode: (barcode: string) => api.get(`/sales/product/barcode/${barcode}`),
  search: (params: Record<string, any>) => api.get('/catalogues/search', { params }),
};

// Sales/Transaction API
export const salesAPI = {
  getAll: () => api.get('/sales'),
  createTransaction: (data: any) => api.post('/sales/transaction', data),
  getTransactionById: (id: string) => api.get(`/sales/transaction/${id}`),
  getTransactionsByStore: (storeId: string) => api.get(`/sales/store/${storeId}`),
  getByDateRange: (startDate: string, endDate: string) => api.get(`/sales/date-range?start=${startDate}&end=${endDate}`),
  getByTransactionId: (transactionId: string) => api.get(`/sales/transaction-id/${transactionId}`),
  getStats: () => api.get('/sales/stats'),
  getTodaysSales: () => api.get('/sales/today'),
  getByPaymentMethod: (paymentMethod: string) => api.get(`/sales/payment-method/${paymentMethod}`),
  getProductBySKU: (sku: string) => api.get(`/sales/product/sku/${sku}`),
  getProductByBarcode: (barcode: string) => api.get(`/sales/product/barcode/${barcode}`),
};

// Invoice API
export const invoiceAPI = {
  generateInvoice: (data: { transactionId: string }) => api.post('/invoices/generate', data),
  getAll: () => api.get('/invoices'),
  getById: (id: string) => api.get(`/invoices/${id}`),
  getByStore: (storeId: string) => api.get(`/invoices/store/${storeId}`),
};

// Legacy API (for backward compatibility)
export const getProducts = () => api.get('/products');
export const createProduct = (data: any) => api.post('/products', data);
export const updateProduct = (id: string, data: any) => api.put(`/products/${id}`, data);
export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

export const getSales = () => api.get('/sales');
export const createSale = (data: any) => api.post('/sales', data);

export const getUsers = () => api.get('/users');
export const createUser = (data: any) => api.post('/users', data);
