/**
 * Dashboard Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements dashboard analytics, trends, charts, and ERP consolidated overview.
 */

import type { Request, Response } from 'express';
import dashboardService from '../services/dashboardService';
import { query } from '../db/index';

// Get sales per store for org admin dashboard
export const getSalesByStore = async (_req: Request, res: Response) => {
  try {
    const salesByStore = await dashboardService.getSalesByStore();
    res.json(salesByStore);
  } catch (err: any) {
    console.error('Error fetching sales by store:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get dashboard statistics
export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get monthly sales data for charts
export const getMonthlySales = async (_req: Request, res: Response) => {
  try {
    const monthlySales = await dashboardService.getMonthlySales();
    res.json(monthlySales);
  } catch (err: any) {
    console.error('Error fetching monthly sales:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get most sold products
export const getMostSoldProducts = async (_req: Request, res: Response) => {
  try {
    const topProducts = await dashboardService.getTopProducts();
    res.json(topProducts);
  } catch (err: any) {
    console.error('Error fetching most sold products:', err);
    res.status(500).json({ error: err.message });
  }
};

// Alias for getTopProducts
export const getTopProducts = getMostSoldProducts;

// Get sales trend over time
export const getSalesTrend = async (req: Request, res: Response) => {
  try {
    const { period = 'week' } = req.query as { period?: string };
    let days = 7;
    if (period === 'month') days = 30;
    if (period === 'year') days = 365;

    const sql = `
      SELECT
        DATE(date_time) as date,
        COALESCE(SUM(grand_total), 0) as total_sales,
        COUNT(*) as transaction_count
      FROM sales
      WHERE date_time >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(date_time)
      ORDER BY date ASC
    `;
    const result = await query(sql);
    const trend = result.rows.map(r => ({
      _id: r.date,
      date: r.date,
      totalSales: Number(r.total_sales) || 0,
      transactionCount: Number(r.transaction_count) || 0
    }));
    res.json(trend);
  } catch (err: any) {
    console.error('Error fetching sales trend:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get profit data
export const getProfitData = async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query as { period?: string };
    let days = 30;
    if (period === 'year') days = 365;

    const sql = `
      SELECT
        EXTRACT(MONTH FROM date_time) as month,
        EXTRACT(YEAR FROM date_time) as year,
        COALESCE(SUM(grand_total), 0) as total_revenue,
        COUNT(*) as transaction_count
      FROM sales
      WHERE date_time >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY EXTRACT(YEAR FROM date_time), EXTRACT(MONTH FROM date_time)
      ORDER BY year ASC, month ASC
    `;
    const result = await query(sql);
    const profitData = result.rows.map(r => {
      const revenue = Number(r.total_revenue) || 0;
      return {
        _id: { year: Number(r.year), month: Number(r.month) },
        totalRevenue: revenue,
        transactionCount: Number(r.transaction_count) || 0,
        profit: revenue * 0.2,
        cost: revenue * 0.8
      };
    });
    res.json(profitData);
  } catch (err: any) {
    console.error('Error fetching profit data:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get customer statistics
export const getCustomerStats = async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getCustomerStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching customer stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get inventory statistics
export const getInventoryStats = async (_req: Request, res: Response) => {
  try {
    const overviewRes = await query(`
      SELECT
        COUNT(*) as total_products,
        COALESCE(SUM(current_stock), 0) as total_stock,
        COALESCE(SUM(current_stock * unit_price), 0) as total_value,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN current_stock > 0 AND current_stock <= minimum_stock THEN 1 END) as low_stock
      FROM products
    `);

    const catRes = await query(`
      SELECT
        c.category_name as "categoryName",
        COUNT(p.id) as "productCount",
        COALESCE(SUM(p.current_stock), 0) as "totalStock",
        COALESCE(SUM(p.current_stock * p.unit_price), 0) as "totalValue"
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id OR p.category_id = c.category_id
      GROUP BY c.category_name
      ORDER BY "productCount" DESC
    `);

    const o = overviewRes.rows[0];
    res.json({
      overview: {
        totalProducts: Number(o?.total_products) || 0,
        totalStock: Number(o?.total_stock) || 0,
        totalValue: Number(o?.total_value) || 0,
        outOfStock: Number(o?.out_of_stock) || 0,
        lowStock: Number(o?.low_stock) || 0
      },
      categoryBreakdown: catRes.rows.map(r => ({
        categoryName: r.categoryName || 'Uncategorized',
        productCount: Number(r.productCount) || 0,
        totalStock: Number(r.totalStock) || 0,
        totalValue: Number(r.totalValue) || 0
      }))
    });
  } catch (err: any) {
    console.error('Error fetching inventory stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get recent activities/transactions
export const getRecentActivities = async (_req: Request, res: Response) => {
  try {
    const activities = await dashboardService.getRecentActivities();
    res.json(activities);
  } catch (err: any) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get inventory alerts
export const getInventoryAlerts = async (_req: Request, res: Response) => {
  try {
    const alerts = await dashboardService.getInventoryAlerts();
    res.json(alerts);
  } catch (err: any) {
    console.error('Error fetching inventory alerts:', err);
    res.status(500).json({ error: err.message });
  }
};

// Phase 8: Get consolidated ERP Dashboard overview
export const getERPOverview = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || (req.user as any)?.organization_id;
    const userRole = req.user?.role;
    const data = await dashboardService.getERPOverview({ organizationId, userRole });
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error fetching ERP dashboard overview:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  getSalesByStore,
  getStats,
  getMonthlySales,
  getMostSoldProducts,
  getTopProducts,
  getSalesTrend,
  getProfitData,
  getCustomerStats,
  getInventoryStats,
  getRecentActivities,
  getInventoryAlerts,
  getERPOverview
};
