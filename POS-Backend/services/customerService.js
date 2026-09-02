const { query, pool } = require('../db/index');
const { mapCustomer, mapCustomerFollowup } = require('../db/mapper');

/**
 * Validate customer fields
 */
function validateCustomerPayload(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Customer name is required and cannot be empty');
    }
  }

  const mobile = data.mobile || data.phone;
  if (!isUpdate || (data.mobile !== undefined || data.phone !== undefined)) {
    if (!mobile || typeof mobile !== 'string' || !mobile.trim()) {
      errors.push('Customer mobile/phone number is required');
    }
  }

  const type = data.type || data.customerType;
  if (type !== undefined) {
    const validTypes = ['Retail', 'Wholesale', 'Distributor'];
    if (!validTypes.includes(type)) {
      errors.push(`Customer type must be one of: ${validTypes.join(', ')}`);
    }
  }

  const status = data.status;
  if (status !== undefined) {
    const validStatuses = ['Lead', 'Active', 'Inactive'];
    if (!validStatuses.includes(status)) {
      errors.push(`Customer status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (data.followUpDate) {
    const d = new Date(data.followUpDate);
    if (isNaN(d.getTime())) {
      errors.push('Invalid followUpDate format');
    }
  }

  return errors;
}

exports.listCustomers = async ({
  page = 1,
  limit = 10,
  search,
  status,
  type,
  followUpDate,
  organizationId
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  // Organization isolation
  if (organizationId) {
    conditions.push(`(organization_id = $${paramIdx} OR organization_id IS NULL)`);
    params.push(organizationId);
    paramIdx++;
  }

  // Search filter across name, mobile, phone, email, business name
  if (search && search.trim()) {
    conditions.push(`(
      name ILIKE $${paramIdx} OR
      mobile ILIKE $${paramIdx} OR
      phone ILIKE $${paramIdx} OR
      email ILIKE $${paramIdx} OR
      business_name ILIKE $${paramIdx}
    )`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  // Status filter
  if (status && status !== 'All') {
    conditions.push(`status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }

  // Type filter
  if (type && type !== 'All') {
    conditions.push(`customer_type = $${paramIdx}`);
    params.push(type);
    paramIdx++;
  }

  // Follow-up date filter
  if (followUpDate) {
    conditions.push(`follow_up_date = $${paramIdx}`);
    params.push(followUpDate);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) AS total FROM customers ${whereClause}`;
  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0].total, 10) || 0;
  const totalPages = Math.ceil(total / limitNum) || 1;

  // Get paginated rows
  const dataParams = [...params, limitNum, offset];
  const dataSql = `
    SELECT * FROM customers 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const dataRes = await query(dataSql, dataParams);

  return {
    customers: dataRes.rows.map(mapCustomer),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  };
};

exports.getCustomerById = async (id, organizationId) => {
  const sql = `SELECT * FROM customers WHERE id = $1 LIMIT 1`;
  const res = await query(sql, [id]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  if (organizationId && row.organization_id && row.organization_id !== organizationId) {
    const err = new Error('Unauthorized: Customer does not belong to this organization');
    err.status = 403;
    throw err;
  }

  return mapCustomer(row);
};

exports.createCustomer = async (data, userId, organizationId) => {
  const validationErrors = validateCustomerPayload(data, false);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join('; '));
    err.status = 400;
    throw err;
  }

  const id = `CUST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const name = data.name.trim();
  const mobile = (data.mobile || data.phone).trim();
  const phone = mobile;
  const email = data.email ? data.email.trim().toLowerCase() : null;
  const businessName = data.businessName ? data.businessName.trim() : (data.business_name ? data.business_name.trim() : null);
  const gstNumber = data.gstNumber ? data.gstNumber.trim() : (data.gst_number ? data.gst_number.trim() : null);
  const customerType = data.type || data.customerType || 'Retail';
  const address = data.address ? data.address.trim() : null;
  const status = data.status || 'Active';
  const followUpDate = data.followUpDate || null;
  const notes = data.notes ? data.notes.trim() : null;
  const orgId = organizationId || data.organizationId || null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertSql = `
      INSERT INTO customers (
        id, name, mobile, phone, email, business_name, gst_number,
        customer_type, address, status, follow_up_date, notes,
        organization_id, loyalty_points, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const res = await client.query(insertSql, [
      id, name, mobile, phone, email, businessName, gstNumber,
      customerType, address, status, followUpDate, notes, orgId
    ]);

    // If follow-up date and notes are supplied, create initial follow-up record
    if (followUpDate && notes) {
      const folId = `FOL_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await client.query(`
        INSERT INTO customer_followups (
          id, customer_id, note, notes, follow_up_date, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [folId, id, notes, notes, followUpDate, userId || null]);
    }

    await client.query('COMMIT');
    return mapCustomer(res.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.updateCustomer = async (id, data, organizationId) => {
  const existing = await exports.getCustomerById(id, organizationId);
  if (!existing) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  const validationErrors = validateCustomerPayload(data, true);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join('; '));
    err.status = 400;
    throw err;
  }

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const mobile = (data.mobile || data.phone) !== undefined ? (data.mobile || data.phone).trim() : existing.mobile;
  const phone = mobile;
  const email = data.email !== undefined ? (data.email ? data.email.trim().toLowerCase() : null) : existing.email;
  const businessName = data.businessName !== undefined ? (data.businessName ? data.businessName.trim() : null) : existing.businessName;
  const gstNumber = data.gstNumber !== undefined ? (data.gstNumber ? data.gstNumber.trim() : null) : existing.gstNumber;
  const customerType = (data.type || data.customerType) !== undefined ? (data.type || data.customerType) : existing.customerType;
  const address = data.address !== undefined ? (data.address ? data.address.trim() : null) : existing.address;
  const status = data.status !== undefined ? data.status : existing.status;
  const followUpDate = data.followUpDate !== undefined ? (data.followUpDate || null) : existing.followUpDate;
  const notes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes;

  const updateSql = `
    UPDATE customers SET
      name = $1,
      mobile = $2,
      phone = $3,
      email = $4,
      business_name = $5,
      gst_number = $6,
      customer_type = $7,
      address = $8,
      status = $9,
      follow_up_date = $10,
      notes = $11,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $12
    RETURNING *
  `;

  const res = await query(updateSql, [
    name, mobile, phone, email, businessName, gstNumber,
    customerType, address, status, followUpDate, notes, id
  ]);

  return mapCustomer(res.rows[0]);
};

exports.deleteOrDeactivateCustomer = async (id, organizationId) => {
  const existing = await exports.getCustomerById(id, organizationId);
  if (!existing) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  // Soft deactivation to preserve historical business and sales data
  const sql = `
    UPDATE customers SET
      status = 'Inactive',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const res = await query(sql, [id]);
  return mapCustomer(res.rows[0]);
};

exports.listFollowups = async (customerId, organizationId) => {
  // Validate customer exists and isolation
  const customer = await exports.getCustomerById(customerId, organizationId);
  if (!customer) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  const sql = `
    SELECT f.*, u.name AS user_name, u.email AS user_email
    FROM customer_followups f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.customer_id = $1
    ORDER BY f.created_at DESC
  `;
  const res = await query(sql, [customerId]);
  return res.rows.map(mapCustomerFollowup);
};

exports.addFollowup = async (customerId, data, userId, organizationId) => {
  const customer = await exports.getCustomerById(customerId, organizationId);
  if (!customer) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  const followUpDate = data.followUpDate || data.follow_up_date;
  if (!followUpDate) {
    const err = new Error('followUpDate is required');
    err.status = 400;
    throw err;
  }

  const noteText = data.notes || data.note;
  if (!noteText || typeof noteText !== 'string' || !noteText.trim()) {
    const err = new Error('Follow-up notes are required and cannot be empty');
    err.status = 400;
    throw err;
  }

  const id = `FOL_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert follow-up (append-only)
    const insertSql = `
      INSERT INTO customer_followups (
        id, customer_id, note, notes, follow_up_date, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await client.query(insertSql, [
      id, customerId, noteText.trim(), noteText.trim(), followUpDate, userId || null
    ]);

    // 2. Update customer latest follow_up_date
    await client.query(`
      UPDATE customers 
      SET follow_up_date = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [followUpDate, customerId]);

    await client.query('COMMIT');

    const createdFollowup = res.rows[0];
    return mapCustomerFollowup({
      ...createdFollowup,
      created_by_name: data.createdByName || null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
