export interface Category {
  _id?: string;
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  status: 'active' | 'inactive';
  organizationId?: string; // set by server; optional on client models
  createdAt?: string;
  updatedAt?: string;
}
