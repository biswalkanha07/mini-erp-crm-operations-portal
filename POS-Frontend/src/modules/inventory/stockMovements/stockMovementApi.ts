import { api } from '../../../api';
import { StockMovementFilterParams, StockMovementListResponse, StockMovement } from './types';

export const getStockMovements = (params?: StockMovementFilterParams) => {
  return api.get<StockMovementListResponse>('/stock-movements', { params });
};

export const getStockMovementById = (id: string) => {
  return api.get<{ success: boolean; data: StockMovement }>(`/stock-movements/${id}`);
};

export const createStockMovement = (data: {
  productId: string;
  quantity: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  referenceId?: string;
}) => {
  return api.post<{ success: boolean; data: StockMovement; currentStock: number }>('/stock-movements', data);
};
