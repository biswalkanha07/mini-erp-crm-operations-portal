import { api } from '../../api';

export interface UserItem {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts' | 'manager' | 'cashier' | string;
  userType?: 'organization' | 'store';
  organizationId?: string;
  storeId?: string | null;
  status: 'active' | 'inactive' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
}

export const getUsers = async (params?: { search?: string; role?: string; status?: string }) => {
  const res = await api.get('/users', { params });
  return res.data;
};

export const getUserById = async (id: string) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const createUser = async (data: CreateUserData) => {
  const res = await api.post('/users', data);
  return res.data;
};

export const updateUser = async (id: string, data: Partial<CreateUserData>) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};
