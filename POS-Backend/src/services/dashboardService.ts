/**
 * Dashboard Service (Consolidated ERP Analytics & Store Metrics)
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements real-time aggregate reporting for CRM, Inventory, Stock Movements,
 * Sales Challans, Store Performance, and Operations Alerts.
 */

import { query } from '../db/index';
import { mapProduct, Product } from '../db/mapper';

export interface SalesByStoreItem {
  storeId: string;
  storeName: string;
  totalSales: number;
  transactionCount: number;
}

export interface StatsResult {
  todaySales: number;
  thisWeekSales: number;
  thisMonthSales: number;
  outOfStockProducts: number;
  totalCustomers: number;
  monthlyProfit: number;
}

export interface MonthlySalesItem {
  _id: number;
  month: string;
  totalSales: number;
  count: number;
}

export interface TopProductItem {
  _id: string;
  sku: string;
  itemName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string | Date;
}

export interface CustomerStatsItem {
  name: string;
  phone: string;
  purchaseCount: number;
  totalSpent: number;
  lastPurchase: string | Date;
}

export interface CustomerStatsResult {
  totalCustomers: number;
  totalCustomerRevenue: number;
  averageOrderValue: number;
  topCustomers: CustomerStatsItem[];
}

export interface InventoryAlertsResult {
  outOfStockCount: number;
  lowStockCount: number;
  outOfStockProducts: Product[];
  lowStockProducts: Product[];
}

export interface StoreStatsResult {
  todaySales: number;
  thisWeekSales: number;
  thisMonthSales: number;
  totalSales: number;
  totalTransactions: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
}

export interface ERPOverviewParams {
  organizationId?: string | null;
  userRole?: string | null;
}

export interface ERPOverviewResult {
  customers: {
    total: number;
    active: number;
    leads: number;
    inactive: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalStockQuantity: number;
    estimatedInventoryValue: number;
  };
  challans: {
    total: number;
    today: number;
    draft: number;
    confirmed: number;
    cancelled: number;
    todayConfirmedAmount: number;
  };
  followUps: {
    due: number;
    upcoming: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    actionUrl: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    productName: string;
    sku: string;
    currentStock: number;
    minimumStock: number;
    warehouseLocation: string;
    unitPrice: number;
  }>;
  recentChallans: Array<{
    id: string;
    challanNumber: string;
    customerName: string;
    customerCompany: string | null;
    status: string;
    totalAmount: number;
    createdAt: string | Date;
  }>;
  recentStockMovements: Array<{
    id: string;
    productName: string;
    sku: string;
    movementType: string;
    quantityChanged: number;
    reason: string;
    referenceId: string | null;
    createdByName: string;
    createdAt: string | Date;
  }>;
  upcomingFollowUps: Array<{
    id: string;
    name: string;
    businessName: string | null;
    phone: string;
    status: string;
    followUpDate: string | Date;
  }>;
}

export const getSalesByStore = async (): Promise<SalesByStoreItem[]> => {
  const sql = `
    SELECT
      s.store_id as "storeId",
      st.store_name as "storeName",
      COALESCE(SUM(s.grand_total), 0) as "totalSales",
      COUNT(s.id) as "transactionCount"
    FROM sales s
    LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
    GROUP BY s.store_id, st.store_name
    ORDER BY "totalSales" DESC
  `;
  const res = await query(sql);
  return res.rows.map(r => ({
    storeId: r.storeId,
    storeName: r.storeName || r.storeId,
    totalSales: Number(r.totalSales) || 0,
    transactionCount: Number(r.transactionCount) || 0
  }));
};

