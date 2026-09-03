/**
 * Sales Challan Service (Dispatch & Stock Deduction)
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements draft challan creation, customer & product snapshots, deterministic row locking,
 * atomic all-or-nothing stock deduction, and status transitions.
 */

import { pool } from '../db/index';
import { mapChallan, Challan } from '../db/mapper';
import type { PoolClient } from 'pg';

export interface ChallanItemInput {
  id?: string;
  productId?: string;
  quantity: number | string;
}

export interface CreateChallanData {
  customerId: string;
  items: ChallanItemInput[];
  notes?: string | null;
  organizationId?: string | null;
  createdBy?: string | null;
}

export interface GetAllChallansParams {
  page?: number | string;
  limit?: number | string;
  status?: string;
  customerId?: string;
  search?: string;
  organizationId?: string | null;
}

export interface PaginatedChallans {
  challans: Challan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateDraftChallanData {
  customerId: string;
  items: ChallanItemInput[];
  notes?: string | null;
  organizationId?: string | null;
  userId?: string | null;
}

export interface ChallanActionParams {
  organizationId?: string | null;
  userId?: string | null;
}

/**
 * Generates a unique, concurrency-safe human-readable Challan number.
 * Format: CH-YYYY-NNNNNN
 */
async function generateChallanNumber(client: PoolClient): Promise<string> {
  const year = new Date().getFullYear();
  const seqRes = await client.query<{ seq: string | number }>("SELECT nextval('challan_num_seq') AS seq");
  const seqNum = String(seqRes.rows[0]?.seq || '1').padStart(6, '0');
  return `CH-${year}-${seqNum}`;
}

/**
 * Creates a new Sales Challan in DRAFT status with immutable product snapshots.
 * Does NOT alter product stock or create stock movements.
 */
export async function createChallan({
  customerId,
  items,
  notes,
  organizationId,
  createdBy
}: CreateChallanData): Promise<Challan | null> {
  if (!customerId) {
    const err = new Error('Customer ID is required') as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('At least one item is required to create a challan') as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  // Prevent duplicate products within a single challan
  const seenProductIds = new Set<string>();
  for (const it of items) {
    const pId = it.productId || it.id;
    if (!pId) {
      const err = new Error('Each item must specify a valid productId') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    if (seenProductIds.has(pId)) {
      const err = new Error(`Duplicate product (${pId}) in challan is not allowed. Please specify total quantity in a single line.`) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    seenProductIds.add(pId);

    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      const err = new Error(`Quantity for product ${pId} must be a positive integer`) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify customer exists
    const custRes = await client.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (custRes.rows.length === 0) {
      const err = new Error('Customer not found') as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    const customer = custRes.rows[0];

    // 2. Fetch authoritative product snapshots from PostgreSQL
    let totalChallanAmount = 0;
    const validatedItems = [];

    for (const it of items) {
      const pId = it.productId || it.id;
      const qty = Number(it.quantity);

      const prodRes = await client.query(
        'SELECT * FROM products WHERE (id = $1 OR item_id = $1 OR sku = $1)',
        [pId]
      );
      if (prodRes.rows.length === 0) {
        const err = new Error(`Product '${pId}' not found in catalogue`) as Error & { statusCode?: number };
        err.statusCode = 404;
        throw err;
      }
      const prod = prodRes.rows[0];
      const unitPrice = Number(prod.unit_price) || 0;
      const lineTotal = unitPrice * qty;
      totalChallanAmount += lineTotal;

      validatedItems.push({
        id: 'CI_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        productId: prod.id,
        productName: prod.product_name,
        sku: prod.sku,
        quantity: qty,
        unitPrice: unitPrice,
        totalAmount: lineTotal
      });
    }

    // 3. Generate Challan Number
    const challanNumber = await generateChallanNumber(client);
    const challanId = 'CHALLAN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    // 4. Insert Challan Header (Status = DRAFT)
    const insertChallanQuery = `
      INSERT INTO challans (
        id, challan_number, customer_id, organization_id, status, total_amount, notes, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'DRAFT', $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const challanRes = await client.query(insertChallanQuery, [
      challanId,
      challanNumber,
      customer.id,
      organizationId || customer.organization_id || null,
      totalChallanAmount,
      notes || null,
      createdBy || null
    ]);

    // 5. Insert Challan Item Snapshots
    for (const vItem of validatedItems) {
      await client.query(`
        INSERT INTO challan_items (
          id, challan_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_snapshot, total_amount, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `, [
        vItem.id,
        challanId,
        vItem.productId,
        vItem.productName,
        vItem.sku,
        vItem.quantity,
        vItem.unitPrice,
        vItem.totalAmount
      ]);
    }

    await client.query('COMMIT');

    const createdChallan = challanRes.rows[0];
    createdChallan.customer_name = customer.name;
    createdChallan.customer_phone = customer.phone || customer.mobile;
    createdChallan.customer_email = customer.email;
    createdChallan.customer_company = customer.business_name;
    createdChallan.items = validatedItems;

    return mapChallan(createdChallan);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lists Sales Challans with search, filtering, and pagination.
 */
export async function getAllChallans({
  page = 1,
  limit = 10,
  status,
  customerId,
  search,
  organizationId
}: GetAllChallansParams = {}): Promise<PaginatedChallans> {
  const offset = (Number(page) - 1) * Number(limit);
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (organizationId) {
    params.push(organizationId);
    whereClauses.push(`(ch.organization_id = $${params.length} OR ch.organization_id IS NULL)`);
  }

  if (status && status !== 'All') {
    params.push(status.toUpperCase());
    whereClauses.push(`UPPER(ch.status) = $${params.length}`);
  }

  if (customerId) {
    params.push(customerId);
    whereClauses.push(`ch.customer_id = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    whereClauses.push(`(ch.challan_number ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.business_name ILIKE $${params.length})`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching records
  const countQuery = `
    SELECT COUNT(*) as total
    FROM challans ch
    LEFT JOIN customers c ON ch.customer_id = c.id
    ${whereSql}
  `;
  const countRes = await pool.query<{ total: string }>(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10) || 0;
  const totalPages = Math.ceil(total / Number(limit)) || 1;

  // Fetch paginated challans
  params.push(Number(limit));
  const limitIdx = params.length;
  params.push(Number(offset));
  const offsetIdx = params.length;

  const listQuery = `
    SELECT 
      ch.id,
      ch.challan_number,
      ch.customer_id,
      ch.organization_id,
      ch.status,
      ch.total_amount,
      ch.notes,
      ch.created_by,
      ch.confirmed_at,
      ch.cancelled_at,
      ch.created_at,
      ch.updated_at,
      c.name AS customer_name,
      COALESCE(c.phone, c.mobile) AS customer_phone,
      c.email AS customer_email,
      c.business_name AS customer_company,
      u.name AS created_by_name,
      u.email AS created_by_email,
      COALESCE(ci.item_count, 0) AS item_count,
      COALESCE(ci.total_quantity, 0) AS total_quantity
    FROM challans ch
    LEFT JOIN customers c ON ch.customer_id = c.id
    LEFT JOIN users u ON ch.created_by = u.id
    LEFT JOIN (
      SELECT challan_id, COUNT(*) AS item_count, SUM(quantity) AS total_quantity
      FROM challan_items
      GROUP BY challan_id
    ) ci ON ch.id = ci.challan_id
    ${whereSql}
    ORDER BY ch.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const listRes = await pool.query(listQuery, params);

  return {
    challans: listRes.rows.map(row => {
      const mapped = mapChallan(row);
      if (mapped) {
        mapped.itemCount = parseInt(row.item_count, 10) || 0;
        mapped.totalQuantity = parseInt(row.total_quantity, 10) || 0;
      }
      return mapped;
    }).filter(Boolean) as Challan[],
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages
    }
  };
}

/**
 * Fetches a single Sales Challan with its complete product snapshot item details.
 */
export async function getChallanById(id: string, organizationId?: string | null): Promise<Challan | null> {
  const challanQuery = `
    SELECT 
      ch.id,
      ch.challan_number,
      ch.customer_id,
      ch.organization_id,
      ch.status,
      ch.total_amount,
      ch.notes,
      ch.created_by,
      ch.confirmed_at,
      ch.cancelled_at,
      ch.created_at,
      ch.updated_at,
      c.name AS customer_name,
      COALESCE(c.phone, c.mobile) AS customer_phone,
      c.email AS customer_email,
      c.business_name AS customer_company,
      c.address AS customer_address,
      u.name AS created_by_name,
      u.email AS created_by_email
    FROM challans ch
    LEFT JOIN customers c ON ch.customer_id = c.id
    LEFT JOIN users u ON ch.created_by = u.id
    WHERE ch.id = $1 AND (ch.organization_id = $2 OR $2 IS NULL OR ch.organization_id IS NULL)
  `;
  const challanRes = await pool.query(challanQuery, [id, organizationId || null]);
  if (challanRes.rows.length === 0) {
    const err = new Error('Sales Challan not found') as Error & { statusCode?: number };
    err.statusCode = 404;
    throw err;
  }

  const challan = challanRes.rows[0];

  const itemsQuery = `
    SELECT *
    FROM challan_items
    WHERE challan_id = $1
    ORDER BY created_at ASC
  `;
  const itemsRes = await pool.query(itemsQuery, [id]);
  challan.items = itemsRes.rows;

  return mapChallan(challan);
}

/**
 * Updates a DRAFT challan.
 * Rejects with 409 Conflict if challan is already CONFIRMED or CANCELLED.
 */
export async function updateDraftChallan(
  id: string,
  { customerId, items, notes, organizationId }: UpdateDraftChallanData
): Promise<Challan | null> {
  if (!customerId) {
    const err = new Error('Customer ID is required') as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('At least one item is required in challan') as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  // Prevent duplicate products
  const seenProductIds = new Set<string>();
  for (const it of items) {
    const pId = it.productId || it.id;
    if (!pId) {
      const err = new Error('Each item must specify a valid productId') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    if (seenProductIds.has(pId)) {
      const err = new Error(`Duplicate product (${pId}) in challan is not allowed`) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    seenProductIds.add(pId);

    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      const err = new Error(`Quantity for product ${pId} must be a positive integer`) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock challan row
    const chRes = await client.query(
      `SELECT * FROM challans WHERE id = $1 AND (organization_id = $2 OR $2 IS NULL OR organization_id IS NULL) FOR UPDATE`,
      [id, organizationId || null]
    );
    if (chRes.rows.length === 0) {
      const err = new Error('Sales Challan not found') as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    const currentChallan = chRes.rows[0];
    const currentStatus = (currentChallan.status || '').toUpperCase();

    if (currentStatus !== 'DRAFT') {
      const err = new Error(`Cannot modify challan with status '${currentStatus}'. Only DRAFT challans can be edited.`) as Error & { statusCode?: number };
      err.statusCode = 409;
      throw err;
    }

    // 2. Validate customer
    const custRes = await client.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (custRes.rows.length === 0) {
      const err = new Error('Customer not found') as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    const customer = custRes.rows[0];

    // 3. Re-validate items and snapshot values
    let totalChallanAmount = 0;
    const validatedItems = [];

    for (const it of items) {
      const pId = it.productId || it.id;
      const qty = Number(it.quantity);

      const prodRes = await client.query(
        'SELECT * FROM products WHERE (id = $1 OR item_id = $1 OR sku = $1)',
        [pId]
      );
      if (prodRes.rows.length === 0) {
        const err = new Error(`Product '${pId}' not found`) as Error & { statusCode?: number };
        err.statusCode = 404;
        throw err;
      }
      const prod = prodRes.rows[0];
      const unitPrice = Number(prod.unit_price) || 0;
      const lineTotal = unitPrice * qty;
      totalChallanAmount += lineTotal;

      validatedItems.push({
        id: 'CI_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        productId: prod.id,
        productName: prod.product_name,
        sku: prod.sku,
        quantity: qty,
        unitPrice: unitPrice,
        totalAmount: lineTotal
      });
    }

    // 4. Update Challan Header
    await client.query(`
      UPDATE challans
      SET customer_id = $1, total_amount = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [customer.id, totalChallanAmount, notes !== undefined ? notes : currentChallan.notes, id]);

    // 5. Replace Challan Items
    await client.query(`DELETE FROM challan_items WHERE challan_id = $1`, [id]);
    for (const vItem of validatedItems) {
      await client.query(`
        INSERT INTO challan_items (
          id, challan_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_snapshot, total_amount, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `, [
        vItem.id,
        id,
        vItem.productId,
        vItem.productName,
        vItem.sku,
        vItem.quantity,
        vItem.unitPrice,
        vItem.totalAmount
      ]);
    }

    await client.query('COMMIT');
    return getChallanById(id, organizationId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Atomically confirms a Sales Challan.
 * - Locks challan and verifies status is DRAFT.
 * - Locks all product rows in deterministic order.
 * - Validates stock for ALL items before deducting anything.
 * - If ANY item has insufficient stock, rolls back entire transaction.
 * - Otherwise, deducts each product stock exactly once and logs exactly one OUT stock movement.
 * - Marks challan CONFIRMED.
 */
export async function confirmChallan(
  id: string,
  { organizationId, userId }: ChallanActionParams
): Promise<Challan | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock challan row
    const chRes = await client.query(
      `SELECT * FROM challans WHERE id = $1 AND (organization_id = $2 OR $2 IS NULL OR organization_id IS NULL) FOR UPDATE`,
      [id, organizationId || null]
    );
    if (chRes.rows.length === 0) {
      const err = new Error('Sales Challan not found') as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    const challan = chRes.rows[0];
    const currentStatus = (challan.status || '').toUpperCase();

    if (currentStatus === 'CONFIRMED') {
      const err = new Error('Sales Challan is already CONFIRMED. Cannot confirm again.') as Error & { statusCode?: number };
      err.statusCode = 409;
      throw err;
    }
    if (currentStatus === 'CANCELLED') {
      const err = new Error('Cannot confirm a CANCELLED Sales Challan.') as Error & { statusCode?: number };
      err.statusCode = 409;
      throw err;
    }
    if (currentStatus !== 'DRAFT') {
      const err = new Error(`Cannot confirm challan with status '${currentStatus}'.`) as Error & { statusCode?: number };
      err.statusCode = 409;
      throw err;
    }

    // 2. Fetch all items
    const itemsRes = await client.query(
      `SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id ASC`,
      [id]
    );
    if (itemsRes.rows.length === 0) {
      const err = new Error('Sales Challan contains no items to confirm') as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    const items = itemsRes.rows;

    // 3. Deterministically sort product IDs to prevent deadlocks
    const uniqueProductIds = [...new Set(items.map(it => it.product_id))].sort();

    // 4. Lock all required products in deterministic order
    const prodsRes = await client.query(
      `SELECT * FROM products WHERE id = ANY($1) FOR UPDATE`,
      [uniqueProductIds]
    );
    const prodMap = new Map<string, any>();
    for (const p of prodsRes.rows) {
      prodMap.set(p.id, p);
    }

    // 5. Atomic Stock Validation: Check EVERY item
    const insufficientErrors: string[] = [];
    for (const it of items) {
      const prod = prodMap.get(it.product_id);
      if (!prod) {
        insufficientErrors.push(`Product '${it.product_name_snapshot}' (${it.sku_snapshot}) no longer exists in catalogue`);
        continue;
      }
      const availableStock = Number(prod.current_stock) || 0;
      if (availableStock < it.quantity) {
        insufficientErrors.push(
          `Insufficient stock for '${it.product_name_snapshot}' (${it.sku_snapshot}). Available: ${availableStock}, Requested: ${it.quantity}`
        );
      }
    }

    // If ANY item fails stock check, abort and rollback entire transaction
    if (insufficientErrors.length > 0) {
      const err = new Error(`Challan confirmation failed: ${insufficientErrors.join('; ')}`) as Error & {
        statusCode?: number;
        insufficientItems?: string[];
      };
      err.statusCode = 409;
      err.insufficientItems = insufficientErrors;
      throw err;
    }

    // 6. Deduct stock and log OUT movements (Exactly ONE deduction & movement per item)
    for (const it of items) {
      const prod = prodMap.get(it.product_id);
      const newStock = Number(prod.current_stock) - it.quantity;

      // Update product current stock
      await client.query(
        `UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newStock, prod.id]
      );
      prod.current_stock = newStock; // update in memory

      // Create OUT stock movement audit record
      const movementId = 'SM_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      await client.query(`
        INSERT INTO stock_movements (
          id, product_id, quantity_changed, movement_type, reason, reference_id, created_by, organization_id, created_at
        ) VALUES ($1, $2, $3, 'OUT', 'Sales Challan', $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        movementId,
        prod.id,
        it.quantity,
        challan.challan_number,
        userId || null,
        organizationId || challan.organization_id || null
      ]);
    }

    // 7. Update Challan status to CONFIRMED
    await client.query(`
      UPDATE challans
      SET status = 'CONFIRMED', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');
    return getChallanById(id, organizationId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Cancels a DRAFT Sales Challan.
 * If status is CONFIRMED, rejects with 409 Conflict.
 */
export async function cancelChallan(
  id: string,
  { organizationId }: ChallanActionParams
): Promise<Challan | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock challan row
    const chRes = await client.query(
      `SELECT * FROM challans WHERE id = $1 AND (organization_id = $2 OR $2 IS NULL OR organization_id IS NULL) FOR UPDATE`,
      [id, organizationId || null]
    );
    if (chRes.rows.length === 0) {
      const err = new Error('Sales Challan not found') as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    const challan = chRes.rows[0];
    const currentStatus = (challan.status || '').toUpperCase();

    if (currentStatus === 'CONFIRMED') {
      const err = new Error('Confirmed challans cannot be cancelled directly.') as Error & { statusCode?: number };
      err.statusCode = 409;
      throw err;
    }
    if (currentStatus === 'CANCELLED') {
      await client.query('COMMIT');
      return getChallanById(id, organizationId);
    }
    if (currentStatus !== 'DRAFT') {
      const err = new Error(`Cannot cancel challan with status '${currentStatus}'.`) as Error & { statusCode?: number };
      err.statusCode = 409;
      throw err;
    }

    // Update status to CANCELLED. No stock change, no stock movement.
    await client.query(`
      UPDATE challans
      SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');
    return getChallanById(id, organizationId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default {
  createChallan,
  getAllChallans,
  getChallanById,
  updateDraftChallan,
  confirmChallan,
  cancelChallan
};
