const { query } = require('../db/index');
const { mapCategory } = require('../db/mapper');

exports.getAll = async (search) => {
  let sql = 'SELECT * FROM categories';
  const params = [];
  if (search && search.trim()) {
    sql += ' WHERE category_id ILIKE $1 OR category_name ILIKE $1';
    params.push(`%${search.trim()}%`);
  }
  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return res.rows.map(mapCategory);
};

exports.searchAndFilter = async ({ search, status, sortBy = 'createdAt', sortOrder = -1 }) => {
  const conditions = [];
  const params = [];
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

  const sortColMap = {
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
  return res.rows.map(mapCategory);
};

exports.generateNextCategoryId = async () => {
  const res = await query("SELECT category_id FROM categories WHERE category_id ~ '^CAT[0-9]+' ORDER BY category_id DESC LIMIT 1");
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

exports.getById = async (id) => {
  const res = await query('SELECT * FROM categories WHERE id = $1 OR category_id = $1 LIMIT 1', [id]);
  return mapCategory(res.rows[0]);
};

exports.create = async (data) => {
  const categoryId = data.categoryId || await exports.generateNextCategoryId();
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

exports.update = async (id, data) => {
  const current = await exports.getById(id);
  if (!current) return null;

  const categoryName = data.categoryName !== undefined ? data.categoryName : current.categoryName;
  const description = (data.categoryDescription !== undefined || data.description !== undefined)
    ? (data.categoryDescription || data.description || '')
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

exports.delete = async (id) => {
  const res = await query('DELETE FROM categories WHERE id = $1 OR category_id = $1 RETURNING *', [id]);
  return mapCategory(res.rows[0]);
};