export const getStats = async (): Promise<StatsResult> => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const salesRes = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN date_time >= $1 THEN grand_total ELSE 0 END), 0) as today_sales,
      COALESCE(SUM(CASE WHEN date_time >= $2 THEN grand_total ELSE 0 END), 0) as week_sales,
      COALESCE(SUM(CASE WHEN date_time >= $3 THEN grand_total ELSE 0 END), 0) as month_sales,
      COUNT(DISTINCT NULLIF(TRIM(customer_details->>'name'), '')) as total_customers
    FROM sales
  `, [startOfToday, startOfWeek, startOfMonth]);

  const stockRes = await query<{ out_of_stock: string }>('SELECT COUNT(*) as out_of_stock FROM products WHERE current_stock = 0');

  const sRow = salesRes.rows[0];
  const outOfStock = Number(stockRes.rows[0]?.out_of_stock) || 0;
  const monthTotal = Number(sRow?.month_sales) || 0;

  return {
    todaySales: Number(sRow?.today_sales) || 0,
    thisWeekSales: Number(sRow?.week_sales) || 0,
    thisMonthSales: monthTotal,
    outOfStockProducts: outOfStock,
    totalCustomers: Number(sRow?.total_customers) || 0,
    monthlyProfit: monthTotal * 0.2
  };
};

export const getMonthlySales = async (): Promise<MonthlySalesItem[]> => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);

  const res = await query(`
    SELECT
      EXTRACT(MONTH FROM date_time) as month,
      COALESCE(SUM(grand_total), 0) as total_sales,
      COUNT(*) as count
    FROM sales
    WHERE date_time >= $1 AND date_time < $2
    GROUP BY EXTRACT(MONTH FROM date_time)
    ORDER BY month ASC
  `, [startOfYear, endOfYear]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatted: MonthlySalesItem[] = [];
  for (let i = 1; i <= 12; i++) {
    const row = res.rows.find(r => Number(r.month) === i);
    formatted.push({
      _id: i,
      month: monthNames[i - 1],
      totalSales: row ? Number(row.total_sales) : 0,
      count: row ? Number(row.count) : 0
    });
  }
  return formatted;
};

export const getTopProducts = async (): Promise<TopProductItem[]> => {
  const sql = `
    SELECT
      item->>'sku' as sku,
      item->>'itemName' as item_name,
      SUM((item->>'quantity')::numeric) as total_quantity,
      SUM((item->>'totalAmount')::numeric) as total_revenue
    FROM sales,
    LATERAL jsonb_array_elements(items) as item
    GROUP BY item->>'sku', item->>'itemName'
    ORDER BY total_quantity DESC
    LIMIT 5
  `;
  const res = await query(sql);
  return res.rows.map(r => ({
    _id: r.sku,
    sku: r.sku,
    itemName: r.item_name,
    totalSold: Number(r.total_quantity) || 0,
    totalRevenue: Number(r.total_revenue) || 0
  }));
};

export const getRecentActivities = async (): Promise<RecentActivityItem[]> => {
  const res = await query(`
    SELECT
      s.id, s.transaction_id, s.grand_total, s.date_time,
      st.store_name
    FROM sales s
    LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
    ORDER BY s.date_time DESC
    LIMIT 10
  `);
  return res.rows.map(r => ({
    id: r.id,
    type: 'sale',
    description: `Sale ${r.transaction_id} at ${r.store_name || 'Store'} for ₹${Number(r.grand_total)}`,
    timestamp: r.date_time
  }));
};

export const getCustomerStats = async (): Promise<CustomerStatsResult> => {
  const sql = `
    SELECT
      customer_details->>'name' as name,
      customer_details->>'phone' as phone,
      COUNT(*) as purchase_count,
      SUM(grand_total) as total_spent,
      MAX(date_time) as last_purchase
    FROM sales
    WHERE customer_details->>'name' IS NOT NULL AND TRIM(customer_details->>'name') != ''
    GROUP BY customer_details->>'name', customer_details->>'phone'
    ORDER BY total_spent DESC
    LIMIT 20
  `;
  const res = await query(sql);
  const customers: CustomerStatsItem[] = res.rows.map(r => ({
    name: r.name,
    phone: r.phone || '',
    purchaseCount: Number(r.purchase_count) || 0,
    totalSpent: Number(r.total_spent) || 0,
    lastPurchase: r.last_purchase
  }));

  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  return {
    totalCustomers: customers.length,
    totalCustomerRevenue: totalSpentAll,
    averageOrderValue: customers.length > 0 ? totalSpentAll / customers.length : 0,
    topCustomers: customers
  };
};

export const getInventoryAlerts = async (): Promise<InventoryAlertsResult> => {
  const outOfStockRes = await query('SELECT * FROM products WHERE current_stock = 0');
  const lowStockRes = await query('SELECT * FROM products WHERE current_stock > 0 AND current_stock <= minimum_stock');

  return {
    outOfStockCount: outOfStockRes.rows.length,
    lowStockCount: lowStockRes.rows.length,
    outOfStockProducts: outOfStockRes.rows.map(mapProduct).filter(Boolean) as Product[],
    lowStockProducts: lowStockRes.rows.map(mapProduct).filter(Boolean) as Product[]
  };
};

export const getStoreStats = async (storeId: string): Promise<StoreStatsResult> => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const salesRes = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN date_time >= $2 THEN grand_total ELSE 0 END), 0) as today_sales,
      COALESCE(SUM(CASE WHEN date_time >= $3 THEN grand_total ELSE 0 END), 0) as week_sales,
      COALESCE(SUM(CASE WHEN date_time >= $4 THEN grand_total ELSE 0 END), 0) as month_sales,
      COALESCE(SUM(grand_total), 0) as total_sales,
      COUNT(*) as total_transactions,
      COUNT(DISTINCT NULLIF(TRIM(customer_details->>'name'), '')) as total_customers
    FROM sales
    WHERE store_id = $1
  `, [storeId, startOfToday, startOfWeek, startOfMonth]);

  const stockRes = await query<{ total_products: string; low_stock: string }>(
    'SELECT COUNT(*) as total_products, COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock FROM products'
  );

  const sRow = salesRes.rows[0];
  const pRow = stockRes.rows[0];

  return {
    todaySales: Number(sRow?.today_sales) || 0,
    thisWeekSales: Number(sRow?.week_sales) || 0,
    thisMonthSales: Number(sRow?.month_sales) || 0,
    totalSales: Number(sRow?.total_sales) || 0,
    totalTransactions: Number(sRow?.total_transactions) || 0,
    totalCustomers: Number(sRow?.total_customers) || 0,
    totalProducts: Number(pRow?.total_products) || 0,
    lowStockItems: Number(pRow?.low_stock) || 0
  };
};

