const { query } = require('../db/index');
const { mapProduct } = require('../db/mapper');

/**
 * Validate product inventory fields
 */
function validateProductData(data, isUpdate = false) {
  const name = data.itemName || data.productName;
  if (!isUpdate || (data.itemName !== undefined || data.productName !== undefined)) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      const err = new Error('Product name is required and cannot be empty');
      err.status = 400;
      throw err;
    }
  }

  if (data.price !== undefined || data.unitPrice !== undefined) {
    const p = Number(data.price !== undefined ? data.price : data.unitPrice);
    if (isNaN(p) || p < 0) {
      const err = new Error('Unit price must be a non-negative number');
      err.status = 400;
      throw err;
    }
  }

  if (data.stock !== undefined || data.currentStock !== undefined) {
    const s = Number(data.stock !== undefined ? data.stock : data.currentStock);
    if (isNaN(s) || s < 0) {
      const err = new Error('Current stock cannot be negative');
      err.status = 400;
      throw err;
    }
  }

  if (data.minimumStock !== undefined) {
    const m = Number(data.minimumStock);
    if (isNaN(m) || m < 0) {
      const err = new Error('Minimum stock must be a non-negative number');
      err.status = 400;
      throw err;
    }
  }
}

exports.getAll = async ({
  categoryId,
  search,
  lowStock,
  warehouseLocation,
  status,
  organizationId,
  page,
  limit
} = {}) => {
  let sql = `
    SELECT p.*, c.category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
  `;
  const params = [];
  const conditions = [];
  let pIdx = 1;

  if (organizationId) {
    conditions.push(`(p.organization_id = $${pIdx} OR p.organization_id IS NULL OR p.organization_id IN ('ORG001', 'ORG002', 'ORG003'))`);
    params.push(organizationId);
    pIdx++;
  }

  if (categoryId && categoryId !== 'All') {
    conditions.push(`p.category_id = $${pIdx}`);
    params.push(categoryId);
    pIdx++;
  }

  if (search && search.trim()) {
    conditions.push(`(p.sku ILIKE $${pIdx} OR p.product_name ILIKE $${pIdx} OR p.barcode ILIKE $${pIdx})`);
    params.push(`%${search.trim()}%`);
    pIdx++;
  }

  if (status && status !== 'All') {
    conditions.push(`p.status = $${pIdx}`);
    params.push(status);
    pIdx++;
  }

  if (warehouseLocation && warehouseLocation !== 'All') {
    conditions.push(`p.warehouse_location = $${pIdx}`);
    params.push(warehouseLocation);
    pIdx++;
  }

  if (lowStock === true || lowStock === 'true') {
    conditions.push(`(p.minimum_stock > 0 AND p.current_stock <= p.minimum_stock)`);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
  sql += whereClause + ' ORDER BY p.created_at DESC';

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const countSql = `SELECT COUNT(*) AS total FROM products p ${whereClause}`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const pagedSql = sql + ` LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    const res = await query(pagedSql, [...params, limitNum, offset]);

    return {
      data: res.rows.map(mapProduct),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  }

  const res = await query(sql, params);
  return res.rows.map(mapProduct);
};

exports.searchAndFilter = async ({
  search, status, minPrice, maxPrice, minStock, maxStock,
  categoryId, lowStock, warehouseLocation, organizationId,
  sortBy = 'createdAt', sortOrder = -1
}) => {
  const conditions = [];
  const params = [];
  let pIdx = 1;

  if (organizationId) {
    conditions.push(`(p.organization_id = $${pIdx} OR p.organization_id IS NULL OR p.organization_id IN ('ORG001', 'ORG002', 'ORG003'))`);
    params.push(organizationId);
    pIdx++;
  }

  if (categoryId && categoryId !== 'All') {
    conditions.push(`p.category_id = $${pIdx}`);
    params.push(categoryId);
    pIdx++;
  }

  if (search && search.trim()) {
    conditions.push(`(p.sku ILIKE $${pIdx} OR p.product_name ILIKE $${pIdx} OR p.barcode ILIKE $${pIdx})`);
    params.push(`%${search.trim()}%`);
    pIdx++;
  }

  if (status && status !== 'All') {
    conditions.push(`p.status = $${pIdx}`);
    params.push(status);
    pIdx++;
  }

  if (warehouseLocation && warehouseLocation !== 'All') {
    conditions.push(`p.warehouse_location = $${pIdx}`);
    params.push(warehouseLocation);
    pIdx++;
  }

  if (lowStock === true || lowStock === 'true') {
    conditions.push(`(p.minimum_stock > 0 AND p.current_stock <= p.minimum_stock)`);
  }

  if (minPrice !== undefined && minPrice !== '') {
    conditions.push(`p.unit_price >= $${pIdx}`);
    params.push(Number(minPrice));
    pIdx++;
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    conditions.push(`p.unit_price <= $${pIdx}`);
    params.push(Number(maxPrice));
    pIdx++;
  }

  if (minStock !== undefined && minStock !== '') {
    conditions.push(`p.current_stock >= $${pIdx}`);
    params.push(Number(minStock));
    pIdx++;
  }

  if (maxStock !== undefined && maxStock !== '') {
    conditions.push(`p.current_stock <= $${pIdx}`);
    params.push(Number(maxStock));
    pIdx++;
  }

  const sortColMap = {
    createdAt: 'p.created_at',
    itemName: 'p.product_name',
    productName: 'p.product_name',
    sku: 'p.sku',
    status: 'p.status',
    price: 'p.unit_price',
    unitPrice: 'p.unit_price',
    stock: 'p.current_stock',
    currentStock: 'p.current_stock',
    minimumStock: 'p.minimum_stock',
    warehouseLocation: 'p.warehouse_location',
    volumeOfMeasurement: 'p.volume_of_measurement'
  };
  const orderCol = sortColMap[sortBy] || 'p.created_at';
  const orderDir = Number(sortOrder) === 1 ? 'ASC' : 'DESC';

  let sql = `
    SELECT p.*, c.category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
  `;
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ` ORDER BY ${orderCol} ${orderDir}`;

  const res = await query(sql, params);
  return res.rows.map(mapProduct);
};

exports.getById = async (id, organizationId) => {
  let sql = `
    SELECT p.*, c.category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE (p.id = $1 OR p.item_id = $1 OR p.sku = $1)
  `;
  const params = [id];
  if (organizationId) {
    sql += ` AND (p.organization_id = $2 OR p.organization_id IS NULL OR p.organization_id IN ('ORG001', 'ORG002', 'ORG003'))`;
    params.push(organizationId);
  }
  sql += ' LIMIT 1';

  const res = await query(sql, params);
  return mapProduct(res.rows[0]);
};

exports.getBySku = async (sku, organizationId) => {
  let sql = `
    SELECT p.*, c.category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.sku = $1
  `;
  const params = [sku];
  if (organizationId) {
    sql += ` AND (p.organization_id = $2 OR p.organization_id IS NULL OR p.organization_id IN ('ORG001', 'ORG002', 'ORG003'))`;
    params.push(organizationId);
  }
  sql += ' LIMIT 1';

  const res = await query(sql, params);
  return mapProduct(res.rows[0]);
};

exports.getByBarcode = async (barcode, organizationId) => {
  let sql = `
    SELECT p.*, c.category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.barcode = $1
  `;
  const params = [barcode];
  if (organizationId) {
    sql += ` AND (p.organization_id = $2 OR p.organization_id IS NULL OR p.organization_id IN ('ORG001', 'ORG002', 'ORG003'))`;
    params.push(organizationId);
  }
  sql += ' LIMIT 1';

  const res = await query(sql, params);
  return mapProduct(res.rows[0]);
};

exports.generateNextIds = async () => {
  const skuRes = await query("SELECT sku FROM products WHERE sku ~ '^SKU[0-9]+' ORDER BY sku DESC LIMIT 1");
  const itemRes = await query("SELECT item_id FROM products WHERE item_id ~ '^ITEM[0-9]+' ORDER BY item_id DESC LIMIT 1");

  let nextSkuNum = 1;
  let nextItemNum = 1;

  if (skuRes.rows.length > 0) {
    const match = skuRes.rows[0].sku.match(/SKU(\d+)/);
    if (match) nextSkuNum = parseInt(match[1], 10) + 1;
  }

  if (itemRes.rows.length > 0 && itemRes.rows[0].item_id) {
    const match = itemRes.rows[0].item_id.match(/ITEM(\d+)/);
    if (match) nextItemNum = parseInt(match[1], 10) + 1;
  }

  return {
    sku: `SKU${nextSkuNum.toString().padStart(3, '0')}`,
    itemId: `ITEM${nextItemNum.toString().padStart(3, '0')}`
  };
};

exports.create = async (data, organizationId) => {
  validateProductData(data, false);

  let sku = data.sku;
  let itemId = data.itemId;

  if (!sku || !itemId) {
    const next = await exports.generateNextIds();
    sku = sku || next.sku;
    itemId = itemId || next.itemId;
  }
  const id = data._id || itemId;

  let nutritionValue = data.nutritionValue || {};
  if (typeof nutritionValue === 'string') {
    try { nutritionValue = JSON.parse(nutritionValue); } catch (_) {}
  }

  let images = data.images || [];
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch (_) {}
  }
  if (!Array.isArray(images)) images = [images];
  if (data.image && images.length === 0) images = [data.image];

  const orgId = organizationId || data.organizationId || null;

  const res = await query(`
    INSERT INTO products (
      id, item_id, product_name, sku, category_id, organization_id,
      volume_of_measurement, source_of_origin, nutrition_value,
      certification, cut_type, certification_image,
      unit_price, current_stock, minimum_stock, warehouse_location, barcode,
      status, image, images, thumbnail, instructions, expiry,
      gst_rate, cgst_rate, igst_rate, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9,
      $10, $11, $12,
      $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23,
      $24, $25, $26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `, [
    id,
    itemId,
    (data.itemName || data.productName || '').trim(),
    sku,
    data.categoryId || null,
    orgId,
    data.volumeOfMeasurement || '1 piece',
    data.sourceOfOrigin || null,
    JSON.stringify(nutritionValue),
    data.certification || null,
    data.cutType || '',
    data.certificationImage || null,
    Number(data.price !== undefined ? data.price : data.unitPrice) || 0,
    Number(data.stock !== undefined ? data.stock : data.currentStock) || 0,
    Number(data.minimumStock) || 0,
    data.warehouseLocation || 'Main Warehouse',
    data.barcode || null,
    data.status || 'active',
    data.image || null,
    JSON.stringify(images),
    data.thumbnail || null,
    data.instructions || null,
    data.expiry || null,
    Number(data.gstRate) || 0,
    Number(data.cgstRate) || 0,
    Number(data.igstRate) || 0
  ]);

  return mapProduct(res.rows[0]);
};

exports.update = async (id, data, organizationId) => {
  const current = await exports.getById(id, organizationId);
  if (!current) return null;

  validateProductData(data, true);

  const productName = (data.itemName !== undefined || data.productName !== undefined)
    ? (data.itemName || data.productName).trim()
    : current.itemName;
  const categoryId = data.categoryId !== undefined ? data.categoryId : current.categoryId;
  const orgId = organizationId || (data.organizationId !== undefined ? data.organizationId : current.organizationId);
  const volumeOfMeasurement = data.volumeOfMeasurement !== undefined ? data.volumeOfMeasurement : current.volumeOfMeasurement;
  const sourceOfOrigin = data.sourceOfOrigin !== undefined ? data.sourceOfOrigin : current.sourceOfOrigin;

  let nutritionValue = current.nutritionValue;
  if (data.nutritionValue !== undefined) {
    nutritionValue = typeof data.nutritionValue === 'string' ? JSON.parse(data.nutritionValue) : data.nutritionValue;
  }

  const certification = data.certification !== undefined ? data.certification : current.certification;
  const cutType = (data.cutType !== undefined || data.certificationType !== undefined)
    ? (data.cutType || data.certificationType)
    : current.cutType;
  const certificationImage = data.certificationImage !== undefined ? data.certificationImage : current.certificationImage;
  const unitPrice = (data.price !== undefined || data.unitPrice !== undefined)
    ? Number(data.price !== undefined ? data.price : data.unitPrice)
    : current.price;
  const currentStock = (data.stock !== undefined || data.currentStock !== undefined)
    ? Number(data.stock !== undefined ? data.stock : data.currentStock)
    : current.stock;
  const minimumStock = data.minimumStock !== undefined ? Number(data.minimumStock) : current.minimumStock;
  const warehouseLocation = data.warehouseLocation !== undefined ? data.warehouseLocation : current.warehouseLocation;
  const barcode = data.barcode !== undefined ? data.barcode : current.barcode;
  const status = data.status !== undefined ? data.status : current.status;
  const image = data.image !== undefined ? data.image : current.image;

  let images = current.images;
  if (data.images !== undefined) {
    images = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
  }
  if (!Array.isArray(images)) images = [images];

  const thumbnail = data.thumbnail !== undefined ? data.thumbnail : current.thumbnail;
  const instructions = data.instructions !== undefined ? data.instructions : current.instructions;
  const expiry = data.expiry !== undefined ? data.expiry : current.expiry;
  const gstRate = data.gstRate !== undefined ? Number(data.gstRate) : current.gstRate;
  const cgstRate = data.cgstRate !== undefined ? Number(data.cgstRate) : current.cgstRate;
  const igstRate = data.igstRate !== undefined ? Number(data.igstRate) : current.igstRate;

  const res = await query(`
    UPDATE products
    SET product_name = $1,
        category_id = $2,
        organization_id = $3,
        volume_of_measurement = $4,
        source_of_origin = $5,
        nutrition_value = $6,
        certification = $7,
        cut_type = $8,
        certification_image = $9,
        unit_price = $10,
        current_stock = $11,
        minimum_stock = $12,
        warehouse_location = $13,
        barcode = $14,
        status = $15,
        image = $16,
        images = $17,
        thumbnail = $18,
        instructions = $19,
        expiry = $20,
        gst_rate = $21,
        cgst_rate = $22,
        igst_rate = $23,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $24 OR item_id = $24 OR sku = $24
    RETURNING *
  `, [
    productName,
    categoryId,
    orgId,
    volumeOfMeasurement,
    sourceOfOrigin,
    JSON.stringify(nutritionValue),
    certification,
    cutType,
    certificationImage,
    unitPrice,
    currentStock,
    minimumStock,
    warehouseLocation,
    barcode,
    status,
    image,
    JSON.stringify(images),
    thumbnail,
    instructions,
    expiry,
    gstRate,
    cgstRate,
    igstRate,
    id
  ]);

  return mapProduct(res.rows[0]);
};

exports.delete = async (id, organizationId) => {
  const current = await exports.getById(id, organizationId);
  if (!current) return null;

  await query('DELETE FROM products WHERE id = $1 OR item_id = $1 OR sku = $1', [id]);
  return current;
};
