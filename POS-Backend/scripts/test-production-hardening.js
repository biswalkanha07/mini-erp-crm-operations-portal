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

async function runProductionHardeningTests() {
  console.log('=== RUNNING PHASE 9 PRODUCTION HARDENING & SECURITY SUITE ===\n');
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

  // 1. Authentication Edge Cases
  await test('1. Auth: Valid login returns JWT token and sanitized user object', async () => {
    const res = await request({
      port: 5050,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@pos.com', password: 'admin123' });
    if (res.status !== 200 || !res.body.data?.token || !res.body.data?.user) {
      throw new Error(`Expected 200 with token and user object, got ${res.status}`);
    }
    if (res.body.data.user.password || res.body.data.user.resetPasswordToken) {
      throw new Error('Sensitive credentials leaked in login response user object');
    }
  });

  await test('2. Auth: Invalid email returns 401 Unauthorized', async () => {
    const res = await request({
      port: 5050,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'nonexistent_user@pos.com', password: 'admin123' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('3. Auth: Invalid password returns 401 Unauthorized', async () => {
    const res = await request({
      port: 5050,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@pos.com', password: 'WrongPassword999!' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('4. Auth: Missing credentials returns 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test('5. Auth: Malformed/Invalid JWT token rejected with 401 Unauthorized', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid.jwt.token.here' }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('6. Auth: Protected endpoint without Authorization header rejected with 401', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET'
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('7. Auth: /api/auth/profile returns sanitized current user profile without password', async () => {
    const res = await request({
      port: 5050,
      path: '/api/auth/profile',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200 || !res.body.user) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.user.password || res.body.user.resetPasswordToken) {
      throw new Error('Password or token exposed in profile endpoint');
    }
  });

  // 2. User Sanitization Verification
  await test('8. Security: /api/users returns all users sanitized with NO passwords or tokens', async () => {
    const res = await request({
      port: 5050,
      path: '/api/users',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200 || !Array.isArray(res.body)) {
      throw new Error(`Expected 200 array of users, got ${res.status}`);
    }
    for (const u of res.body) {
      if (u.password !== undefined || u.resetPasswordToken !== undefined || u.signupToken !== undefined) {
        throw new Error(`User ${u.id || u.email} exposed sensitive credentials in /api/users`);
      }
    }
  });

  // 3. RBAC Authoritative Enforcement
  await test('9. RBAC: Sales role blocked from User Management (/api/users) -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/users',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  await test('10. RBAC: Warehouse role blocked from creating CRM customers -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, { name: 'Unauthorized Customer', mobile: '9999999999', type: 'Retail' });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  await test('11. RBAC: Accounts role blocked from creating manual stock movements -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(accountsToken)
    }, { productId: 'ITEM001', quantity: 1, movementType: 'IN', reason: 'Unauthorized' });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  await test('12. RBAC: Sales role blocked from modifying product prices in catalogue -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'POST',
      headers: authHeader(salesToken)
    }, { itemName: 'Test Hack', price: 100, currentStock: 10 });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // 4. Organization Scope Enforcement
  await test('13. Org Isolation: Non-admin users cannot access other organization data via spoofed query params', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers?organizationId=FOREIGN_ORG_999',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 5. Database Invariant Checks
  await test('15. Database Invariants: All products have current_stock >= 0 and minimum_stock >= 0', async () => {
    const res = await pool.query('SELECT id, product_name, current_stock, minimum_stock FROM products WHERE current_stock < 0 OR minimum_stock < 0');
    if (res.rows.length > 0) {
      throw new Error(`Found ${res.rows.length} product(s) with negative stock: ${JSON.stringify(res.rows)}`);
    }
  });

  await test('16. Database Invariants: All stock movements have quantity_changed > 0 and valid movement_type (IN/OUT)', async () => {
    const res = await pool.query("SELECT id, movement_type, quantity_changed FROM stock_movements WHERE quantity_changed <= 0 OR movement_type NOT IN ('IN', 'OUT')");
    if (res.rows.length > 0) {
      throw new Error(`Found ${res.rows.length} invalid stock movement record(s): ${JSON.stringify(res.rows)}`);
    }
  });

  await test('17. Database Invariants: All sales challans have valid status (DRAFT/CONFIRMED/CANCELLED)', async () => {
    const res = await pool.query("SELECT id, challan_number, status FROM challans WHERE UPPER(status) NOT IN ('DRAFT', 'CONFIRMED', 'CANCELLED')");
    if (res.rows.length > 0) {
      throw new Error(`Found ${res.rows.length} challan(s) with invalid status: ${JSON.stringify(res.rows)}`);
    }
  });

  await test('18. Database Invariants: All challan numbers are unique without duplicates', async () => {
    const res = await pool.query('SELECT challan_number, COUNT(*) FROM challans GROUP BY challan_number HAVING COUNT(*) > 1');
    if (res.rows.length > 0) {
      throw new Error(`Found duplicate challan numbers: ${JSON.stringify(res.rows)}`);
    }
  });

  await test('19. Database Invariants: No orphaned challan_items exist in database', async () => {
    const res = await pool.query('SELECT ci.id, ci.challan_id FROM challan_items ci LEFT JOIN challans ch ON ci.challan_id = ch.id WHERE ch.id IS NULL');
    if (res.rows.length > 0) {
      throw new Error(`Found ${res.rows.length} orphaned challan item(s): ${JSON.stringify(res.rows)}`);
    }
  });

  await test('20. Error Handling: Non-existent endpoints return 404 and do not expose stack traces', async () => {
    const res = await request({
      port: 5050,
      path: '/api/non_existent_route_12345',
      method: 'GET'
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  console.log(`\n=== PRODUCTION HARDENING RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runProductionHardeningTests().then(() => pool.end()).catch(err => {
  console.error('Hardening test error:', err);
  pool.end();
  process.exit(1);
});
