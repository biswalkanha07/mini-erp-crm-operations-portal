/**
 * Order Service (B2B Store Order & Fulfillment Requests)
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Handles store replenish orders, approval workflows, and store order invoice generation.
 */

import { query } from '../db/index';
import {
  mapOrder,
  mapStoreOrderInvoice,
  mapStore,
  mapOrganization,
  mapProduct,
  Order,
  StoreOrderInvoice
} from '../db/mapper';

export interface OrderFilterParams {
  status?: string;
  storeId?: string;
}

export interface CreateOrderData {
  storeId: string;
  items: Array<{
    sku: string;
    itemName: string;
    quantity: number;
  }>;
}

export interface UpdateOrderStatusData {
  status: string;
  adminNote?: string;
}

export interface UpdateOrderStatusResult {
  order: Order | null;
  invoice: StoreOrderInvoice | null;
}

export const getAll = async ({ status, storeId }: OrderFilterParams = {}): Promise<Order[]> => {
  let sql = `
    SELECT o.*,
           row_to_json(st.*) as store_obj
    FROM orders o
    LEFT JOIN stores st ON o.store_id = st.id OR o.store_id = st.store_id
  `;
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (status) {
    conditions.push(`o.status = $${params.length + 1}`);
    params.push(status);
  }
  if (storeId) {
    conditions.push(`o.store_id = $${params.length + 1}`);
    params.push(storeId);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY o.created_at DESC';

  const res = await query(sql, params);
  return res.rows.map(r => {
    const o = mapOrder(r);
    if (o && r.store_obj) {
      (o as any).storeId = {
        _id: r.store_obj.id,
        id: r.store_obj.id,
        storeId: r.store_obj.store_id,
        storeName: r.store_obj.store_name
      };
    }
    return o;
  }).filter(Boolean) as Order[];
};

export const getById = async (id: string): Promise<Order | null> => {
  const sql = `
    SELECT o.*,
           row_to_json(st.*) as store_obj
    FROM orders o
    LEFT JOIN stores st ON o.store_id = st.id OR o.store_id = st.store_id
    WHERE o.id = $1
    LIMIT 1
  `;
  const res = await query(sql, [id]);
  if (!res.rows[0]) return null;
  const o = mapOrder(res.rows[0]);
  if (o && res.rows[0].store_obj) {
    (o as any).storeId = {
      _id: res.rows[0].store_obj.id,
      id: res.rows[0].store_obj.id,
      storeId: res.rows[0].store_obj.store_id,
      storeName: res.rows[0].store_obj.store_name
    };
  }
  return o;
};

export const getByStore = async (storeId: string): Promise<Order[]> => {
  return getAll({ storeId });
};

export const create = async ({ storeId, items }: CreateOrderData): Promise<Order | null> => {
  const id = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const res = await query(`
    INSERT INTO orders (id, store_id, items, status, created_at, updated_at)
    VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `, [id, storeId, JSON.stringify(items || [])]);

  return mapOrder(res.rows[0]);
};

export const updateStatus = async (
  id: string,
  { status, adminNote }: UpdateOrderStatusData
): Promise<UpdateOrderStatusResult> => {
  const current = await getById(id);
  if (!current) {
    const err = new Error('Order not found') as Error & { httpStatus?: number };
    err.httpStatus = 404;
    throw err;
  }

  let invoice: StoreOrderInvoice | null = null;

  if (status === 'approved' && !current.invoiceId) {
    // Generate store order invoice
    const targetStoreId =
      typeof current.storeId === 'object' && current.storeId !== null
        ? (current.storeId as any).storeId || (current.storeId as any).id
        : current.storeId;

    const storeRes = await query(
      'SELECT * FROM stores WHERE id = $1 OR store_id = $1 LIMIT 1',
      [targetStoreId]
    );
    const store = mapStore(storeRes.rows[0]);
    if (!store) throw new Error('Store not found');

    const orgRes = await query(
      'SELECT * FROM organizations WHERE id = $1 OR organization_id = $1 LIMIT 1',
      [store.organizationId]
    );
    const organization = mapOrganization(orgRes.rows[0]);
    if (!organization) throw new Error('Organization not found');

    const skus = (current.items || []).map((i: any) => i.sku);
    const prodRes = await query('SELECT * FROM products WHERE sku = ANY($1)', [skus]);
    const catalogueItems = prodRes.rows.map(mapProduct).filter(Boolean);

    let totalAmount = 0;
    const invoiceItems = (current.items || []).map((item: any) => {
      const cat = catalogueItems.find(c => c?.sku === item.sku);
      const pricePerUnit = cat ? Number(cat.price) : 0;
      const quantity = Number(item.quantity) || 0;
      const itemSubTotal = pricePerUnit * quantity;
      const productGstRate = cat && typeof cat.gstRate === 'number' ? Number(cat.gstRate) : 0;
      const itemGst = (itemSubTotal * productGstRate) / 100;
      const itemTotal = itemSubTotal + itemGst;
      totalAmount += itemTotal;

      return {
        sku: item.sku,
        itemName: item.itemName,
        quantity,
        pricePerUnit,
        gst: itemGst,
        discount: 0,
        total: itemTotal
      };
    });

    const invoiceNo = `ORD-INV-${Date.now()}`;
    const invoiceId = invoiceNo;
    const storeAddressStr = store.address
      ? (store.address.fullAddress || Object.values(store.address).filter(Boolean).join(', '))
      : '';

    const soiRes = await query(`
      INSERT INTO store_order_invoices (
        id, invoice_no, store_id, organization_id, items,
        total_amount, date_time, due_date, status, notes,
        store_name, store_address, organization_name,
        gst_number, phone_number, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'pending', $7,
        $8, $9, $10,
        $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `, [
      invoiceId,
      invoiceNo,
      store.id,
      organization.id,
      JSON.stringify(invoiceItems),
      totalAmount,
      adminNote || null,
      store.storeName,
      storeAddressStr,
      organization.organizationName,
      organization.gstNumber || '',
      organization.contactNumber || ''
    ]);

    invoice = mapStoreOrderInvoice(soiRes.rows[0]);

    // Update order with invoice_id
    const updatedOrderRes = await query(`
      UPDATE orders
      SET status = $1, admin_note = $2, invoice_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, adminNote || current.adminNote, invoiceId, id]);

    return {
      order: mapOrder(updatedOrderRes.rows[0]),
      invoice
    };
  } else {
    const updatedOrderRes = await query(`
      UPDATE orders
      SET status = $1, admin_note = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, adminNote !== undefined ? adminNote : current.adminNote, id]);

    return {
      order: mapOrder(updatedOrderRes.rows[0]),
      invoice: null
    };
  }
};

export const getStoreOrderInvoiceById = async (id: string): Promise<StoreOrderInvoice | null> => {
  const res = await query(
    'SELECT * FROM store_order_invoices WHERE id = $1 OR invoice_no = $1 LIMIT 1',
    [id]
  );
  return mapStoreOrderInvoice(res.rows[0]);
};

export default {
  getAll,
  getById,
  getByStore,
  create,
  updateStatus,
  getStoreOrderInvoiceById
};
