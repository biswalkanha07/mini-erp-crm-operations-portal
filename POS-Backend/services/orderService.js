const { pool, query } = require('../db/index');
const { mapOrder, mapStoreOrderInvoice, mapStore, mapOrganization, mapProduct } = require('../db/mapper');

exports.getAll = async ({ status, storeId } = {}) => {
  let sql = `
    SELECT o.*,
           row_to_json(st.*) as store_obj
    FROM orders o
    LEFT JOIN stores st ON o.store_id = st.id OR o.store_id = st.store_id
  `;
  const params = [];
  const conditions = [];

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
    if (r.store_obj) {
      o.storeId = {
        _id: r.store_obj.id,
        id: r.store_obj.id,
        storeId: r.store_obj.store_id,
        storeName: r.store_obj.store_name
      };
    }
    return o;
  });
};

exports.getById = async (id) => {
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
  if (res.rows[0].store_obj) {
    o.storeId = {
      _id: res.rows[0].store_obj.id,
      id: res.rows[0].store_obj.id,
      storeId: res.rows[0].store_obj.store_id,
      storeName: res.rows[0].store_obj.store_name
    };
  }
  return o;
};

exports.getByStore = async (storeId) => {
  return exports.getAll({ storeId });
};

exports.create = async ({ storeId, items }) => {
  const id = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const res = await query(`
    INSERT INTO orders (id, store_id, items, status, created_at, updated_at)
    VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `, [id, storeId, JSON.stringify(items || [])]);

  return mapOrder(res.rows[0]);
};

exports.updateStatus = async (id, { status, adminNote }) => {
  const current = await exports.getById(id);
  if (!current) {
    const err = new Error('Order not found');
    err.httpStatus = 404;
    throw err;
  }

  let invoice = null;

  if (status === 'approved' && !current.invoiceId) {
    // Generate store order invoice
    const storeRes = await query(
      'SELECT * FROM stores WHERE id = $1 OR store_id = $1 LIMIT 1',
      [typeof current.storeId === 'object' ? current.storeId.storeId || current.storeId.id : current.storeId]
    );
    const store = mapStore(storeRes.rows[0]);
    if (!store) throw new Error('Store not found');

    const orgRes = await query(
      'SELECT * FROM organizations WHERE id = $1 OR organization_id = $1 LIMIT 1',
      [store.organizationId]
    );
    const organization = mapOrganization(orgRes.rows[0]);
    if (!organization) throw new Error('Organization not found');

    const skus = (current.items || []).map(i => i.sku);
    const prodRes = await query('SELECT * FROM products WHERE sku = ANY($1)', [skus]);
    const catalogueItems = prodRes.rows.map(mapProduct);

    let totalAmount = 0;
    const invoiceItems = (current.items || []).map(item => {
      const cat = catalogueItems.find(c => c.sku === item.sku);
      const pricePerUnit = cat ? cat.price : 0;
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
    const storeAddressStr = store.address ? (store.address.fullAddress || Object.values(store.address).filter(Boolean).join(', ')) : '';

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

exports.getStoreOrderInvoiceById = async (id) => {
  const res = await query(
    'SELECT * FROM store_order_invoices WHERE id = $1 OR invoice_no = $1 LIMIT 1',
    [id]
  );
  return mapStoreOrderInvoice(res.rows[0]);
};
