/**
 * Store Dashboard Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements per-store dashboard reporting: KPIs, monthly sales trends,
 * payment breakdown, and top-selling items.
 */

import type { Request, Response } from 'express';
import { query } from '../db/index';

// GET /stores/:storeId/dashboard/stats
export const getStoreStats = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
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
        COUNT(DISTINCT NULLIF(TRIM(customer_details->>'name'), '')) as total_customers
      FROM sales
      WHERE store_id = $1
    `, [storeId, startOfToday, startOfWeek, startOfMonth]);

    const stockRes = await query<{ out_of_stock: string }>('SELECT COUNT(*) as out_of_stock FROM products WHERE current_stock = 0');

    const s = salesRes.rows[0];
    res.json({
      todaySales: Number(s?.today_sales) || 0,
      thisWeekSales: Number(s?.week_sales) || 0,
      thisMonthSales: Number(s?.month_sales) || 0,
      outOfStockProducts: Number(stockRes.rows[0]?.out_of_stock) || 0,
      totalCustomers: Number(s?.total_customers) || 0
    });
  } catch (err: any) {
    console.error('Error fetching store stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /stores/:storeId/dashboard/monthly-sales
export const getStoreMonthlySales = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const currentYear = new Date().getFullYear();

    const resDb = await query(`
      SELECT
        EXTRACT(MONTH FROM date_time) as month,
        COALESCE(SUM(grand_total), 0) as total_sales,
        COUNT(*) as count
      FROM sales
      WHERE store_id = $1
        AND date_time >= $2
        AND date_time < $3
      GROUP BY EXTRACT(MONTH FROM date_time)
      ORDER BY month ASC
    `, [storeId, new Date(currentYear, 0, 1), new Date(currentYear + 1, 0, 1)]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = monthNames.map((label, idx) => {
      const found = resDb.rows.find(s => Number(s.month) === idx + 1);
      return {
        label,
        value: found ? Number(found.total_sales) : 0,
        count: found ? Number(found.count) : 0
      };
    });

    res.json(data);
  } catch (err: any) {
    console.error('Error fetching store monthly sales:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /stores/:storeId/dashboard/payment-split
export const getStorePaymentSplit = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const resDb = await query(`
      SELECT payment_method as method, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
      FROM sales
      WHERE store_id = $1
      GROUP BY payment_method
    `, [storeId]);

    res.json(resDb.rows.map(r => ({
      method: r.method,
      count: Number(r.count),
      total: Number(r.total)
    })));
  } catch (err: any) {
    console.error('Error fetching store payment split:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /stores/:storeId/dashboard/top-products
export const getStoreTopProducts = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const sql = `
      SELECT
        item->>'sku' as sku,
        COALESCE(item->>'itemName', p.product_name, '') as "itemName",
        SUM((item->>'quantity')::numeric) as quantity,
        SUM((item->>'totalAmount')::numeric) as revenue,
        AVG((item->>'pricePerUnit')::numeric) as "unitPrice"
      FROM sales s,
      LATERAL jsonb_array_elements(s.items) as item
      LEFT JOIN products p ON p.sku = item->>'sku'
      WHERE s.store_id = $1
      GROUP BY item->>'sku', item->>'itemName', p.product_name
      ORDER BY quantity DESC
      LIMIT 6
    `;
    const resDb = await query(sql, [storeId]);
    res.json(resDb.rows.map(r => ({
      sku: r.sku,
      itemName: r.itemName,
      quantity: Number(r.quantity) || 0,
      revenue: Number(r.revenue) || 0,
      unitPrice: Number(r.unitPrice) || 0
    })));
  } catch (err: any) {
    console.error('Error fetching store top products:', err);
    res.status(500).json({ error: err.message });
  }
};

export default {
  getStoreStats,
  getStoreMonthlySales,
  getStorePaymentSplit,
  getStoreTopProducts
};
