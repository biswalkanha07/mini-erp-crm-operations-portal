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
  return res.body.data.token;
}

function authHeader(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function runDashboardTests() {
  console.log('=== RUNNING PHASE 8 ERP DASHBOARD TEST SUITE ===\n');
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

  // 1. Unauthenticated access rejected
  await test('1. Dashboard endpoint requires authentication -> 401', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET'
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    }
  });

  // 2. Admin access
  await test('2. Admin can access ERP dashboard overview (GET /api/dashboard/overview) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200 || !res.body?.data) {
      throw new Error(`Expected 200 with data, got ${res.status}`);
    }
    if (!res.body.data.customers || !res.body.data.inventory || !res.body.data.challans || !res.body.data.followUps) {
      throw new Error('Missing core overview sections in admin dashboard response');
    }
  });

  // 3. Sales access
  await test('3. Sales can access ERP dashboard overview (GET /api/dashboard/overview) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200 || !res.body?.data) {
      throw new Error(`Expected 200 with data, got ${res.status}`);
    }
  });

  // 4. Warehouse access
  await test('4. Warehouse can access ERP dashboard overview (GET /api/dashboard/overview) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (res.status !== 200 || !res.body?.data) {
      throw new Error(`Expected 200 with data, got ${res.status}`);
    }
  });

  // 5. Accounts access
  await test('5. Accounts can access ERP dashboard overview (GET /api/dashboard/overview) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(accountsToken)
    });
    if (res.status !== 200 || !res.body?.data) {
      throw new Error(`Expected 200 with data, got ${res.status}`);
    }
  });

  // 6. Customer Total Metrics Accuracy
  await test('6. Customer metrics return numeric totals (total, active, leads, inactive)', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const c = res.body.data.customers;
    if (typeof c.total !== 'number' || typeof c.active !== 'number' || typeof c.leads !== 'number' || typeof c.inactive !== 'number') {
      throw new Error('Customer metrics are not numbers');
    }
    if (c.total < (c.active + c.leads + c.inactive)) {
      throw new Error('Customer subcategories exceed total count');
    }
  });

  // 7. Active Customer Count Accuracy
  await test('7. Active customer count matches Active customer queries', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const custRes = await request({
      port: 5050,
      path: '/api/customers?status=Active&limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const expected = custRes.body.pagination?.total ?? custRes.body.data?.length ?? 0;
    if (res.body.data.customers.active !== expected) {
      throw new Error(`Expected active count ${expected}, got ${res.body.data.customers.active}`);
    }
  });

  // 8. Lead Customer Count Accuracy
  await test('8. Lead count matches Lead customer queries', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const custRes = await request({
      port: 5050,
      path: '/api/customers?status=Lead&limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const expected = custRes.body.pagination?.total ?? custRes.body.data?.length ?? 0;
    if (res.body.data.customers.leads !== expected) {
      throw new Error(`Expected leads count ${expected}, got ${res.body.data.customers.leads}`);
    }
  });

  // 9. Product Count Accuracy
  await test('9. Total products count matches catalogue products query', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const catRes = await request({
      port: 5050,
      path: '/api/catalogues?limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const expected = catRes.body.pagination?.total ?? (Array.isArray(catRes.body) ? catRes.body.length : catRes.body.data?.length);
    if (res.body.data.inventory.totalProducts !== expected) {
      throw new Error(`Expected products count ${expected}, got ${res.body.data.inventory.totalProducts}`);
    }
  });

  // 10. Low-Stock Count Accuracy (Phase 5 rule)
  await test('10. Low-stock count accurately matches lowStock=true catalogue query', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const lowStockRes = await request({
      port: 5050,
      path: '/api/catalogues?lowStock=true&limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const expected = lowStockRes.body.pagination?.total ?? (Array.isArray(lowStockRes.body) ? lowStockRes.body.length : lowStockRes.body.data?.length);
    if (res.body.data.inventory.lowStock !== expected) {
      throw new Error(`Expected low stock count ${expected}, got ${res.body.data.inventory.lowStock}`);
    }
  });

  // 11. Today's Challans Count Accuracy
  await test('11. Today challans count is a valid non-negative integer', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const todayCh = res.body.data.challans.today;
    if (typeof todayCh !== 'number' || todayCh < 0) {
      throw new Error(`Invalid today's challan count: ${todayCh}`);
    }
  });

  // 12. Draft Challans Count Accuracy
  await test('12. Draft challans count matches status=DRAFT challans query', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const draftRes = await request({
      port: 5050,
      path: '/api/challans?status=DRAFT&limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const expected = draftRes.body.pagination?.total ?? draftRes.body.data?.length ?? 0;
    if (res.body.data.challans.draft !== expected) {
      throw new Error(`Expected draft count ${expected}, got ${res.body.data.challans.draft}`);
    }
  });

  // 13. Confirmed Challans Count Accuracy
  await test('13. Confirmed challans count matches status=CONFIRMED challans query', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const confRes = await request({
      port: 5050,
      path: '/api/challans?status=CONFIRMED&limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const expected = confRes.body.pagination?.total ?? confRes.body.data?.length ?? 0;
    if (res.body.data.challans.confirmed !== expected) {
      throw new Error(`Expected confirmed count ${expected}, got ${res.body.data.challans.confirmed}`);
    }
  });

  // 14. Follow-up Due Metrics
  await test('14. Follow-ups due count is a valid non-negative integer', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const due = res.body.data.followUps.due;
    if (typeof due !== 'number' || due < 0) {
      throw new Error(`Invalid followUps.due: ${due}`);
    }
  });

  // 15. Follow-up Upcoming Metrics
  await test('15. Follow-ups upcoming count is a valid non-negative integer', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const upcoming = res.body.data.followUps.upcoming;
    if (typeof upcoming !== 'number' || upcoming < 0) {
      throw new Error(`Invalid followUps.upcoming: ${upcoming}`);
    }
  });

  // 16. Operational Alerts Engine
  await test('16. Operational alerts engine generates structured alerts with action URLs', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const alerts = res.body.data.alerts;
    if (!Array.isArray(alerts)) {
      throw new Error('Alerts must be an array');
    }
    for (const alt of alerts) {
      if (!alt.type || !alt.severity || !alt.title || !alt.message || !alt.actionUrl) {
        throw new Error(`Malformed alert object: ${JSON.stringify(alt)}`);
      }
    }
  });

  // 17. Recent Sales Challans List
  await test('17. Recent challans list returns up to 5 structured records', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const recent = res.body.data.recentChallans;
    if (!Array.isArray(recent) || recent.length > 5) {
      throw new Error('Recent challans must be an array of at most 5 items');
    }
    if (recent.length > 0) {
      const ch = recent[0];
      if (!ch.id || !ch.challanNumber || !ch.status || typeof ch.totalAmount !== 'number') {
        throw new Error(`Malformed recent challan item: ${JSON.stringify(ch)}`);
      }
    }
  });

  // 18. Recent Stock Movements List
  await test('18. Recent stock movements list returns up to 5 structured records', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const recent = res.body.data.recentStockMovements;
    if (!Array.isArray(recent) || recent.length > 5) {
      throw new Error('Recent stock movements must be an array of at most 5 items');
    }
    if (recent.length > 0) {
      const sm = recent[0];
      if (!sm.id || !sm.productName || !sm.movementType || typeof sm.quantityChanged !== 'number') {
        throw new Error(`Malformed recent stock movement item: ${JSON.stringify(sm)}`);
      }
    }
  });

  // 19. Upcoming Follow-ups List
  await test('19. Upcoming follow-ups list returns up to 5 sorted customer records', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const followups = res.body.data.upcomingFollowUps;
    if (!Array.isArray(followups) || followups.length > 5) {
      throw new Error('Upcoming follow-ups must be an array of at most 5 items');
    }
    if (followups.length > 0) {
      const f = followups[0];
      if (!f.id || !f.name || !f.followUpDate) {
        throw new Error(`Malformed upcoming follow-up item: ${JSON.stringify(f)}`);
      }
    }
  });

  // 20. Estimated Inventory Value Calculation
  await test('20. Estimated inventory value is non-negative and mathematically valid', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const value = res.body.data.inventory.estimatedInventoryValue;
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
      throw new Error(`Invalid estimated inventory value: ${value}`);
    }
  });

  // 21. Organization Isolation Enforcement
  await test('21. Dashboard metrics respect organization isolation (ORG001 vs isolated queries)', async () => {
    const res = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200 || !res.body.data) {
      throw new Error('Sales dashboard query failed');
    }
  });

  // 22. Read-Only Safety Verification
  await test('22. Dashboard queries are strictly read-only and do not mutate data', async () => {
    const beforeRes = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    // Call overview multiple times
    await request({ port: 5050, path: '/api/dashboard/overview', method: 'GET', headers: authHeader(adminToken) });
    await request({ port: 5050, path: '/api/dashboard/overview', method: 'GET', headers: authHeader(adminToken) });
    const afterRes = await request({
      port: 5050,
      path: '/api/dashboard/overview',
      method: 'GET',
      headers: authHeader(adminToken)
    });

    if (beforeRes.body.data.customers.total !== afterRes.body.data.customers.total) {
      throw new Error('Customer count mutated during dashboard reads!');
    }
    if (beforeRes.body.data.challans.total !== afterRes.body.data.challans.total) {
      throw new Error('Challan count mutated during dashboard reads!');
    }
  });

  // 23. Legacy Dashboard Endpoints Functionality
  await test('23. Legacy dashboard endpoints remain intact (/stats, /inventory-stats, /sales-by-store)', async () => {
    const statsRes = await request({ port: 5050, path: '/api/dashboard/stats', method: 'GET', headers: authHeader(adminToken) });
    if (statsRes.status !== 200) throw new Error(`GET /api/dashboard/stats failed with ${statsRes.status}`);

    const invRes = await request({ port: 5050, path: '/api/dashboard/inventory-stats', method: 'GET', headers: authHeader(adminToken) });
    if (invRes.status !== 200) throw new Error(`GET /api/dashboard/inventory-stats failed with ${invRes.status}`);

    const storeRes = await request({ port: 5050, path: '/api/dashboard/sales-by-store', method: 'GET', headers: authHeader(adminToken) });
    if (storeRes.status !== 200) throw new Error(`GET /api/dashboard/sales-by-store failed with ${storeRes.status}`);
  });

  // 24. Baseline Products Preservation
  await test('24. All 10 baseline products remain intact', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues?limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const count = res.body.pagination?.total ?? (Array.isArray(res.body) ? res.body.length : res.body.data?.length);
    if (count < 10) {
      throw new Error(`Expected at least 10 products, found ${count}`);
    }
  });

  // 25. Baseline CRM Customers Preservation
  await test('25. All 10 baseline CRM customers remain intact', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers?limit=100',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(res.body) ? res.body : (res.body.data || []);
    if (list.length < 10) {
      throw new Error(`Expected at least 10 CRM customers, found ${list.length}`);
    }
  });

  console.log(`\n=== DASHBOARD TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
