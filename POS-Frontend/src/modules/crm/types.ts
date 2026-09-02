export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  mobile: string;
  phone?: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  type: CustomerType;
  customerType?: CustomerType;
  address?: string;
  status: CustomerStatus;
  loyaltyPoints?: number;
  followUpDate?: string | null;
  notes?: string;
  organizationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerFollowUp {
  id: string;
  _id?: string;
  customerId: string;
  notes: string;
  note?: string;
  followUpDate: string;
  createdBy?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt?: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  followUpDate?: string;
}
