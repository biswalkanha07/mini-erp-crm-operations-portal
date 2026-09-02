export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  _id?: string;
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantityChanged: number;
  quantity: number;
  movementType: MovementType;
  reason: string;
  referenceId?: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  organizationId?: string;
  currentStock?: number;
  createdAt: string;
}

export interface StockMovementFilterParams {
  page?: number;
  limit?: number;
  productId?: string;
  movementType?: string;
  reason?: string;
  search?: string;
}

export interface StockMovementListResponse {
  success: boolean;
  data: StockMovement[];
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
