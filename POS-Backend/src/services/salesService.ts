/**
 * Sales Service (POS Transactions & Financial Reporting)
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements POS checkout transactions, row-level product locking (FOR UPDATE),
 * per-store price override application, atomic stock deduction, and sales summary reporting.
 */

import { pool, query } from '../db/index';
import { mapSale, mapStore, mapProduct, mapUser, mapStorePrice, Sale } from '../db/mapper';

export interface SalesFilterParams {
  storeId?: string;
  limit?: number | string;
  offset?: number | string;
}

export interface SaleItemInput {
  sku: string;
  quantity: number;
  discount?: number;
}

export interface CreateTransactionData {
  storeId: string;
  items: SaleItemInput[];
  paymentMethod?: string;
  customerDetails?: Record<string, unknown>;
  cashier?: string | null;
}

export interface StoreSummaryResult {
  totalTransactions: number;
  totalRevenue: number;
  totalSubTotal: number;
  totalTax: number;
  totalDiscount: number;
}

export interface PaymentBreakdownItem {
  _id: string;
  count: number;
  amount: number;
}

export const getAll = async ({ storeId, limit, offset }: SalesFilterParams = {}): Promise<Sale[]> => {
  let sql = `
    SELECT s.*,
           row_to_json(st.*) as store_obj,
           row_to_json(u.*) as cashier_obj
    FROM sales s
    LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
    LEFT JOIN users u ON s.cashier_id = u.id OR s.cashier_id = u.user_id
  `;
  const params: unknown[] = [];
  if (storeId) {
    sql += ' WHERE s.store_id = $1';
    params.push(storeId);
  }
  sql += ' ORDER BY s.date_time DESC';

  if (limit) {
    sql += ` LIMIT $${params.length + 1}`;
    params.push(Number(limit));
  }
  if (offset) {
    sql += ` OFFSET $${params.length + 1}`;
    params.push(Number(offset));
  }

  const res = await query(sql, params);
  return res.rows.map(row => {
    const sale = mapSale(row);
    if (sale) {
      if (row.store_obj) (sale as any).storeId = mapStore(row.store_obj);
      if (row.cashier_obj) (sale as any).cashier = mapUser(row.cashier_obj);
    }
    return sale;
  }).filter(Boolean) as Sale[];
};

export const getById = async (id: string): Promise<Sale | null> => {
  const sql = `
    SELECT s.*,
           row_to_json(st.*) as store_obj,
           row_to_json(u.*) as cashier_obj
    FROM sales s
    LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
    LEFT JOIN users u ON s.cashier_id = u.id OR s.cashier_id = u.user_id
    WHERE s.id = $1 OR s.transaction_id = $1
    LIMIT 1
  `;
  const res = await query(sql, [id]);
  if (!res.rows[0]) return null;
  const row = res.rows[0];
  const sale = mapSale(row);
  if (sale) {
    if (row.store_obj) (sale as any).storeId = mapStore(row.store_obj);
    if (row.cashier_obj) (sale as any).cashier = mapUser(row.cashier_obj);
  }
  return sale;
};

