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
    throw new Error(`Login failed for ${email}: status ${res.status}, msg: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

async function runRbacTests() {
  console.log('=== RUNNING PHASE 3 RBAC AUTHORIZATION TEST SUITE ===\n');
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

  // 1. Unauthenticated & Invalid Token Security
  await test('Public Endpoint: GET /api/health without token -> 200', async () => {
    const res = await request({ port: 5050, path: '/api/health', method: 'GET' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Protected Endpoint without Token: GET /api/catalogues -> 401', async () => {
    const res = await request({ port: 5050, path: '/api/catalogues', method: 'GET' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Protected Endpoint with Invalid Token: GET /api/catalogues -> 401', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid.jwt.token' }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 2. Admin Role (Superuser)
  let adminToken;
  await test('Admin Login (admin@pos.com)', async () => {
    adminToken = await login('admin@pos.com', 'admin123');
  });

  await test('Admin: Access User Management (GET /api/users) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Admin: Access Organizations (GET /api/organizations) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/organizations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Admin: Access Financial Dashboard (GET /api/dashboard/stats) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 3. Sales Role
  let salesToken;
  await test('Sales Login (sales@pos.com)', async () => {
    salesToken = await login('sales@pos.com', 'sales123');
  });

  await test('Sales: View Catalogue (GET /api/catalogues) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Sales: View Dashboard Stats (GET /api/dashboard/stats) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Sales: BLOCKED from User Management (GET /api/users) -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Sales: BLOCKED from Category Creation (POST /api/categories) -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/categories',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      }
    }, { categoryName: 'Test Category' });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 4. Warehouse Role
  let whToken;
  await test('Warehouse Login (warehouse@pos.com)', async () => {
    whToken = await login('warehouse@pos.com', 'warehouse123');
  });

  await test('Warehouse: View Categories (GET /api/categories) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/categories',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${whToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Warehouse: View Inventory Stats (GET /api/dashboard/inventory-stats) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/inventory-stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${whToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Warehouse: BLOCKED from Financial Stats (GET /api/sales/stats) -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/sales/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${whToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Warehouse: BLOCKED from User Management (GET /api/users) -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${whToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 5. Accounts Role
  let accToken;
  await test('Accounts Login (accounts@pos.com)', async () => {
    accToken = await login('accounts@pos.com', 'accounts123');
  });

  await test('Accounts: View Invoices (GET /api/invoices) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/invoices',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Accounts: View Financial Sales (GET /api/sales) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/sales',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Accounts: BLOCKED from Creating Category (POST /api/categories) -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/categories',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accToken}`,
        'Content-Type': 'application/json'
      }
    }, { categoryName: 'Test Category' });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('Accounts: BLOCKED from User Management (GET /api/users) -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 6. Legacy POS User Compatibility (manager role)
  let posToken;
  await test('Legacy POS Store Login (manager@pos.com)', async () => {
    posToken = await login('manager@pos.com', 'manager123');
  });

  await test('Legacy POS: Access Store POS Sales (GET /api/sales?storeId=STORE0001) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/sales?storeId=STORE0001',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${posToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Legacy POS: Access Store Orders (GET /api/orders/my) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/orders/my',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${posToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Legacy POS: BLOCKED from Org User Management (GET /api/users) -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${posToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  console.log(`\n=== RBAC TEST MATRIX RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runRbacTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
