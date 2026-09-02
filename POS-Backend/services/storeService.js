const { pool, query } = require('../db/index');
const { mapStore, mapStorePrice, mapProduct, mapUser } = require('../db/mapper');
const crypto = require('crypto');
const { generateNextStoreId } = require('../utils/storeIdGenerator');
const { sendStoreSignupEmail } = require('../utils/emailService');

exports.getAll = async (filter = {}) => {
  let sql = 'SELECT * FROM stores';
  const params = [];
  if (filter.organizationId) {
    sql += ' WHERE organization_id = $1';
    params.push(filter.organizationId);
  }
  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return res.rows.map(mapStore);
};

exports.getById = async (id) => {
  const res = await query(
    'SELECT * FROM stores WHERE id = $1 OR store_id = $1 LIMIT 1',
    [id]
  );
  return mapStore(res.rows[0]);
};

exports.searchAndFilter = async ({ search, status, organizationId, theme, fromDate, toDate }) => {
  let conditions = [];
  let params = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(
      store_name ILIKE $${paramIdx} OR
      store_id ILIKE $${paramIdx} OR
      store_location ILIKE $${paramIdx} OR
      address->>'addressLine1' ILIKE $${paramIdx} OR
      address->>'city' ILIKE $${paramIdx} OR
      contact_person_name ILIKE $${paramIdx} OR
      contact_number ILIKE $${paramIdx} OR
      email ILIKE $${paramIdx}
    )`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (status) {
    conditions.push(`status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }

  if (organizationId) {
    conditions.push(`organization_id = $${paramIdx}`);
    params.push(organizationId);
    paramIdx++;
  }

  if (theme) {
    conditions.push(`theme = $${paramIdx}`);
    params.push(theme);
    paramIdx++;
  }

  if (fromDate) {
    conditions.push(`created_at >= $${paramIdx}`);
    params.push(new Date(fromDate));
    paramIdx++;
  }

  if (toDate) {
    conditions.push(`created_at <= $${paramIdx}`);
    params.push(new Date(toDate));
    paramIdx++;
  }

  let sql = 'SELECT * FROM stores';
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY created_at DESC';

  const res = await query(sql, params);
  return res.rows.map(mapStore);
};

