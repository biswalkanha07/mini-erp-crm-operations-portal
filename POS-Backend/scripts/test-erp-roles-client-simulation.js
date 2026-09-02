/**
 * test-erp-roles-client-simulation.js
 * Comprehensive end-to-end verification of all 4 test roles under Admin (ORG001)
 * Validates Dashboard, Inventory with Barcodes, Stock Movements (Create vs View-Only),
 * Sales Challans (Create vs View-Only), and User Management (Admin Only).
 */

const http = require('http');

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
  return {
    token: res.body.data.token,
    user: res.body.data.user
  };
}

function authHeader(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function runRoleSimulation() {
  console.log('================================================================');
  console.log('🧪 ROLE-BASED ACCESS & CLIENT SIMULATION VERIFICATION (4 ROLES)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc} ->`, err.message);
      failed++;
    }
  }

  // 1. Authenticate all 4 test accounts
  console.log('--- 1. AUTHENTICATION OF 4 CANONICAL ERP TEST ACCOUNTS ---');
  let admin, sales, warehouse, accounts;
  await check('Login Admin (admin@test.com)', async () => {
    admin = await login('admin@test.com', 'password123');
    if (admin.user.role.toLowerCase() !== 'admin') throw new Error(`Wrong role: ${admin.user.role}`);
  });
  await check('Login Sales (sales@test.com)', async () => {
    sales = await login('sales@test.com', 'password123');
    if (sales.user.role.toLowerCase() !== 'sales') throw new Error(`Wrong role: ${sales.user.role}`);
  });
  await check('Login Warehouse (warehouse@test.com)', async () => {
    warehouse = await login('warehouse@test.com', 'password123');
    if (warehouse.user.role.toLowerCase() !== 'warehouse') throw new Error(`Wrong role: ${warehouse.user.role}`);
  });
  await check('Login Accounts (accounts@test.com)', async () => {
    accounts = await login('accounts@test.com', 'password123');
    if (accounts.user.role.toLowerCase() !== 'accounts') throw new Error(`Wrong role: ${accounts.user.role}`);
  });

  // Get a sample product ID for test transactions
  let sampleProductId;
  const prodRes = await request({
    port: 5050,
    path: '/api/catalogues?limit=1',
    method: 'GET',
    headers: authHeader(admin.token)
  });
  const prodList = Array.isArray(prodRes.body) ? prodRes.body : (prodRes.body.data || []);
  if (prodList.length > 0) {
    sampleProductId = prodList[0]._id || prodList[0].id;
  }

  // Get sample customer ID
  let sampleCustomerId;
  const custRes = await request({
    port: 5050,
    path: '/api/customers?limit=1',
    method: 'GET',
    headers: authHeader(admin.token)
  });
  const custList = Array.isArray(custRes.body) ? custRes.body : (custRes.body.data || []);
  if (custList.length > 0) {
    sampleCustomerId = custList[0]._id || custList[0].id;
  }

  // 2. ROLE 1 — WAREHOUSE OFFICER VERIFICATION
  console.log('\n--- 2. ROLE 1 — WAREHOUSE OFFICER VERIFICATION ---');
  await check('Warehouse Dashboard overview accessible (GET /api/dashboard/overview) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/dashboard/overview', method: 'GET', headers: authHeader(warehouse.token) });
    if (res.status !== 200 || !res.body?.data) throw new Error(`Status ${res.status}`);
    if (!res.body.data.inventory || !res.body.data.challans) throw new Error('Missing inventory/challans sections');
  });

  await check('Warehouse Stock Movements accessible (GET /api/stock-movements) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/stock-movements', method: 'GET', headers: authHeader(warehouse.token) });
    if (res.status !== 200 || !res.body?.data) throw new Error(`Status ${res.status}`);
  });

  if (sampleProductId) {
    await check('Warehouse CAN create manual Stock Movement (POST /api/stock-movements) -> 201', async () => {
      const res = await request({
        port: 5050,
        path: '/api/stock-movements',
        method: 'POST',
        headers: authHeader(warehouse.token)
      }, {
        productId: sampleProductId,
        movementType: 'IN',
        quantity: 5,
        reason: 'Warehouse restock test'
      });
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    });
  }

  await check('Warehouse Product Catalogue table accessible with Barcode field -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/catalogues', method: 'GET', headers: authHeader(warehouse.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const items = Array.isArray(res.body) ? res.body : (res.body.data || []);
    if (items.length === 0) throw new Error('No items in catalogue');
    const withBarcode = items.find(i => i.barcode);
    if (!withBarcode) throw new Error('No products have barcode property');
  });

  await check('Warehouse Sales Challans accessible in VIEW mode (GET /api/challans) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/challans', method: 'GET', headers: authHeader(warehouse.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await check('Warehouse BLOCKED from creating Sales Challan (POST /api/challans) -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(warehouse.token)
    }, {
      customerId: sampleCustomerId,
      items: [{ productId: sampleProductId, quantity: 1 }]
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await check('Warehouse BLOCKED from User Management (GET /api/users) -> 403', async () => {
    const res = await request({ port: 5050, path: '/api/users', method: 'GET', headers: authHeader(warehouse.token) });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 3. ROLE 2 — SALES EXECUTIVE VERIFICATION
  console.log('\n--- 3. ROLE 2 — SALES EXECUTIVE VERIFICATION ---');
  await check('Sales Dashboard overview accessible (GET /api/dashboard/overview) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/dashboard/overview', method: 'GET', headers: authHeader(sales.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  let createdChallanId;
  await check('Sales CAN create Sales Challan draft (POST /api/challans) -> 201', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(sales.token)
    }, {
      customerId: sampleCustomerId,
      items: [{ productId: sampleProductId, quantity: 1 }],
      notes: 'Test challan by sales executive'
    });
    if (res.status !== 201 || !res.body?.data) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    createdChallanId = res.body.data.id;
  });

  if (createdChallanId) {
    await check('Sales CAN update DRAFT Challan (PUT /api/challans/:id) -> 200', async () => {
      const res = await request({
        port: 5050,
        path: `/api/challans/${createdChallanId}`,
        method: 'PUT',
        headers: authHeader(sales.token)
      }, {
        customerId: sampleCustomerId,
        items: [{ productId: sampleProductId, quantity: 2 }],
        notes: 'Updated notes by sales executive'
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    await check('Sales CAN cancel DRAFT Challan (POST /api/challans/:id/cancel) -> 200', async () => {
      const res = await request({
        port: 5050,
        path: `/api/challans/${createdChallanId}/cancel`,
        method: 'POST',
        headers: authHeader(sales.token)
      }, {
        reason: 'Cancelled test challan'
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });
  }

  await check('Sales CAN view Stock Movements (GET /api/stock-movements) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/stock-movements', method: 'GET', headers: authHeader(sales.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await check('Sales BLOCKED from manual Stock Movement creation (POST /api/stock-movements) -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(sales.token)
    }, {
      productId: sampleProductId,
      movementType: 'IN',
      quantity: 5,
      reason: 'Unauthorized movement attempt'
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await check('Sales BLOCKED from User Management (GET /api/users) -> 403', async () => {
    const res = await request({ port: 5050, path: '/api/users', method: 'GET', headers: authHeader(sales.token) });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 4. ROLE 3 — ACCOUNTS EXECUTIVE VERIFICATION
  console.log('\n--- 4. ROLE 3 — ACCOUNTS EXECUTIVE VERIFICATION ---');
  await check('Accounts Dashboard overview accessible (GET /api/dashboard/overview) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/dashboard/overview', method: 'GET', headers: authHeader(accounts.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await check('Accounts CAN view Sales Challans (GET /api/challans) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/challans', method: 'GET', headers: authHeader(accounts.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await check('Accounts BLOCKED from creating Sales Challan (POST /api/challans) -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(accounts.token)
    }, {
      customerId: sampleCustomerId,
      items: [{ productId: sampleProductId, quantity: 1 }]
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await check('Accounts CAN view Stock Movements (GET /api/stock-movements) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/stock-movements', method: 'GET', headers: authHeader(accounts.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await check('Accounts BLOCKED from manual Stock Movement creation (POST /api/stock-movements) -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(accounts.token)
    }, {
      productId: sampleProductId,
      movementType: 'IN',
      quantity: 5,
      reason: 'Unauthorized movement attempt'
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await check('Accounts CAN view Product Catalogue (GET /api/catalogues) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/catalogues', method: 'GET', headers: authHeader(accounts.token) });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await check('Accounts BLOCKED from modifying Catalogue (POST /api/catalogues) -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'POST',
      headers: authHeader(accounts.token)
    }, {
      productName: 'Illegal Product Addition',
      price: 100
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await check('Accounts BLOCKED from User Management (GET /api/users) -> 403', async () => {
    const res = await request({ port: 5050, path: '/api/users', method: 'GET', headers: authHeader(accounts.token) });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 5. ROLE 4 — ADMIN VERIFICATION
  console.log('\n--- 5. ROLE 4 — ADMIN (SUPERUSER) VERIFICATION ---');
  await check('Admin CAN access User Management (GET /api/users) -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/users', method: 'GET', headers: authHeader(admin.token) });
    const users = Array.isArray(res.body) ? res.body : (res.body?.data?.users || res.body?.data);
    if (res.status !== 200 || !Array.isArray(users)) throw new Error(`Status ${res.status}`);
  });

  await check('Admin CAN access Dashboard, Inventory, Movements, Challans -> 200', async () => {
    const [dRes, iRes, smRes, chRes] = await Promise.all([
      request({ port: 5050, path: '/api/dashboard/overview', method: 'GET', headers: authHeader(admin.token) }),
      request({ port: 5050, path: '/api/catalogues', method: 'GET', headers: authHeader(admin.token) }),
      request({ port: 5050, path: '/api/stock-movements', method: 'GET', headers: authHeader(admin.token) }),
      request({ port: 5050, path: '/api/challans', method: 'GET', headers: authHeader(admin.token) })
    ]);
    if (dRes.status !== 200 || iRes.status !== 200 || smRes.status !== 200 || chRes.status !== 200) {
      throw new Error('One of admin core endpoints failed');
    }
  });

  console.log('\n================================================================');
  console.log(`📊 SIMULATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRoleSimulation().catch(err => {
  console.error('Fatal simulation error:', err);
  process.exit(1);
});
