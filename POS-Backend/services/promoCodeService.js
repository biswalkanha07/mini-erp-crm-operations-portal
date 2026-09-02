const { query } = require('../db/index');
const { mapPromoCode } = require('../db/mapper');

exports.getAll = async (organizationId) => {
  let sql = 'SELECT * FROM promo_codes';
  const params = [];
  if (organizationId) {
    sql += ' WHERE organization_id = $1';
    params.push(organizationId);
  }
  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return res.rows.map(mapPromoCode);
};

exports.getById = async (id) => {
  const res = await query('SELECT * FROM promo_codes WHERE id = $1 OR code = $1 LIMIT 1', [id]);
  return mapPromoCode(res.rows[0]);
};

exports.create = async (data) => {
  const id = data._id || `PROMO_${Date.now()}`;
  const res = await query(`
    INSERT INTO promo_codes (
      id, code, description, discount_type, discount_value,
      expiry_date, usage_limit, used_count, is_active, organization_id,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `, [
    id,
    data.code,
    data.description || '',
    data.discountType || 'percentage',
    Number(data.discountValue) || 0,
    data.expiryDate ? new Date(data.expiryDate) : null,
    data.usageLimit !== undefined ? Number(data.usageLimit) : null,
    Number(data.usedCount) || 0,
    data.isActive !== false,
    data.organization || data.organizationId || null
  ]);

  return mapPromoCode(res.rows[0]);
};

exports.update = async (id, data) => {
  const current = await exports.getById(id);
  if (!current) return null;

  const code = data.code !== undefined ? data.code : current.code;
  const description = data.description !== undefined ? data.description : current.description;
  const discountType = data.discountType !== undefined ? data.discountType : current.discountType;
  const discountValue = data.discountValue !== undefined ? Number(data.discountValue) : current.discountValue;
  const expiryDate = data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : current.expiryDate;
  const usageLimit = data.usageLimit !== undefined ? (data.usageLimit !== null ? Number(data.usageLimit) : null) : current.usageLimit;
  const usedCount = data.usedCount !== undefined ? Number(data.usedCount) : current.usedCount;
  const isActive = data.isActive !== undefined ? Boolean(data.isActive) : current.isActive;
  const organizationId = data.organization !== undefined ? data.organization : (data.organizationId !== undefined ? data.organizationId : current.organization);

  const res = await query(`
    UPDATE promo_codes
    SET code = $1,
        description = $2,
        discount_type = $3,
        discount_value = $4,
        expiry_date = $5,
        usage_limit = $6,
        used_count = $7,
        is_active = $8,
        organization_id = $9,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $10 OR code = $10
    RETURNING *
  `, [
    code,
    description,
    discountType,
    discountValue,
    expiryDate,
    usageLimit,
    usedCount,
    isActive,
    organizationId,
    id
  ]);

  return mapPromoCode(res.rows[0]);
};

exports.delete = async (id) => {
  const res = await query('DELETE FROM promo_codes WHERE id = $1 OR code = $1 RETURNING *', [id]);
  return mapPromoCode(res.rows[0]);
};

exports.applyPromoCode = async ({ code, organization, orderTotal }) => {
  let sql = "SELECT * FROM promo_codes WHERE code = $1 AND is_active = true";
  const params = [code];
  if (organization) {
    sql += " AND (organization_id = $2 OR organization_id IS NULL)";
    params.push(organization);
  }
  sql += " LIMIT 1";

  const res = await query(sql, params);
  const promo = mapPromoCode(res.rows[0]);
  if (!promo) {
    const err = new Error('Invalid or expired promo code');
    err.httpStatus = 404;
    throw err;
  }

  if (promo.expiryDate && new Date() > new Date(promo.expiryDate)) {
    const err = new Error('Promo code expired');
    err.httpStatus = 400;
    throw err;
  }

  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    const err = new Error('Promo code usage limit reached');
    err.httpStatus = 400;
    throw err;
  }

  const total = Number(orderTotal) || 0;
  let discountAmount = 0;
  if (promo.discountType === 'percentage') {
    discountAmount = total * (promo.discountValue / 100);
  } else if (promo.discountType === 'fixed') {
    discountAmount = promo.discountValue;
  }
  if (discountAmount > total) discountAmount = total;

  return { discountAmount, promo };
};