export const createTransaction = async ({
  storeId,
  items,
  paymentMethod,
  customerDetails,
  cashier
}: CreateTransactionData): Promise<Sale | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify store
    const storeRes = await client.query(
      'SELECT * FROM stores WHERE id = $1 OR store_id = $1 LIMIT 1',
      [storeId]
    );
    if (!storeRes.rows[0]) {
      const err = new Error('Store not found') as Error & { httpStatus?: number };
      err.httpStatus = 404;
      throw err;
    }
    const store = mapStore(storeRes.rows[0]);
    if (!store) {
      throw new Error('Store mapping error');
    }

    let subTotal = 0;
    let gstTotal = 0;
    let discountTotal = 0;
    const processedItems = [];
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const id = transactionId;

    // 2. Process items
    for (const item of items) {
      // Lock product row FOR UPDATE to ensure concurrency safety
      const prodRes = await client.query(
        'SELECT * FROM products WHERE sku = $1 FOR UPDATE',
        [item.sku]
      );
      if (!prodRes.rows[0]) {
        throw new Error(`Product with SKU ${item.sku} not found`);
      }
      const product = mapProduct(prodRes.rows[0]);
      if (!product) throw new Error(`Failed to map product with SKU ${item.sku}`);

      if (Number(product.stock) < item.quantity) {
        throw new Error(`Insufficient stock for ${product.itemName}. Available: ${product.stock}`);
      }

      // Check per-store price override
      const spRes = await client.query(
        "SELECT * FROM store_prices WHERE store_id = $1 AND sku = $2 AND status = 'active' LIMIT 1",
        [store.id, item.sku]
      );
      const override = mapStorePrice(spRes.rows[0]);
      const basePrice = Number(product.price) || 0;
      let effectivePrice = basePrice;

      if (override) {
        if (typeof override.overridePrice === 'number' && override.overridePrice !== null) {
          effectivePrice = Number(override.overridePrice);
        } else {
          const margin = Number(override.marginValue) || 0;
          effectivePrice = override.marginType === 'absolute' ? basePrice + margin : basePrice + (basePrice * margin / 100);
        }
      } else {
        const storeMargin = Number(store.profitMarginPercent) || 0;
        effectivePrice = basePrice + (basePrice * storeMargin / 100);
      }

      const itemSubTotal = Number(item.quantity) * effectivePrice;
      const itemDiscount = Number(item.discount) || 0;
      const productGstRate = typeof product.gstRate === 'number' ? Number(product.gstRate) : 0;
      const itemGst = ((itemSubTotal - itemDiscount) * productGstRate) / 100;
      const itemTotal = itemSubTotal - itemDiscount + itemGst;

      subTotal += itemSubTotal;
      discountTotal += itemDiscount;
      gstTotal += itemGst;

      processedItems.push({
        sku: item.sku,
        itemName: product.itemName,
        quantity: Number(item.quantity),
        pricePerUnit: effectivePrice,
        gstRate: productGstRate,
        gst: itemGst,
        discount: itemDiscount,
        totalAmount: itemTotal
      });

      // Decrement stock
      await client.query(
        'UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE sku = $2',
        [item.quantity, item.sku]
      );

      // Record stock movement audit log within the same transaction
      const smId = `SM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await client.query(`
        INSERT INTO stock_movements (
          id, product_id, quantity_changed, movement_type, reason,
          reference_id, created_by, organization_id, created_at
        ) VALUES ($1, $2, $3, 'OUT', 'Sale', $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        smId,
        product.id,
        Number(item.quantity),
        transactionId,
        cashier || null,
        store.organizationId || product.organizationId || null
      ]);
    }

    const grandTotal = subTotal - discountTotal + gstTotal;

    // 3. Insert sale
    const saleInsertRes = await client.query(`
      INSERT INTO sales (
        id, transaction_id, store_id, items, sub_total, gst_total,
        discount_total, grand_total, payment_method, customer_details,
        cashier_id, date_time, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      id,
      transactionId,
      store.id,
      JSON.stringify(processedItems),
      subTotal,
      gstTotal,
      discountTotal,
      grandTotal,
      paymentMethod || 'cash',
      JSON.stringify(customerDetails || {}),
      cashier || null
    ]);

    await client.query('COMMIT');
    return mapSale(saleInsertRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

export const getSummaryByStore = async (
  storeId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<StoreSummaryResult> => {
  let sql = `
    SELECT
      COUNT(*) as total_transactions,
      COALESCE(SUM(grand_total), 0) as total_revenue,
      COALESCE(SUM(sub_total), 0) as total_sub_total,
      COALESCE(SUM(gst_total), 0) as total_tax,
      COALESCE(SUM(discount_total), 0) as total_discount
    FROM sales
    WHERE store_id = $1
  `;
  const params: unknown[] = [storeId];
  if (startDate) {
    sql += ` AND date_time >= $2`;
    params.push(new Date(startDate));
  }
  if (endDate) {
    sql += ` AND date_time <= $${params.length + 1}`;
    params.push(new Date(endDate));
  }

  const res = await query(sql, params);
  const row = res.rows[0];
  return {
    totalTransactions: Number(row.total_transactions) || 0,
    totalRevenue: Number(row.total_revenue) || 0,
    totalSubTotal: Number(row.total_sub_total) || 0,
    totalTax: Number(row.total_tax) || 0,
    totalDiscount: Number(row.total_discount) || 0
  };
};

export const getPaymentBreakdown = async (
  storeId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<PaymentBreakdownItem[]> => {
  let sql = `
    SELECT
      payment_method,
      COUNT(*) as count,
      COALESCE(SUM(grand_total), 0) as amount
    FROM sales
    WHERE store_id = $1
  `;
  const params: unknown[] = [storeId];
  if (startDate) {
    sql += ` AND date_time >= $2`;
    params.push(new Date(startDate));
  }
  if (endDate) {
    sql += ` AND date_time <= $${params.length + 1}`;
    params.push(new Date(endDate));
  }
  sql += ' GROUP BY payment_method';

  const res = await query(sql, params);
  return res.rows.map(r => ({
    _id: r.payment_method,
    count: Number(r.count),
    amount: Number(r.amount)
  }));
};

export default {
  getAll,
  getById,
  createTransaction,
  getSummaryByStore,
  getPaymentBreakdown
};
