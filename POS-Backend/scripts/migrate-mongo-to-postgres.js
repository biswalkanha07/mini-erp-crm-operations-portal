require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../db/index');

const backupDir = path.join(__dirname, '..', 'data-backup');

function loadJson(collectionName) {
  const filePath = path.join(backupDir, `${collectionName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file missing: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function runDataMigration() {
  console.log('[Data Migration] Starting MongoDB -> PostgreSQL / Neon data migration...');
  const client = await pool.connect();

  const report = {};

  try {
    await client.query('BEGIN');

    // 1. ORGANIZATIONS (2 records from Mongo + restore referenced ORG002 & ORG004 to preserve relational integrity)
    const organizations = loadJson('organizations');
    const existingOrgIds = new Set(organizations.map(o => o.organizationId || o._id));

    // Known referenced organizations from historical users and invoices
    if (!existingOrgIds.has('ORG002')) {
      organizations.push({
        _id: 'ORG002',
        organizationId: 'ORG002',
        organizationName: 'Megana chicken',
        address: { addressLine1: 'Legacy Location', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560001' },
        email: 'anusha@hutechsolutions.in',
        createdAt: '2025-09-15T00:00:00.000Z',
        updatedAt: '2025-09-15T00:00:00.000Z'
      });
    }
    if (!existingOrgIds.has('ORG004')) {
      organizations.push({
        _id: 'ORG004',
        organizationId: 'ORG004',
        organizationName: 'Suguna Chicken Organization 4',
        address: { addressLine1: 'Legacy Location', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560001' },
        email: 'r.rohitakhya@gmail.com',
        createdAt: '2025-09-15T00:00:00.000Z',
        updatedAt: '2025-09-15T00:00:00.000Z'
      });
    }

    let orgCount = 0;
    for (const org of organizations) {
      const id = org._id || org.organizationId;
      const orgId = org.organizationId || org._id;
      const res = await client.query(`
        INSERT INTO organizations (
          id, organization_id, organization_name, address,
          contact_person_name, contact_number, email, gst_number, pan_number, logo,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        orgId,
        org.organizationName || '',
        JSON.stringify(org.address || {}),
        org.contactPersonName || '',
        org.contactNumber || '',
        org.email || '',
        org.gstNumber || '',
        org.panNumber || '',
        org.logo || '',
        org.createdAt || new Date(),
        org.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) orgCount++;
    }
    report.organizations = { totalInMongo: 2, restoredReferenced: 2, totalInserted: orgCount };
    console.log(`[Data Migration] Organizations: ${orgCount} inserted (including 2 restored historical references)`);

    // 2. STORES (5 records)
    const stores = loadJson('stores');
    let storeCount = 0;
    for (const s of stores) {
      const id = s._id || s.storeId;
      const storeId = s.storeId || s._id;
      const address = s.address || (s.storeAddress ? { fullAddress: s.storeAddress } : {});
      const res = await client.query(`
        INSERT INTO stores (
          id, store_id, store_name, store_location, address,
          contact_person_name, contact_number, email, store_picture,
          status, organization_id, discount_rate, profit_margin_percent,
          theme, gst_rate, bank_details, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        storeId,
        s.storeName || '',
        s.storeLocation || '',
        JSON.stringify(address),
        s.contactPersonName || '',
        s.contactNumber || '',
        s.email || '',
        s.storePicture || '',
        s.status || 'active',
        s.organizationId || null,
        Number(s.discountRate) || 0,
        Number(s.profitMarginPercent) || 0,
        s.theme || 'light',
        Number(s.gstRate) || 0,
        JSON.stringify(s.bankDetails || {}),
        s.createdAt || new Date(),
        s.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) storeCount++;
    }
    report.stores = { totalInMongo: stores.length, totalInserted: storeCount };
    console.log(`[Data Migration] Stores: ${storeCount} inserted of ${stores.length}`);

    // 3. CATEGORIES (7 records)
    const categories = loadJson('categories');
    let catCount = 0;
    for (const c of categories) {
      const id = c._id || c.categoryId;
      const catId = c.categoryId || c._id;
      const res = await client.query(`
        INSERT INTO categories (
          id, category_id, category_name, description, status, organization_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        catId,
        c.categoryName || '',
        c.categoryDescription || '',
        c.status || 'active',
        c.organizationId || null,
        c.createdAt || new Date(),
        c.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) catCount++;
    }
    report.categories = { totalInMongo: categories.length, totalInserted: catCount };
    console.log(`[Data Migration] Categories: ${catCount} inserted of ${categories.length}`);

    // 4. USERS (9 records)
    const users = loadJson('users');
    let userCount = 0;
    for (const u of users) {
      const id = u._id ? String(u._id) : u.userId;
      const userId = u.userId || String(u._id);
      const res = await client.query(`
        INSERT INTO users (
          id, user_id, name, email, password, user_type, role,
          organization_id, store_id, permissions, status,
          reset_password_token, reset_password_expires,
          signup_token, signup_token_expires, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        userId,
        u.name || '',
        (u.email || '').toLowerCase().trim(),
        u.password,
        u.userType || 'organization',
        u.role || 'cashier',
        u.organizationId || null,
        u.storeId || null,
        JSON.stringify(u.permissions || []),
        u.status || 'active',
        u.resetPasswordToken || null,
        u.resetPasswordExpires ? new Date(u.resetPasswordExpires) : null,
        u.signupToken || null,
        u.signupTokenExpires ? new Date(u.signupTokenExpires) : null,
        u.createdAt || new Date(),
        u.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) userCount++;
    }
    report.users = { totalInMongo: users.length, totalInserted: userCount };
    console.log(`[Data Migration] Users: ${userCount} inserted of ${users.length}`);

    // 5. CATALOGUES / PRODUCTS (10 records)
    const catalogues = loadJson('catalogues');
    let prodCount = 0;
    for (const p of catalogues) {
      const id = p._id || p.itemId;
      const itemId = p.itemId || p._id;
      const res = await client.query(`
        INSERT INTO products (
          id, item_id, product_name, sku, category_id, organization_id,
          volume_of_measurement, source_of_origin, nutrition_value,
          certification, cut_type, certification_image,
          unit_price, current_stock, minimum_stock, warehouse_location, barcode,
          status, image, images, thumbnail, instructions, expiry,
          gst_rate, cgst_rate, igst_rate, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        itemId,
        p.itemName || '',
        p.sku || '',
        p.categoryId || null,
        p.organizationId || null,
        p.volumeOfMeasurement || '1 piece',
        p.sourceOfOrigin || null,
        JSON.stringify(p.nutritionValue || {}),
        p.certification || null,
        p.cutType || '',
        p.certificationImage || null,
        Number(p.price) || 0,
        Number(p.stock) || 0,
        0, // minimum_stock default
        'Main Warehouse', // warehouse_location
        p.barcode || null,
        p.status || 'active',
        p.image || null,
        JSON.stringify(p.images || (p.image ? [p.image] : [])),
        p.thumbnail || null,
        p.instructions || null,
        p.expiry || null,
        Number(p.gstRate) || 0,
        Number(p.cgstRate) || 0,
        Number(p.igstRate) || 0,
        p.createdAt || new Date(),
        p.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) prodCount++;
    }
    report.products = { totalInMongo: catalogues.length, totalInserted: prodCount };
    console.log(`[Data Migration] Products: ${prodCount} inserted of ${catalogues.length}`);

    // 6. STORE PRICES (8 records)
    const storePrices = loadJson('storeprices');
    let spCount = 0;
    for (const sp of storePrices) {
      const id = String(sp._id);
      const res = await client.query(`
        INSERT INTO store_prices (
          id, store_id, sku, base_price, margin_type, margin_value,
          override_price, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        sp.storeId,
        sp.sku,
        sp.basePrice !== undefined ? Number(sp.basePrice) : null,
        sp.marginType || 'percent',
        Number(sp.marginValue) || 0,
        sp.overridePrice !== undefined ? Number(sp.overridePrice) : null,
        sp.status || 'active',
        sp.createdAt || new Date(),
        sp.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) spCount++;
    }
    report.store_prices = { totalInMongo: storePrices.length, totalInserted: spCount };
    console.log(`[Data Migration] Store Prices: ${spCount} inserted of ${storePrices.length}`);

    // 7. PROMO CODES (1 record)
    const promoCodes = loadJson('promocodes');
    let promoCount = 0;
    for (const promo of promoCodes) {
      const id = String(promo._id);
      const res = await client.query(`
        INSERT INTO promo_codes (
          id, code, description, discount_type, discount_value,
          expiry_date, usage_limit, used_count, is_active, organization_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        promo.code,
        promo.description || '',
        promo.discountType || 'percentage',
        Number(promo.discountValue) || 0,
        promo.expiryDate ? new Date(promo.expiryDate) : null,
        promo.usageLimit !== undefined ? Number(promo.usageLimit) : null,
        Number(promo.usedCount) || 0,
        promo.isActive !== false,
        promo.organization ? String(promo.organization) : null,
        promo.createdAt || new Date(),
        promo.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) promoCount++;
    }
    report.promo_codes = { totalInMongo: promoCodes.length, totalInserted: promoCount };
    console.log(`[Data Migration] Promo Codes: ${promoCount} inserted of ${promoCodes.length}`);

    // 8. CUSTOMERS (10 records)
    const customers = loadJson('customers');
    let custCount = 0;
    for (const cust of customers) {
      const id = String(cust._id);
      const phone = cust.phone || '';
      const res = await client.query(`
        INSERT INTO customers (
          id, name, mobile, phone, email, business_name, gst_number,
          customer_type, address, status, loyalty_points, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        cust.name || 'Anonymous Customer',
        phone || 'N/A',
        phone || null,
        cust.email || null,
        null, // business_name
        null, // gst_number
        'Retail',
        null, // address
        'Active',
        Number(cust.loyaltyPoints) || 0,
        cust.createdAt || new Date(),
        cust.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) custCount++;
    }
    report.customers = { totalInMongo: customers.length, totalInserted: custCount };
    console.log(`[Data Migration] Customers: ${custCount} inserted of ${customers.length}`);

    // 9. SALES (91 records)
    const sales = loadJson('sales');
    let salesCount = 0;
    for (const s of sales) {
      const id = String(s._id);
      const res = await client.query(`
        INSERT INTO sales (
          id, transaction_id, store_id, items, sub_total, gst_total,
          discount_total, grand_total, payment_method, customer_details,
          cashier_id, date_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        s.transactionId,
        s.storeId,
        JSON.stringify(s.items || []),
        Number(s.subTotal) || 0,
        Number(s.gstTotal) || 0,
        Number(s.discountTotal) || 0,
        Number(s.grandTotal) || 0,
        s.paymentMethod || 'cash',
        JSON.stringify(s.customerDetails || {}),
        s.cashier ? String(s.cashier) : null,
        s.dateTime || new Date(),
        s.createdAt || s.dateTime || new Date(),
        s.updatedAt || s.dateTime || new Date()
      ]);
      if (res.rowCount > 0) salesCount++;
    }
    report.sales = { totalInMongo: sales.length, totalInserted: salesCount };
    console.log(`[Data Migration] Sales: ${salesCount} inserted of ${sales.length}`);

    // 10. INVOICES (89 records)
    const invoices = loadJson('invoices');
    let invCount = 0;
    for (const inv of invoices) {
      const id = String(inv._id);
      const res = await client.query(`
        INSERT INTO invoices (
          id, invoice_no, transaction_id, store_id, organization_id,
          items, total_amount, payment_mode, qr_code_url, date_time,
          customer_details, due_date, status, notes, store_name,
          store_address, organization_name, gst_number, phone_number,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        inv.invoiceNo,
        inv.transactionId ? String(inv.transactionId) : null,
        inv.storeId || null,
        inv.organizationId || null,
        JSON.stringify(inv.items || []),
        Number(inv.totalAmount) || 0,
        inv.paymentMode || 'cash',
        inv.qrCodeUrl || null,
        inv.dateTime || new Date(),
        JSON.stringify(inv.customerDetails || {}),
        inv.dueDate ? new Date(inv.dueDate) : null,
        inv.status || 'paid',
        inv.notes || null,
        inv.storeName || null,
        inv.storeAddress || null,
        inv.organizationName || null,
        inv.gstNumber || null,
        inv.phoneNumber || null,
        inv.createdAt || new Date(),
        inv.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) invCount++;
    }
    report.invoices = { totalInMongo: invoices.length, totalInserted: invCount };
    console.log(`[Data Migration] Invoices: ${invCount} inserted of ${invoices.length}`);

    // 11. ORDERS (6 records)
    const orders = loadJson('orders');
    let orderCount = 0;
    for (const o of orders) {
      const id = String(o._id);
      const res = await client.query(`
        INSERT INTO orders (
          id, store_id, items, status, admin_note, invoice_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        o.storeId,
        JSON.stringify(o.items || []),
        o.status || 'pending',
        o.adminNote || null,
        o.invoiceId ? String(o.invoiceId) : null,
        o.createdAt || new Date(),
        o.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) orderCount++;
    }
    report.orders = { totalInMongo: orders.length, totalInserted: orderCount };
    console.log(`[Data Migration] Orders: ${orderCount} inserted of ${orders.length}`);

    // 12. STORE ORDER INVOICES (6 records)
    const storeOrderInvoices = loadJson('storeorderinvoices');
    let soiCount = 0;
    for (const soi of storeOrderInvoices) {
      const id = String(soi._id);
      const res = await client.query(`
        INSERT INTO store_order_invoices (
          id, invoice_no, store_id, organization_id, items,
          total_amount, date_time, due_date, status, notes,
          store_name, store_address, organization_name,
          gst_number, phone_number, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        id,
        soi.invoiceNo,
        soi.storeId,
        soi.organizationId,
        JSON.stringify(soi.items || []),
        Number(soi.totalAmount) || 0,
        soi.dateTime || new Date(),
        soi.dueDate ? new Date(soi.dueDate) : null,
        soi.status || 'pending',
        soi.notes || null,
        soi.storeName || null,
        soi.storeAddress || null,
        soi.organizationName || null,
        soi.gstNumber || null,
        soi.phoneNumber || null,
        soi.createdAt || new Date(),
        soi.updatedAt || new Date()
      ]);
      if (res.rowCount > 0) soiCount++;
    }
    report.store_order_invoices = { totalInMongo: storeOrderInvoices.length, totalInserted: soiCount };
    console.log(`[Data Migration] Store Order Invoices: ${soiCount} inserted of ${storeOrderInvoices.length}`);

    await client.query('COMMIT');
    console.log('[Data Migration] All stages COMMITTED successfully.');

    // Print summary verification
    console.log('\n================ DATA MIGRATION SUMMARY ================');
    for (const [table, counts] of Object.entries(report)) {
      console.log(`Table '${table}': ${counts.totalInserted} inserted (Source documents: ${counts.totalInMongo})`);
    }
    console.log('========================================================\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Data Migration] Migration failed with error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runDataMigration();
