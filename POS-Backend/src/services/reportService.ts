/**
 * Report Service (Customer Sales & Historical Purchase Reports)
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Handles aggregated per-store customer reports, top spenders, and customer purchase histories.
 */

import { query } from '../db/index';
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

export interface CustomerReportsFilter {
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface CustomerReportItem {
  _id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string | Date;
  firstVisit: string | Date;
  averageOrderValue: number;
  totalDiscountReceived: number;
}

export interface CustomerReportsResult {
  totalCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  customers: CustomerReportItem[];
}

export interface TopCustomerItem {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | Date;
}

export interface CustomerPurchaseHistoryItem {
  transactionId: string;
  dateTime: string | Date;
  items: unknown[];
  grandTotal: number;
  paymentMethod: string;
}

export const getCustomerReports = async (
  storeId: string,
  { startDate, endDate, searchTerm }: CustomerReportsFilter = {}
): Promise<CustomerReportsResult> => {
  const conditions = ['store_id = $1'];
  const params: unknown[] = [storeId];
  let pIdx = 2;

  if (startDate && endDate) {
    const timeZone = 'Asia/Kolkata';
    const start = zonedTimeToUtc(startOfDay(parseISO(startDate)), timeZone);
    const end = zonedTimeToUtc(endOfDay(parseISO(endDate)), timeZone);
    conditions.push(`date_time >= $${pIdx} AND date_time <= $${pIdx + 1}`);
    params.push(start, end);
    pIdx += 2;
  }

  if (searchTerm && searchTerm.trim()) {
    conditions.push(`(
      customer_details->>'name' ILIKE $${pIdx} OR
      customer_details->>'phone' ILIKE $${pIdx}
    )`);
    params.push(`%${searchTerm.trim()}%`);
    pIdx++;
  }

  const sql = `
    SELECT
      COALESCE(NULLIF(customer_details->>'phone', ''), NULLIF(customer_details->>'name', ''), 'anonymous') as customer_id,
      MAX(COALESCE(NULLIF(customer_details->>'name', ''), 'Anonymous Customer')) as customer_name,
      MAX(COALESCE(NULLIF(customer_details->>'phone', ''), '')) as customer_phone,
      MAX(COALESCE(NULLIF(customer_details->>'email', ''), '')) as customer_email,
      COUNT(*) as total_orders,
      COALESCE(SUM(grand_total), 0) as total_spent,
      MAX(date_time) as last_visit,
      MIN(date_time) as first_visit,
      COALESCE(AVG(grand_total), 0) as average_order_value,
      COALESCE(SUM(discount_total), 0) as total_discount_received
    FROM sales
    WHERE ${conditions.join(' AND ')}
    GROUP BY customer_id
    ORDER BY total_spent DESC
  `;

  const res = await query(sql, params);
  const customers: CustomerReportItem[] = res.rows.map(r => ({
    _id: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerEmail: r.customer_email,
    totalOrders: Number(r.total_orders) || 0,
    totalSpent: Number(r.total_spent) || 0,
    lastVisit: r.last_visit,
    firstVisit: r.first_visit,
    averageOrderValue: Number(r.average_order_value) || 0,
    totalDiscountReceived: Number(r.total_discount_received) || 0
  }));

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);

  return {
    totalCustomers: customers.length,
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    customers
  };
};

export const getTopCustomers = async (storeId: string, limit: number | string = 5): Promise<TopCustomerItem[]> => {
  const sql = `
    SELECT
      customer_details->>'name' as name,
      customer_details->>'phone' as phone,
      COUNT(*) as total_orders,
      COALESCE(SUM(grand_total), 0) as total_spent,
      MAX(date_time) as last_order_date
    FROM sales
    WHERE store_id = $1 AND customer_details->>'name' IS NOT NULL AND TRIM(customer_details->>'name') != ''
    GROUP BY customer_details->>'name', customer_details->>'phone'
    ORDER BY total_spent DESC
    LIMIT $2
  `;
  const res = await query(sql, [storeId, Number(limit)]);
  return res.rows.map(r => ({
    name: r.name || 'Anonymous Customer',
    phone: r.phone || 'N/A',
    totalOrders: Number(r.total_orders) || 0,
    totalSpent: Number(r.total_spent) || 0,
    lastOrderDate: r.last_order_date
  }));
};

export const getCustomerPurchaseHistory = async (
  storeId: string,
  customerPhone: string
): Promise<CustomerPurchaseHistoryItem[]> => {
  const sql = `
    SELECT *
    FROM sales
    WHERE store_id = $1 AND customer_details->>'phone' = $2
    ORDER BY date_time DESC
  `;
  const res = await query(sql, [storeId, customerPhone]);
  return res.rows.map(r => ({
    transactionId: r.transaction_id,
    dateTime: r.date_time,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
    grandTotal: Number(r.grand_total) || 0,
    paymentMethod: r.payment_method
  }));
};

export default {
  getCustomerReports,
  getTopCustomers,
  getCustomerPurchaseHistory
};
