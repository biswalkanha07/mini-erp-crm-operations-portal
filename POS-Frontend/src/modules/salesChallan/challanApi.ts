import { api } from '../../api';
import { Challan, ChallanFilterParams, ChallanListResponse } from './types';

export const getChallans = (params?: ChallanFilterParams) => {
  return api.get<ChallanListResponse>('/challans', { params });
};

export const getChallanById = (id: string) => {
  return api.get<{ success: boolean; data: Challan }>(`/challans/${id}`);
};

export const createChallan = (data: {
  customerId: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}) => {
  return api.post<{ success: boolean; message: string; data: Challan }>('/challans', data);
};

export const updateDraftChallan = (id: string, data: {
  customerId: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}) => {
  return api.put<{ success: boolean; message: string; data: Challan }>(`/challans/${id}`, data);
};

export const confirmChallan = (id: string) => {
  return api.post<{ success: boolean; message: string; data: Challan; insufficientItems?: string[] }>(`/challans/${id}/confirm`);
};

export const cancelChallan = (id: string) => {
  return api.post<{ success: boolean; message: string; data: Challan }>(`/challans/${id}/cancel`);
};
