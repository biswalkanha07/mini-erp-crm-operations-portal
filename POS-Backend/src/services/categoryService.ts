/**
 * Category Service
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Handles category CRUD, sequence generation, and multi-criteria searching.
 */

import { query } from '../db/index';
import { mapCategory, Category } from '../db/mapper';

export interface CategorySearchParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: number | string;
}

export interface CreateCategoryData {
  categoryId?: string;
  categoryName?: string;
  categoryDescription?: string;
  description?: string;
  status?: string;
  organizationId?: string | null;
}

export interface UpdateCategoryData {
  categoryName?: string;
  categoryDescription?: string;
  description?: string;
  status?: string;
  organizationId?: string | null;
}

export const getAll = async (search?: string): Promise<Category[]> => {
  let sql = 'SELECT * FROM categories';
  const params: unknown[] = [];
  if (search && search.trim()) {
    sql += ' WHERE category_id ILIKE $1 OR category_name ILIKE $1';
    params.push(`%${search.trim()}%`);
  }
  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return res.rows.map(mapCategory).filter(Boolean) as Category[];
};

export const searchAndFilter = async ({
  search,
  status,
  sortBy = 'createdAt',
  sortOrder = -1
}: CategorySearchParams): Promise<Category[]> => {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (search && search.trim()) {
    conditions.push(`(category_id ILIKE $${paramIdx} OR category_name ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  if (status) {
    conditions.push(`status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }

  const sortColMap: Record<string, string> = {
    createdAt: 'created_at',
    categoryName: 'category_name',
    categoryId: 'category_id',
    status: 'status'
  };
  const orderCol = sortColMap[sortBy] || 'created_at';
  const orderDir = Number(sortOrder) === 1 ? 'ASC' : 'DESC';

  let sql = 'SELECT * FROM categories';
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ` ORDER BY ${orderCol} ${orderDir}`;

  const res = await query(sql, params);
  return res.rows.map(mapCategory).filter(Boolean) as Category[];
};

export const generateNextCategoryId = async (): Promise<string> => {
  const res = await query<{ category_id: string }>(
    "SELECT category_id FROM categories WHERE category_id ~ '^CAT[0-9]+' ORDER BY category_id DESC LIMIT 1"
  );
  let nextNumber = 1;
  if (res.rows.length > 0) {
    const lastId = res.rows[0].category_id;
    const match = lastId.match(/CAT(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  return `CAT${nextNumber.toString().padStart(3, '0')}`;
};

export const getById = async (id: string): Promise<Category | null> => {
  const res = await query('SELECT * FROM categories WHERE id = $1 OR category_id = $1 LIMIT 1', [id]);
  return mapCategory(res.rows[0]);
};

export const create = async (data: CreateCategoryData): Promise<Category | null> => {
  const categoryId = data.categoryId || (await generateNextCategoryId());
  const id = categoryId;
  const res = await query(`
    INSERT INTO categories (
      id, category_id, category_name, description, status, organization_id,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `, [
    id,
    categoryId,
    data.categoryName || '',
    data.categoryDescription || data.description || '',
    data.status || 'active',
    data.organizationId || null
  ]);
  return mapCategory(res.rows[0]);
};

export const update = async (id: string, data: UpdateCategoryData): Promise<Category | null> => {
  const current = await getById(id);
  if (!current) return null;

  const categoryName = data.categoryName !== undefined ? data.categoryName : current.categoryName;
  const description =
    data.categoryDescription !== undefined || data.description !== undefined
      ? data.categoryDescription || data.description || ''
      : current.categoryDescription;
  const status = data.status !== undefined ? data.status : current.status;
  const organizationId = data.organizationId !== undefined ? data.organizationId : current.organizationId;

  const res = await query(`
    UPDATE categories
    SET category_name = $1,
        description = $2,
        status = $3,
        organization_id = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 OR category_id = $5
    RETURNING *
  `, [
    categoryName,
    description,
    status,
    organizationId,
    id
  ]);

  return mapCategory(res.rows[0]);
};

export const deleteCategory = async (id: string): Promise<Category | null> => {
  const res = await query('DELETE FROM categories WHERE id = $1 OR category_id = $1 RETURNING *', [id]);
  return mapCategory(res.rows[0]);
};

export { deleteCategory as delete };

export default {
  getAll,
  searchAndFilter,
  generateNextCategoryId,
  getById,
  create,
  update,
  delete: deleteCategory,
  deleteCategory
};