exports.createStore = async (storeData) => {
  const email = (storeData.email || '').trim().toLowerCase();
  if (!email) {
    const err = new Error('Email is required');
    err.httpStatus = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check existing user by email
    const userRes = await client.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    const existingUser = userRes.rows[0];
    if (existingUser && existingUser.status === 'active') {
      const err = new Error('Email already exists');
      err.httpStatus = 409;
      throw err;
    }

    const storeId = storeData.storeId || await generateNextStoreId();
    const id = storeId;
    const address = storeData.address || (storeData.storeAddress ? { fullAddress: storeData.storeAddress } : {});

    // Insert store
    const storeInsertRes = await client.query(`
      INSERT INTO stores (
        id, store_id, store_name, store_location, address,
        contact_person_name, contact_number, email, store_picture,
        status, organization_id, discount_rate, profit_margin_percent,
        theme, gst_rate, bank_details, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      id,
      storeId,
      storeData.storeName || '',
      storeData.storeLocation || '',
      JSON.stringify(address),
      storeData.contactPersonName || '',
      storeData.contactNumber || '',
      email,
      storeData.storePicture || '',
      storeData.status || 'active',
      storeData.organizationId || null,
      Number(storeData.discountRate) || 0,
      Number(storeData.profitMarginPercent) || 0,
      storeData.theme || 'light',
      Number(storeData.gstRate) || 0,
      JSON.stringify(storeData.bankDetails || {})
    ]);

    const createdStore = storeInsertRes.rows[0];
    const signupToken = crypto.randomBytes(32).toString('hex');
    const signupTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    let createdUser;

    if (existingUser) {
      // Update pending user
      const userUpdateRes = await client.query(`
        UPDATE users
        SET name = COALESCE($1, name),
            user_type = 'store',
            role = COALESCE(role, 'manager'),
            store_id = $2,
            organization_id = COALESCE($3, organization_id),
            signup_token = $4,
            signup_token_expires = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `, [
        storeData.contactPersonName,
        storeId,
        storeData.organizationId,
        signupToken,
        signupTokenExpires,
        existingUser.id
      ]);
      createdUser = userUpdateRes.rows[0];
    } else {
      const userId = `USER_${storeId}_${Date.now()}`;
      const userPermissions = [
        { module: 'store', actions: ['read', 'write', 'manage'] },
        { module: 'inventory', actions: ['read', 'write', 'manage'] },
        { module: 'pos', actions: ['read', 'write', 'manage'] },
        { module: 'reports', actions: ['read'] }
      ];
      const userInsertRes = await client.query(`
        INSERT INTO users (
          id, user_id, name, email, password, user_type, role,
          store_id, organization_id, status, permissions,
          signup_token, signup_token_expires, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        userId,
        userId,
        storeData.contactPersonName || '',
        email,
        'TEMP_PASSWORD_PENDING_SETUP',
        'store',
        'manager',
        storeId,
        storeData.organizationId || null,
        'pending',
        JSON.stringify(userPermissions),
        signupToken,
        signupTokenExpires
      ]);
      createdUser = userInsertRes.rows[0];
    }

    await client.query('COMMIT');

    const frontendUrl = process.env.FRONTEND_URL || 'https://pos.hutechsolutions.in/';
    const signupLink = `${frontendUrl}/signup?storeId=${storeId}&token=${signupToken}`;
    const emailResult = await sendStoreSignupEmail(
      email,
      storeId,
      storeData.storeName,
      storeData.contactPersonName,
      signupLink
    );

    return {
      success: true,
      store: mapStore(createdStore),
      user: mapUser(createdUser),
      signupLink,
      emailSent: !!emailResult.success
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

exports.update = async (id, data) => {
  const current = await exports.getById(id);
  if (!current) return null;

  const storeName = data.storeName !== undefined ? data.storeName : current.storeName;
  const storeLocation = data.storeLocation !== undefined ? data.storeLocation : current.storeLocation;
  const address = data.address !== undefined ? data.address : (data.storeAddress ? { fullAddress: data.storeAddress } : current.address);
  const contactPersonName = data.contactPersonName !== undefined ? data.contactPersonName : current.contactPersonName;
  const contactNumber = data.contactNumber !== undefined ? data.contactNumber : current.contactNumber;
  const email = data.email !== undefined ? data.email : current.email;
  const storePicture = data.storePicture !== undefined ? data.storePicture : current.storePicture;
  const status = data.status !== undefined ? data.status : current.status;
  const discountRate = data.discountRate !== undefined ? Number(data.discountRate) : current.discountRate;
  const profitMarginPercent = data.profitMarginPercent !== undefined ? Number(data.profitMarginPercent) : current.profitMarginPercent;
  const theme = data.theme !== undefined ? data.theme : current.theme;
  const gstRate = data.gstRate !== undefined ? Number(data.gstRate) : current.gstRate;
  const bankDetails = data.bankDetails !== undefined ? data.bankDetails : current.bankDetails;

  const res = await query(`
    UPDATE stores
    SET store_name = $1,
        store_location = $2,
        address = $3,
        contact_person_name = $4,
        contact_number = $5,
        email = $6,
        store_picture = $7,
        status = $8,
        discount_rate = $9,
        profit_margin_percent = $10,
        theme = $11,
        gst_rate = $12,
        bank_details = $13,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $14 OR store_id = $14
    RETURNING *
  `, [
    storeName,
    storeLocation,
    JSON.stringify(address || {}),
    contactPersonName,
    contactNumber,
    email,
    storePicture,
    status,
    discountRate,
    profitMarginPercent,
    theme,
    gstRate,
    JSON.stringify(bankDetails || {}),
    id
  ]);

  return mapStore(res.rows[0]);
};

exports.delete = async (id) => {
  const res = await query('DELETE FROM stores WHERE id = $1 OR store_id = $1 RETURNING *', [id]);
  return mapStore(res.rows[0]);
};

// Store Prices
exports.listStorePrices = async (storeId, sku) => {
  let sql = 'SELECT * FROM store_prices WHERE store_id = $1';
  const params = [storeId];
  if (sku) {
    sql += ' AND sku = $2';
    params.push(sku);
  }
  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return res.rows.map(mapStorePrice);
};

exports.upsertStorePrice = async (storeId, sku, data) => {
  const current = await query(
    'SELECT * FROM store_prices WHERE store_id = $1 AND sku = $2 LIMIT 1',
    [storeId, sku]
  );
  const id = current.rows[0] ? current.rows[0].id : `SP_${storeId}_${sku}`;
  const basePrice = data.basePrice !== undefined ? Number(data.basePrice) : (current.rows[0] ? current.rows[0].base_price : null);
  const marginType = data.marginType || (current.rows[0] ? current.rows[0].margin_type : 'percent');
  const marginValue = data.marginValue !== undefined ? Number(data.marginValue) : (current.rows[0] ? current.rows[0].margin_value : 0);
  const overridePrice = data.overridePrice !== undefined ? Number(data.overridePrice) : (current.rows[0] ? current.rows[0].override_price : null);
  const status = data.status || (current.rows[0] ? current.rows[0].status : 'active');

  const res = await query(`
    INSERT INTO store_prices (
      id, store_id, sku, base_price, margin_type, margin_value,
      override_price, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (store_id, sku) DO UPDATE
    SET base_price = EXCLUDED.base_price,
        margin_type = EXCLUDED.margin_type,
        margin_value = EXCLUDED.margin_value,
        override_price = EXCLUDED.override_price,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    id,
    storeId,
    sku,
    basePrice,
    marginType,
    marginValue,
    overridePrice,
    status
  ]);

  return mapStorePrice(res.rows[0]);
};

exports.getEffectivePrice = async (storeId, sku) => {
  const prodRes = await query('SELECT * FROM products WHERE sku = $1 LIMIT 1', [sku]);
  const product = mapProduct(prodRes.rows[0]);
  if (!product) return null;

  const spRes = await query(
    "SELECT * FROM store_prices WHERE store_id = $1 AND sku = $2 AND status = 'active' LIMIT 1",
    [storeId, sku]
  );
  const override = mapStorePrice(spRes.rows[0]);
  const store = await exports.getById(storeId);

  const basePrice = Number(product.price) || 0;
  let effective = basePrice;
  let marginType = null;
  let marginValue = null;

  if (override) {
    if (typeof override.overridePrice === 'number' && override.overridePrice !== null) {
      effective = Number(override.overridePrice);
      marginType = 'override';
      marginValue = override.overridePrice;
    } else {
      marginType = override.marginType || 'percent';
      marginValue = Number(override.marginValue) || 0;
      effective = marginType === 'absolute' ? basePrice + marginValue : basePrice + (basePrice * marginValue / 100);
    }
  } else if (store && typeof store.profitMarginPercent === 'number') {
    const storeMargin = Number(store.profitMarginPercent) || 0;
    marginType = 'store_percent';
    marginValue = storeMargin;
    effective = basePrice + (basePrice * storeMargin / 100);
  }

  return {
    storeId,
    sku,
    basePrice,
    effectivePrice: effective,
    marginType,
    marginValue
  };
};
