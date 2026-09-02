export interface CustomerReport {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  totalVisits: number;
  totalPurchases: number;
  totalSpent: number;
  firstVisit: Date;
  lastVisit: Date;
  averageOrderValue: number;
}

export interface CustomerReportsResponse {
  customers: CustomerReport[];
  totalCustomers: number;
  totalVisits: number;
  totalRevenue: number;
}
