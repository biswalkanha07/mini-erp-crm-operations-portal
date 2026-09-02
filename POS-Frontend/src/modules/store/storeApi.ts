import { storeAPI } from '../../api';

export const getStores = () => storeAPI.getAll();
export const getStoreById = (id: string) => storeAPI.getById(id);
export const createStore = (data: any) => storeAPI.create(data);
export const updateStore = (id: string, data: any) => storeAPI.update(id, data);
export const deleteStore = (id: string) => storeAPI.delete(id);

export const searchStores = (params: {
  search?: string;
  status?: 'active' | 'inactive';
  organizationId?: string;
  theme?: 'light' | 'dark';
  minGst?: number | string;
  maxGst?: number | string;
  fromDate?: string; // ISO date
  toDate?: string;   // ISO date
}) => storeAPI.search(params);
// src/modules/store/storeApi.ts