export const getERPOverview = async ({
  organizationId,
  userRole
}: ERPOverviewParams = {}): Promise<ERPOverviewResult> => {
  const orgParam = organizationId || null;

  // 1. Customer Metrics (CRM)
  const custSql = `
    SELECT
      COUNT(*) AS total_customers,
      COUNT(CASE WHEN LOWER(status) = 'active' THEN 1 END) AS active_customers,
      COUNT(CASE WHEN LOWER(status) = 'lead' THEN 1 END) AS leads,
      COUNT(CASE WHEN LOWER(status) = 'inactive' THEN 1 END) AS inactive_customers,
      COUNT(CASE WHEN follow_up_date IS NOT NULL AND follow_up_date <= CURRENT_DATE THEN 1 END) AS follow_ups_due,
      COUNT(CASE WHEN follow_up_date IS NOT NULL AND follow_up_date > CURRENT_DATE THEN 1 END) AS follow_ups_upcoming
    FROM customers
    WHERE ($1::varchar IS NULL OR organization_id = $1 OR organization_id IS NULL)
  `;
  const custRes = await query(custSql, [orgParam]);
  const cRow = custRes.rows[0] || {};

  // 2. Inventory Metrics (minimum_stock > 0 AND current_stock <= minimum_stock)
  const invSql = `
    SELECT
      COUNT(*) AS total_products,
      COUNT(CASE WHEN minimum_stock > 0 AND current_stock <= minimum_stock THEN 1 END) AS low_stock,
      COUNT(CASE WHEN current_stock = 0 THEN 1 END) AS out_of_stock,
      COALESCE(SUM(current_stock), 0) AS total_stock_quantity,
      COALESCE(SUM(current_stock * unit_price), 0) AS estimated_inventory_value
    FROM products
    WHERE ($1::varchar IS NULL OR organization_id = $1 OR organization_id IS NULL OR organization_id IN ('ORG001', 'ORG002', 'ORG003'))
  `;
  const invRes = await query(invSql, [orgParam]);
  const iRow = invRes.rows[0] || {};

  // 3. Sales Challans Metrics
  const chSql = `
    SELECT
      COUNT(*) AS total_challans,
      COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) AS today_challans,
      COUNT(CASE WHEN UPPER(status) = 'DRAFT' THEN 1 END) AS draft_challans,
      COUNT(CASE WHEN UPPER(status) = 'CONFIRMED' THEN 1 END) AS confirmed_challans,
      COUNT(CASE WHEN UPPER(status) = 'CANCELLED' THEN 1 END) AS cancelled_challans,
      COALESCE(SUM(CASE WHEN UPPER(status) = 'CONFIRMED' AND DATE(created_at) = CURRENT_DATE THEN total_amount ELSE 0 END), 0) AS today_confirmed_amount
    FROM challans
    WHERE ($1::varchar IS NULL OR organization_id = $1 OR organization_id IS NULL)
  `;
  const chRes = await query(chSql, [orgParam]);
  const chRow = chRes.rows[0] || {};

  // 4. Operational Alerts Engine
  const alerts = [];
  const lowStockCount = Number(iRow.low_stock) || 0;
  const outOfStockCount = Number(iRow.out_of_stock) || 0;
  const followUpsDueCount = Number(cRow.follow_ups_due) || 0;
  const draftChallansCount = Number(chRow.draft_challans) || 0;

  if (outOfStockCount > 0) {
    alerts.push({
      id: 'alert-oos',
      type: 'OUT_OF_STOCK',
      severity: 'error',
      title: 'Out of Stock Products',
      message: `${outOfStockCount} product(s) have 0 stock available in catalogue.`,
      actionUrl: 'product'
    });
  }

  if (lowStockCount > 0) {
    alerts.push({
      id: 'alert-low-stock',
      type: 'LOW_STOCK',
      severity: 'warning',
      title: 'Low Stock Alert',
      message: `${lowStockCount} product(s) are at or below their minimum stock threshold.`,
      actionUrl: 'product'
    });
  }

  if (draftChallansCount > 0) {
    alerts.push({
      id: 'alert-draft-challans',
      type: 'DRAFT_CHALLANS',
      severity: 'warning',
      title: 'Draft Challans Pending Confirmation',
      message: `${draftChallansCount} sales challan(s) are waiting for confirmation and dispatch.`,
      actionUrl: 'sales-challans'
    });
  }

  if (followUpsDueCount > 0) {
    alerts.push({
      id: 'alert-follow-ups',
      type: 'FOLLOW_UP_DUE',
      severity: 'info',
      title: 'Customer Follow-ups Due',
      message: `${followUpsDueCount} customer follow-up(s) are due today or overdue.`,
      actionUrl: 'crm-customers'
    });
  }

  // 5. Critical Low Stock Products (Top 5)
  const lowStockProdsRes = await query(`
    SELECT id, item_id, product_name, sku, current_stock, minimum_stock, warehouse_location, unit_price
    FROM products
    WHERE minimum_stock > 0 AND current_stock <= minimum_stock
      AND ($1::varchar IS NULL OR organization_id = $1 OR organization_id IS NULL OR organization_id IN ('ORG001', 'ORG002', 'ORG003'))
    ORDER BY current_stock ASC, id ASC
    LIMIT 5
  `, [orgParam]);

  // 6. Recent Sales Challans (Top 5)
  const recentChallansRes = await query(`
    SELECT
      ch.id, ch.challan_number, ch.status, ch.total_amount, ch.created_at,
      c.name AS customer_name, c.business_name AS customer_company
    FROM challans ch
    LEFT JOIN customers c ON ch.customer_id = c.id
    WHERE ($1::varchar IS NULL OR ch.organization_id = $1 OR ch.organization_id IS NULL)
    ORDER BY ch.created_at DESC
    LIMIT 5
  `, [orgParam]);

  // 7. Recent Stock Movements (Top 5)
  const recentMovementsRes = await query(`
    SELECT
      sm.id, sm.movement_type, sm.quantity_changed, sm.reason, sm.reference_id, sm.created_at,
      p.product_name, p.sku,
      u.name AS created_by_name, u.email AS created_by_email
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.created_by = u.id
    WHERE ($1::varchar IS NULL OR sm.organization_id = $1 OR sm.organization_id IS NULL)
    ORDER BY sm.created_at DESC
    LIMIT 5
  `, [orgParam]);

  // 8. Upcoming Customer Follow-ups (Top 5)
  const upcomingFollowupsRes = await query(`
    SELECT
      id, name, business_name, mobile, phone, email, status, follow_up_date
    FROM customers
    WHERE follow_up_date IS NOT NULL
      AND ($1::varchar IS NULL OR organization_id = $1 OR organization_id IS NULL)
    ORDER BY follow_up_date ASC, name ASC
    LIMIT 5
  `, [orgParam]);

  return {
    customers: {
      total: Number(cRow.total_customers) || 0,
      active: Number(cRow.active_customers) || 0,
      leads: Number(cRow.leads) || 0,
      inactive: Number(cRow.inactive_customers) || 0
    },
    inventory: {
      totalProducts: Number(iRow.total_products) || 0,
      lowStock: Number(iRow.low_stock) || 0,
      outOfStock: Number(iRow.out_of_stock) || 0,
      totalStockQuantity: Number(iRow.total_stock_quantity) || 0,
      estimatedInventoryValue: Number(iRow.estimated_inventory_value) || 0
    },
    challans: {
      total: Number(chRow.total_challans) || 0,
      today: Number(chRow.today_challans) || 0,
      draft: Number(chRow.draft_challans) || 0,
      confirmed: Number(chRow.confirmed_challans) || 0,
      cancelled: Number(chRow.cancelled_challans) || 0,
      todayConfirmedAmount: Number(chRow.today_confirmed_amount) || 0
    },
    followUps: {
      due: Number(cRow.follow_ups_due) || 0,
      upcoming: Number(cRow.follow_ups_upcoming) || 0
    },
    alerts,
    lowStockProducts: lowStockProdsRes.rows.map(r => ({
      id: r.id,
      productName: r.product_name,
      sku: r.sku,
      currentStock: Number(r.current_stock) || 0,
      minimumStock: Number(r.minimum_stock) || 0,
      warehouseLocation: r.warehouse_location || '—',
      unitPrice: Number(r.unit_price) || 0
    })),
    recentChallans: recentChallansRes.rows.map(r => ({
      id: r.id,
      challanNumber: r.challan_number,
      customerName: r.customer_name || '—',
      customerCompany: r.customer_company || null,
      status: (r.status || 'DRAFT').toUpperCase(),
      totalAmount: Number(r.total_amount) || 0,
      createdAt: r.created_at
    })),
    recentStockMovements: recentMovementsRes.rows.map(r => ({
      id: r.id,
      productName: r.product_name || '—',
      sku: r.sku || '—',
      movementType: r.movement_type,
      quantityChanged: Number(r.quantity_changed) || 0,
      reason: r.reason || '—',
      referenceId: r.reference_id || null,
      createdByName: r.created_by_name || r.created_by_email || 'Staff',
      createdAt: r.created_at
    })),
    upcomingFollowUps: upcomingFollowupsRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      businessName: r.business_name || null,
      phone: r.phone || r.mobile || '—',
      status: r.status,
      followUpDate: r.follow_up_date
    }))
  };
};

export default {
  getSalesByStore,
  getStats,
  getMonthlySales,
  getTopProducts,
  getRecentActivities,
  getCustomerStats,
  getInventoryAlerts,
  getStoreStats,
  getERPOverview
};
