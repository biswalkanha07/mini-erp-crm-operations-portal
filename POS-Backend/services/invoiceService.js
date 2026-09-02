const { query } = require('../db/index');
const { mapInvoice, mapSale, mapStore, mapOrganization } = require('../db/mapper');

exports.getAll = async ({ storeId, organizationId } = {}) => {
  let sql = 'SELECT * FROM invoices';
  const params = [];
  const conditions = [];

  if (storeId) {
    conditions.push(`store_id = $${params.length + 1}`);
    params.push(storeId);
  }
  if (organizationId) {
    conditions.push(`organization_id = $${params.length + 1}`);
    params.push(organizationId);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY date_time DESC';

  const res = await query(sql, params);
  return res.rows.map(mapInvoice);
};

exports.getById = async (id) => {
  const res = await query(
    'SELECT * FROM invoices WHERE id = $1 OR invoice_no = $1 LIMIT 1',
    [id]
  );
  return mapInvoice(res.rows[0]);
};

exports.getByTransactionId = async (transactionId) => {
  const res = await query(
    'SELECT * FROM invoices WHERE transaction_id = $1 LIMIT 1',
    [transactionId]
  );
  return mapInvoice(res.rows[0]);
};

exports.getByStore = async (storeId) => {
  const res = await query(
    'SELECT * FROM invoices WHERE store_id = $1 ORDER BY date_time DESC',
    [storeId]
  );
  return res.rows.map(mapInvoice);
};

exports.generateInvoiceFromTransaction = async (transactionId) => {
  const saleRes = await query(
    'SELECT * FROM sales WHERE id = $1 OR transaction_id = $1 LIMIT 1',
    [transactionId]
  );
  const transaction = mapSale(saleRes.rows[0]);
  if (!transaction) {
    const err = new Error('Transaction not found');
    err.httpStatus = 404;
    throw err;
  }

  const storeRes = await query(
    'SELECT * FROM stores WHERE id = $1 OR store_id = $1 LIMIT 1',
    [transaction.storeId]
  );
  const store = mapStore(storeRes.rows[0]);
  if (!store) {
    const err = new Error('Store not found');
    err.httpStatus = 404;
    throw err;
  }

  const orgRes = await query(
    'SELECT * FROM organizations WHERE id = $1 OR organization_id = $1 LIMIT 1',
    [store.organizationId]
  );
  const organization = mapOrganization(orgRes.rows[0]);
  if (!organization) {
    const err = new Error('Organization not found');
    err.httpStatus = 404;
    throw err;
  }

  const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const id = invoiceNo;

  const totalAmount = transaction.grandTotal;
  const storeAddressStr = store.address ? (store.address.fullAddress || Object.values(store.address).filter(Boolean).join(', ')) : '';

  const res = await query(`
    INSERT INTO invoices (
      id, invoice_no, transaction_id, store_id, organization_id,
      items, total_amount, payment_mode, qr_code_url, date_time,
      customer_details, due_date, status, notes, store_name,
      store_address, organization_name, gst_number, phone_number,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, CURRENT_TIMESTAMP,
      $10, CURRENT_TIMESTAMP + INTERVAL '30 days', 'paid', $11, $12,
      $13, $14, $15, $16,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `, [
    id,
    invoiceNo,
    transaction.transactionId,
    store.id,
    organization.id,
    JSON.stringify(transaction.items || []),
    totalAmount,
    transaction.paymentMethod || 'cash',
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Invoice-${invoiceNo}`,
    JSON.stringify(transaction.customerDetails || {}),
    'Thank you for your business!',
    store.storeName,
    storeAddressStr,
    organization.organizationName,
    organization.gstNumber || '',
    organization.contactNumber || ''
  ]);

  return mapInvoice(res.rows[0]);
};

exports.updateStatus = async (id, status) => {
  const res = await query(`
    UPDATE invoices
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 OR invoice_no = $2
    RETURNING *
  `, [status, id]);
  return mapInvoice(res.rows[0]);
};
