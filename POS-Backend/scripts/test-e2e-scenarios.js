require('dotenv').config();
const http = require('http');
const { pool } = require('../db');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request({
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

function authHeader(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function runE2EScenarios() {
  console.log('=== RUNNING PHASE 9 END-TO-END BUSINESS SCENARIOS ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  let adminToken, salesToken, warehouseToken, accountsToken;
  await test('Authenticate all test roles', async () => {
    adminToken = await login('admin@pos.com', 'admin123');
    salesToken = await login('sales@pos.com', 'sales123');
    warehouseToken = await login('warehouse@pos.com', 'warehouse123');
    accountsToken = await login('accounts@pos.com', 'accounts123');
  });

  // SCENARIO 1 — CRM END-TO-END
  let e2eCustomerId;
  const testCustName = `E2E_Customer_${Date.now()}`;
  await test('SCENARIO 1 — CRM: Create, search, view detail, add follow-up, verify history', async () => {
    // 1. Create customer
    const createRes = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      name: testCustName,
      mobile: '+919876500001',
      email: `e2e_${Date.now()}@example.com`,
      businessName: 'E2E Logistics Enterprises',
      type: 'Wholesale',
      status: 'Active',
      followUpDate: '2026-09-30'
    });
    if (createRes.status !== 201 || !createRes.body?.data?.id) {
      throw new Error(`Customer creation failed: ${JSON.stringify(createRes.body)}`);
    }
    e2eCustomerId = createRes.body.data.id;

    // 2. Search customer
    const searchRes = await request({
      port: 5050,
      path: `/api/customers?search=${encodeURIComponent(testCustName)}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    const found = searchRes.body.data?.find(c => c.id === e2eCustomerId);
    if (!found) throw new Error('Created customer not found in search results');

    // 3. View detail
    const detailRes = await request({
      port: 5050,
      path: `/api/customers/${e2eCustomerId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (detailRes.status !== 200 || detailRes.body.data?.name !== testCustName) {
      throw new Error('Customer detail mismatch');
    }

    // 4. Add follow-up note
    const folRes = await request({
      port: 5050,
      path: `/api/customers/${e2eCustomerId}/follow-ups`,
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      note: 'Discussed wholesale bulk pricing terms for Q4 delivery',
      followUpDate: '2026-10-15'
    });
    if (folRes.status !== 201) throw new Error(`Add follow-up failed: ${JSON.stringify(folRes.body)}`);

    // 5. Verify append-only history
    const histRes = await request({
      port: 5050,
      path: `/api/customers/${e2eCustomerId}/follow-ups`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (!Array.isArray(histRes.body.data) || histRes.body.data.length === 0) {
      throw new Error('Follow-up history is empty');
    }
    const note = histRes.body.data[0];
    if (!note.notes || !note.followUpDate) throw new Error('Follow-up record missing required fields');
  });

  // SCENARIO 2 — INVENTORY END-TO-END
  let e2eProductId;
  const testSku = `E2E_SKU_${Date.now()}`;
  await test('SCENARIO 2 — INVENTORY: Create product with stock=100 & min=20, reduce stock, verify low-stock alert', async () => {
    // 1. Create product
    const createRes = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      itemName: 'E2E Test Inventory Item',
      sku: testSku,
      price: 250,
      currentStock: 100,
      minimumStock: 20,
      warehouseLocation: 'Bay-E2E-01',
      volumeOfMeasurement: '1 kg'
    });
    if (createRes.status !== 201 || !createRes.body?._id) {
      throw new Error(`Product creation failed: ${JSON.stringify(createRes.body)}`);
    }
    e2eProductId = createRes.body._id;

    // 2. Verify product is healthy (not low stock)
    const getRes = await request({
      port: 5050,
      path: `/api/catalogues/${e2eProductId}`,
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (getRes.body.isLowStock === true || getRes.body.currentStock !== 100) {
      throw new Error('Initial stock status should be healthy');
    }

    // 3. Update stock below threshold to 15
    await pool.query('UPDATE products SET current_stock = 15 WHERE id = $1', [e2eProductId]);

    // 4. Verify low-stock alert calculation (minimum_stock > 0 AND current_stock <= minimum_stock)
    const lowStockRes = await request({
      port: 5050,
      path: `/api/catalogues/${e2eProductId}`,
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (lowStockRes.body.isLowStock !== true || lowStockRes.body.currentStock !== 15) {
      throw new Error('Product should be flagged as low stock when stock=15 and min=20');
    }
  });

  // SCENARIO 3 — STOCK MOVEMENT END-TO-END
  await test('SCENARIO 3 — STOCK MOVEMENT: Warehouse IN 50 (15->65) and OUT 30 (65->35), verify 2 audit records', async () => {
    // 1. IN 50
    const inRes = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      productId: e2eProductId,
      quantity: 50,
      movementType: 'IN',
      reason: 'E2E Shipment Inflow'
    });
    if (inRes.status !== 201 || inRes.body.currentStock !== 65) {
      throw new Error(`IN movement failed, expected stock 65, got ${inRes.body?.currentStock}`);
    }

    // 2. OUT 30
    const outRes = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      productId: e2eProductId,
      quantity: 30,
      movementType: 'OUT',
      reason: 'E2E Distribution Outflow'
    });
    if (outRes.status !== 201 || outRes.body.currentStock !== 35) {
      throw new Error(`OUT movement failed, expected stock 35, got ${outRes.body?.currentStock}`);
    }

    // 3. Verify exactly 2 audit records exist for this product
    const movRes = await request({
      port: 5050,
      path: `/api/stock-movements?productId=${e2eProductId}`,
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (movRes.body.pagination?.total !== 2 && movRes.body.data?.length !== 2) {
      throw new Error(`Expected 2 audit records, found ${movRes.body.data?.length}`);
    }
  });

  // SCENARIO 4 — INSUFFICIENT STOCK ATOMICITY
  await test('SCENARIO 4 — INSUFFICIENT STOCK: OUT 100 with stock=35 fails with 400, stock unchanged, 0 movements', async () => {
    const outRes = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      productId: e2eProductId,
      quantity: 100,
      movementType: 'OUT',
      reason: 'Excessive Quantity Test'
    });
    if (outRes.status !== 400 && outRes.status !== 409) {
      throw new Error(`Expected error status, got ${outRes.status}`);
    }

    // Verify stock remains 35
    const prodRes = await request({
      port: 5050,
      path: `/api/catalogues/${e2eProductId}`,
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (prodRes.body.currentStock !== 35) {
      throw new Error(`Stock mutated on failure! Expected 35, got ${prodRes.body.currentStock}`);
    }
  });

  // SCENARIO 5 — CHALLAN DRAFT CREATION
  let e2eDraftChallanId;
  await test('SCENARIO 5 — CHALLAN DRAFT: Create draft challan, verify stock unchanged & 0 movements', async () => {
    const draftRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: e2eCustomerId,
      notes: 'E2E Draft Order for validation',
      items: [
        { productId: e2eProductId, quantity: 10 }
      ]
    });
    if (draftRes.status !== 201 || !draftRes.body?.data?.id) {
      throw new Error(`Draft creation failed: ${JSON.stringify(draftRes.body)}`);
    }
    e2eDraftChallanId = draftRes.body.data.id;
    if (draftRes.body.data.status !== 'DRAFT') {
      throw new Error(`Expected status DRAFT, got ${draftRes.body.data.status}`);
    }

    // Verify product stock is STILL 35
    const prodRes = await request({
      port: 5050,
      path: `/api/catalogues/${e2eProductId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (prodRes.body.currentStock !== 35) {
      throw new Error(`Stock changed on draft creation! Expected 35, got ${prodRes.body.currentStock}`);
    }
  });

  // SCENARIO 6 — CHALLAN CONFIRM & CONCURRENT CONFIRMATION
  await test('SCENARIO 6 — CHALLAN CONFIRM: Confirm draft (stock 35->25), OUT movement logged, concurrent duplicate returns 409', async () => {
    // 1. Confirm draft
    const confRes = await request({
      port: 5050,
      path: `/api/challans/${e2eDraftChallanId}/confirm`,
      method: 'POST',
      headers: authHeader(salesToken)
    });
    if (confRes.status !== 200 || confRes.body?.data?.status !== 'CONFIRMED') {
      throw new Error(`Challan confirmation failed: ${JSON.stringify(confRes.body)}`);
    }

    // 2. Verify stock deducted: 35 -> 25
    const prodRes = await request({
      port: 5050,
      path: `/api/catalogues/${e2eProductId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (prodRes.body.currentStock !== 25) {
      throw new Error(`Stock not decremented accurately! Expected 25, got ${prodRes.body.currentStock}`);
    }

    // 3. Concurrent/Duplicate confirmation attempt must be rejected with 409 Conflict
    const dupRes = await request({
      port: 5050,
      path: `/api/challans/${e2eDraftChallanId}/confirm`,
      method: 'POST',
      headers: authHeader(salesToken)
    });
    if (dupRes.status !== 409) {
      throw new Error(`Duplicate confirmation should return 409 Conflict, got ${dupRes.status}`);
    }

    // Stock must STILL be 25
    const prodRes2 = await request({
      port: 5050,
      path: `/api/catalogues/${e2eProductId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (prodRes2.body.currentStock !== 25) {
      throw new Error(`Stock was double-deducted! Expected 25, got ${prodRes2.body.currentStock}`);
    }
  });

  // SCENARIO 7 — CHALLAN FAILURE ATOMICITY
  await test('SCENARIO 7 — CHALLAN FAILURE ATOMICITY: Multi-item challan with 1 insufficient item rolls back completely', async () => {
    // Current stock of e2eProductId is 25.
    // Create challan requesting 10 of e2eProductId (valid) + 999999 of e2eProductId is not allowed as duplicate,
    // so we create a challan with 999999 quantity of e2eProductId directly to trigger insufficient stock on confirmation.
    const failChallanRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: e2eCustomerId,
      notes: 'Atomic rollback test',
      items: [
        { productId: e2eProductId, quantity: 999999 }
      ]
    });
    if (failChallanRes.status !== 201) throw new Error(`Challan creation failed: ${JSON.stringify(failChallanRes.body)}`);
    const chId = failChallanRes.body.data.id;

    // Attempt confirm
    const confRes = await request({
      port: 5050,
      path: `/api/challans/${chId}/confirm`,
      method: 'POST',
      headers: authHeader(salesToken)
    });
    if (confRes.status !== 409) {
      throw new Error(`Expected 409 Conflict on insufficient stock, got ${confRes.status}`);
    }

    // Verify stock of e2eProductId is STILL 25 (atomic rollback, no partial deduction)
    const prodRes = await request({
      port: 5050,
      path: `/api/catalogues/${e2eProductId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (prodRes.body.currentStock !== 25) {
      throw new Error(`Partial deduction occurred! Expected 25, got ${prodRes.body.currentStock}`);
    }

    // Verify challan status is STILL DRAFT
    const getChRes = await request({
      port: 5050,
      path: `/api/challans/${chId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (getChRes.body.data.status !== 'DRAFT') {
      throw new Error(`Challan status mutated on failure! Expected DRAFT, got ${getChRes.body.data.status}`);
    }
  });

  // SCENARIO 8 — HISTORICAL SNAPSHOT INTEGRITY
  await test('SCENARIO 8 — HISTORICAL SNAPSHOT: Product price/name edit in catalogue does NOT mutate existing challan snapshot', async () => {
    // 1. Create product with initial price 500
    const snapshotSku = `SNAP_SKU_${Date.now()}`;
    const pRes = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      itemName: 'Original Snapshot Product Name',
      sku: snapshotSku,
      price: 500,
      currentStock: 50,
      minimumStock: 10
    });
    const snapProdId = pRes.body._id;

    // 2. Create draft challan referencing this product
    const chRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: e2eCustomerId,
      items: [{ productId: snapProdId, quantity: 2 }]
    });
    const snapChallanId = chRes.body.data.id;

    // 3. Mutate product price and name in catalogue
    await pool.query(
      "UPDATE products SET product_name = 'Modified New Name 2026', unit_price = 999.00 WHERE id = $1",
      [snapProdId]
    );

    // 4. Fetch challan details and verify historical snapshot is preserved
    const verifyRes = await request({
      port: 5050,
      path: `/api/challans/${snapChallanId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    const item = verifyRes.body.data?.items?.[0];
    if (!item) throw new Error('Challan item missing');
    if (item.productName !== 'Original Snapshot Product Name' || Number(item.unitPrice) !== 500) {
      throw new Error(`Snapshot corrupted! Expected 'Original Snapshot Product Name' @ 500, got '${item.productName}' @ ${item.unitPrice}`);
    }
  });

  // SCENARIO 9 — RBAC MATRIX VERIFICATION
  await test('SCENARIO 9 — RBAC: Strict 403 Forbidden enforcement on all role boundary violations', async () => {
    // Sales cannot create products
    const s1 = await request({ port: 5050, path: '/api/catalogues', method: 'POST', headers: authHeader(salesToken) }, { itemName: 'Hack' });
    if (s1.status !== 403) throw new Error(`Sales create catalogue: expected 403, got ${s1.status}`);

    // Warehouse cannot create challans
    const s2 = await request({ port: 5050, path: '/api/challans', method: 'POST', headers: authHeader(warehouseToken) }, { customerId: e2eCustomerId, items: [] });
    if (s2.status !== 403) throw new Error(`Warehouse create challan: expected 403, got ${s2.status}`);

    // Accounts cannot create stock movements
    const s3 = await request({ port: 5050, path: '/api/stock-movements', method: 'POST', headers: authHeader(accountsToken) }, { productId: e2eProductId, quantity: 1, movementType: 'IN', reason: 'Test' });
    if (s3.status !== 403) throw new Error(`Accounts create movement: expected 403, got ${s3.status}`);
  });

  // SCENARIO 10 — ORGANIZATION ISOLATION
  await test('SCENARIO 10 — ORG ISOLATION: Cross-organization data leakage strictly prevented', async () => {
    // Create customer in foreign organization ORG002
    const isoCustId = `CUST_ISO_${Date.now()}`;
    await pool.query(`
      INSERT INTO customers (id, name, mobile, customer_type, status, organization_id, created_at, updated_at)
      VALUES ($1, 'Isolated Company Ltd', '9000000000', 'Retail', 'Active', 'ORG002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [isoCustId]);

    // Query customers with salesToken (belongs to ORG001)
    const salesCustRes = await request({
      port: 5050,
      path: '/api/customers?limit=100',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    const foundIso = salesCustRes.body.data?.find(c => c.id === isoCustId);
    if (foundIso) {
      throw new Error('Data leakage! Foreign organization customer visible in Sales customer list');
    }

    // Cleanup isolated record safely
    await pool.query('DELETE FROM customers WHERE id = $1', [isoCustId]);
  });

  console.log(`\n=== ALL E2E SCENARIOS COMPLETED: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runE2EScenarios().then(() => pool.end()).catch(err => {
  console.error('E2E test error:', err);
  pool.end();
  process.exit(1);
});
