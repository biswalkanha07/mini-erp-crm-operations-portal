export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  _id?: string;
  id: string;
  challanId?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt?: string;
}

export interface Challan {
  _id?: string;
  id: string;
  challanNumber: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCompany?: string;
  customerAddress?: any;
  organizationId?: string;
  status: ChallanStatus;
  totalAmount: number;
  notes?: string;
  items?: ChallanItem[];
  itemCount?: number;
  totalQuantity?: number;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallanFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  search?: string;
}

export interface ChallanListResponse {
  success: boolean;
  data: Challan[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
