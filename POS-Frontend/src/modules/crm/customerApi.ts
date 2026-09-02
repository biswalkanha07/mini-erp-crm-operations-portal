import { api } from '../../api';
import { Customer, CustomerFilterParams, CustomerFollowUp, CustomerListResponse } from './types';

export const customerApi = {
  getCustomers: (params?: CustomerFilterParams) =>
    api.get<CustomerListResponse>('/customers', { params }),

  getCustomer: (id: string) =>
    api.get<{ success: boolean; data: Customer }>(`/customers/${id}`),

  createCustomer: (data: Partial<Customer>) =>
    api.post<{ success: boolean; message: string; data: Customer }>('/customers', data),

  updateCustomer: (id: string, data: Partial<Customer>) =>
    api.put<{ success: boolean; message: string; data: Customer }>(`/customers/${id}`, data),

  deleteCustomer: (id: string) =>
    api.delete<{ success: boolean; message: string; data: Customer }>(`/customers/${id}`),

  getFollowUps: (customerId: string) =>
    api.get<{ success: boolean; data: CustomerFollowUp[] }>(`/customers/${customerId}/follow-ups`),

  addFollowUp: (customerId: string, data: { followUpDate: string; notes: string }) =>
    api.post<{ success: boolean; message: string; data: CustomerFollowUp }>(`/customers/${customerId}/follow-ups`, data)
};
