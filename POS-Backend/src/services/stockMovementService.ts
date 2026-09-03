/**
 * Stock Movement Service (Audit Ledger & Inventory Transactions)
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Handles atomic inventory movements (IN / OUT), row-level product locking (FOR UPDATE),
 * and immutable audit trail ledgering.
 */

import { pool, query } from '../db/index';
import { mapStockMovement, StockMovement } from '../db/mapper';

export interface CreateMovementData {
  productId: string;
  quantity: number;
  movementType: 'IN' | 'OUT' | string;
  reason: string;
  referenceId?: string | null;
  createdBy?: string | null;
  organizationId?: string | null;
}

export interface CreateMovementResult {
  movement: StockMovement | null;
  currentStock: number;
}

export interface StockMovementFilterParams {
  page?: number | string;
  limit?: number | string;
  productId?: string;
  movementType?: string;
  reason?: string;
  search?: string;
  organizationId?: string | null;
}

export interface PaginatedStockMovements {
  data: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Validate stock movement inputs
 */
function validateMovementInput({ productId, quantity, movementType, reason }: {
  productId?: string;
  quantity?: number;
  movementType?: string;
  reason?: string;
}): void {
  if (!productId || typeof productId !== 'string' || !productId.trim()) {
    const err = new Error('Product ID is required') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  if (quantity === undefined || quantity === null || typeof quantity !== 'number' || isNaN(quantity)) {
    const err = new Error('Quantity must be a valid number') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  if (!Number.isInteger(quantity)) {
    const err = new Error('Quantity must be an integer') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  if (quantity <= 0) {
    const err = new Error('Quantity must be greater than 0') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  if (!movementType || !['IN', 'OUT'].includes(movementType)) {
    const err = new Error("Movement type must be exactly 'IN' or 'OUT'") as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    const err = new Error('Reason is required and cannot be empty') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
}

/**
 * Create a new stock movement with atomic transaction and row-level locking
 */
export const createMovement = async ({
  productId,
  quantity,
  movementType,
  reason,
  referenceId,
  createdBy,
  organizationId
}: CreateMovementData): Promise<CreateMovementResult> => {
  validateMovementInput({ productId, quantity, movementType, reason });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock product row FOR UPDATE to protect against concurrent race conditions
    const prodRes = await client.query(`
      SELECT * FROM products 
      WHERE (id = $1 OR item_id = $1 OR sku = $1)
      FOR UPDATE
    `, [productId.trim()]);

    if (prodRes.rows.length === 0) {
      const err = new Error(`Product not found with identifier: ${productId}`) as Error & { status?: number };
      err.status = 404;
      throw err;
    }

    const product = prodRes.rows[0];

    // Verify organization access if applicable
    if (organizationId && product.organization_id) {
      const isAllowedOrg =
        product.organization_id === organizationId ||
        ['ORG001', 'ORG002', 'ORG003'].includes(product.organization_id);
      if (!isAllowedOrg) {
        const err = new Error('Unauthorized to modify stock for product from another organization') as Error & { status?: number };
        err.status = 403;
        throw err;
      }
    }

    const currentStock = Number(product.current_stock) || 0;
    let newStock: number;

    // 2. Calculate and validate new stock
    if (movementType === 'IN') {
      newStock = currentStock + quantity;
    } else if (movementType === 'OUT') {
      if (currentStock < quantity) {
        const err = new Error(
          `Insufficient stock for ${product.product_name}. Available: ${currentStock}, Requested: ${quantity}`
        ) as Error & { status?: number };
        err.status = 400;
        throw err;
      }
      newStock = currentStock - quantity;
    } else {
      const err = new Error("Movement type must be exactly 'IN' or 'OUT'") as Error & { status?: number };
      err.status = 400;
      throw err;
    }

    // 3. Update products.current_stock
    await client.query(`
      UPDATE products 
      SET current_stock = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [newStock, product.id]);

    // 4. Insert audit record into stock_movements
    const smId = `SM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const orgId = organizationId || product.organization_id || null;

    const smRes = await client.query(`
      INSERT INTO stock_movements (
        id, product_id, quantity_changed, movement_type, reason,
        reference_id, created_by, organization_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      smId,
      product.id,
      quantity,
      movementType,
      reason.trim(),
      referenceId || null,
      createdBy || null,
      orgId
    ]);

    await client.query('COMMIT');

    const smRow = smRes.rows[0];
    smRow.product_name = product.product_name;
    smRow.sku = product.sku;
    smRow.current_stock = newStock;

    return {
      movement: mapStockMovement(smRow),
      currentStock: newStock
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Retrieve stock movements with filtering, search, and pagination
 */
export const getAll = async (
  options: StockMovementFilterParams = {}
): Promise<StockMovement[] | PaginatedStockMovements> => {
  const {
    page,
    limit,
    productId,
    movementType,
    reason,
    search,
    organizationId
  } = options;

  let sql = `
    SELECT sm.*,
           p.product_name,
           p.sku,
           p.current_stock,
           u.name AS created_by_name,
           u.email AS created_by_email
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.created_by = u.id
  `;

  const params: unknown[] = [];
  const conditions: string[] = [];
  let pIdx = 1;

  if (organizationId) {
    conditions.push(`(sm.organization_id = $${pIdx} OR sm.organization_id IS NULL OR sm.organization_id IN ('ORG001', 'ORG002', 'ORG003'))`);
    params.push(organizationId);
    pIdx++;
  }

  if (productId) {
    conditions.push(`(sm.product_id = $${pIdx} OR p.sku = $${pIdx} OR p.item_id = $${pIdx})`);
    params.push(productId);
    pIdx++;
  }

  if (movementType && movementType !== 'All') {
    conditions.push(`sm.movement_type = $${pIdx}`);
    params.push(movementType);
    pIdx++;
  }

  if (reason && reason.trim()) {
    conditions.push(`sm.reason ILIKE $${pIdx}`);
    params.push(`%${reason.trim()}%`);
    pIdx++;
  }

  if (search && search.trim()) {
    conditions.push(`(p.product_name ILIKE $${pIdx} OR p.sku ILIKE $${pIdx} OR sm.reason ILIKE $${pIdx} OR sm.reference_id ILIKE $${pIdx})`);
    params.push(`%${search.trim()}%`);
    pIdx++;
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
  sql += whereClause + ' ORDER BY sm.created_at DESC';

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const pagedSql = sql + ` LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    const res = await query(pagedSql, [...params, limitNum, offset]);

    return {
      data: res.rows.map(mapStockMovement).filter(Boolean) as StockMovement[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  }

  const res = await query(sql, params);
  return res.rows.map(mapStockMovement).filter(Boolean) as StockMovement[];
};

/**
 * Get a single stock movement by ID
 */
export const getById = async (id: string, organizationId?: string | null): Promise<StockMovement | null> => {
  let sql = `
    SELECT sm.*,
           p.product_name,
           p.sku,
           p.current_stock,
           u.name AS created_by_name,
           u.email AS created_by_email
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.created_by = u.id
    WHERE sm.id = $1
  `;
  const params: unknown[] = [id];
  if (organizationId) {
    sql += ` AND (sm.organization_id = $2 OR sm.organization_id IS NULL OR sm.organization_id IN ('ORG001', 'ORG002', 'ORG003'))`;
    params.push(organizationId);
  }
  sql += ' LIMIT 1';

  const res = await query(sql, params);
  return mapStockMovement(res.rows[0]);
};

export default {
  createMovement,
  getAll,
  getById
};
