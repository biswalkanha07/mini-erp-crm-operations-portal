 //import axios from 'axios';
 import { api } from '../../api';

export interface Sale {
  _id: string;
  transactionId: string;
  dateTime: string;
  items: any[];
  paymentMethod: string;
  customerDetails?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  grandTotal: number;
  subTotal: number;
  gstTotal: number;
  discountTotal: number;
  storeId: any;
}

// ✅ Helper: get storeId from localStorage
const getStoreId = (): string | undefined => {
  const id = localStorage.getItem('storeId');
  return id ?? undefined;
};

const getAll = (storeId?: string) =>
  api.get('/sales', { params: { storeId } });

const getTodaysSales = (storeId?: string) =>
  storeId ? api.get(`/sales/store/${storeId}`, { params: { filter: 'today' } }) : api.get('/sales/today');

const getByPaymentMethod = (method: string, storeId?: string) =>
  api.get(`/sales/payment-method/${encodeURIComponent(method)}`, { params: { storeId } });

const getByDate = (date: string, storeId?: string) =>
  api.get('/sales/by-date', { params: { date, storeId } });

const getByDay = (day: string, storeId?: string) =>
  api.get('/sales/by-day', { params: { day, storeId } });

// Advanced search with filtering, sorting, and pagination
interface SearchParams {
  searchTerm?: string;
  phone?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const advancedSearch = (params: SearchParams) =>
  api.get('/sales/search', { params });

export default {
  getAll,
  getTodaysSales,
  getByPaymentMethod,
  getByDate,
  getByDay,
  advancedSearch,
};
