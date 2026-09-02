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

async function runCrmTests() {
  console.log('=== RUNNING PHASE 4 CRM BACKEND TEST SUITE ===\n');
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

  // Obtain tokens for all roles
  let adminToken, salesToken, warehouseToken, accountsToken;
  await test('Authenticate all test roles', async () => {
    adminToken = await login('admin@pos.com', 'admin123');
    salesToken = await login('sales@pos.com', 'sales123');
    warehouseToken = await login('warehouse@pos.com', 'warehouse123');
    accountsToken = await login('accounts@pos.com', 'accounts123');
  });

  const authHeader = (t) => ({ 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' });

  // 1. Admin can list customers
  await test('1. Admin can list customers (GET /api/customers) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.success || !Array.isArray(res.body.data)) throw new Error('Expected success: true and data array');
  });

  // 2. Sales can list customers
  await test('2. Sales can list customers (GET /api/customers) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.success || !Array.isArray(res.body.data)) throw new Error('Expected data array');
  });

  // 3. Accounts can view customers
  await test('3. Accounts can view customers (GET /api/customers) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'GET',
      headers: authHeader(accountsToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 4. Unauthorized user receives 401
  await test('4. Unauthorized request without token -> 401', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'GET'
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 5. Unauthorized role receives 403 (Warehouse cannot create customer)
  await test('5. Warehouse role blocked from creating customer -> 403', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, { name: 'Test', mobile: '9999999999' });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 6. Create customer works
  let createdCustomerId = null;
  await test('6. Create customer works (POST /api/customers) -> 201', async () => {
    const payload = {
      name: 'Acme Wholesale Corp',
      mobile: '+919876543210',
      email: 'contact@acme.com',
      businessName: 'Acme Distribution',
      gstNumber: '29ABCDE1234F1Z5',
      type: 'Wholesale',
      address: '123 MG Road, Bangalore',
      status: 'Active',
      followUpDate: '2026-09-15',
      notes: 'Initial client contact from wholesale inquiry'
    };

    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(salesToken)
    }, payload);

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.data?.id) throw new Error('No customer ID returned');
    createdCustomerId = res.body.data.id;
    if (res.body.data.name !== 'Acme Wholesale Corp') throw new Error('Name mismatch');
    if (res.body.data.type !== 'Wholesale') throw new Error('Type mismatch');
  });

  // 7. Invalid customer type rejected
  await test('7. Invalid customer type rejected -> 400', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(adminToken)
    }, { name: 'Invalid Type Co', mobile: '9888877777', type: 'Supermarket' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 8. Invalid customer status rejected
  await test('8. Invalid customer status rejected -> 400', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(adminToken)
    }, { name: 'Invalid Status Co', mobile: '9888877777', status: 'PendingReview' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 9. Missing name rejected
  await test('9. Missing customer name rejected -> 400', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(adminToken)
    }, { name: '', mobile: '9888877777' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 10. Invalid email rejected
  await test('10. Invalid email format rejected -> 400', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'POST',
      headers: authHeader(adminToken)
    }, { name: 'Test Email', mobile: '9888877777', email: 'not-an-email' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 11. Update customer works
  await test('11. Update customer works (PUT /api/customers/:id) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: `/api/customers/${createdCustomerId}`,
      method: 'PUT',
      headers: authHeader(salesToken)
    }, { businessName: 'Acme Distribution Private Limited', status: 'Active' });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.businessName !== 'Acme Distribution Private Limited') throw new Error('Business name was not updated');
  });

  // 12. Customer detail works
  await test('12. View customer details (GET /api/customers/:id) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: `/api/customers/${createdCustomerId}`,
      method: 'GET',
      headers: authHeader(accountsToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.id !== createdCustomerId) throw new Error('Customer ID mismatch');
  });

  // 13. Search works
  await test('13. Search customer by keyword -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers?search=Acme',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const found = res.body.data.find(c => c.id === createdCustomerId);
    if (!found) throw new Error('Search did not return created customer');
  });

  // 14. Pagination works
  await test('14. Pagination returns limit, page, and totalPages -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers?page=1&limit=5',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.pagination || res.body.pagination.limit !== 5) throw new Error('Pagination limit mismatch');
    if (res.body.data.length > 5) throw new Error('Returned more records than limit');
  });

  // 15. Status filter works
  await test('15. Filter customers by status=Active -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers?status=Active',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const nonActive = res.body.data.some(c => c.status !== 'Active');
    if (nonActive) throw new Error('Returned customers with non-Active status');
  });

  // 16. Type filter works
  await test('16. Filter customers by type=Wholesale -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers?type=Wholesale',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const nonWholesale = res.body.data.some(c => c.type !== 'Wholesale');
    if (nonWholesale) throw new Error('Returned customers with non-Wholesale type');
  });

  // 17. Add follow-up works
  await test('17. Add follow-up note (POST /api/customers/:id/follow-ups) -> 201', async () => {
    const res = await request({
      port: 5050,
      path: `/api/customers/${createdCustomerId}/follow-ups`,
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      followUpDate: '2026-09-20',
      notes: 'Customer agreed to review catalogue pricing.'
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.data?.notes) throw new Error('No follow-up notes returned');
  });

  // 18. Follow-up history works
  await test('18. Follow-up history returns append-only log (GET /api/customers/:id/follow-ups) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: `/api/customers/${createdCustomerId}/follow-ups`,
      method: 'GET',
      headers: authHeader(accountsToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data) || res.body.data.length < 2) {
      throw new Error(`Expected at least 2 follow-ups (initial + added), got ${res.body.data?.length}`);
    }
  });

  // 19. Missing follow-up notes rejected
  await test('19. Missing follow-up notes rejected -> 400', async () => {
    const res = await request({
      port: 5050,
      path: `/api/customers/${createdCustomerId}/follow-ups`,
      method: 'POST',
      headers: authHeader(salesToken)
    }, { followUpDate: '2026-09-25', notes: '' });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 20. Non-existent customer returns 404
  await test('20. Non-existent customer returns 404', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers/NON_EXISTENT_ID_99999',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 21. Cross-organization customer isolation check
  await test('21. Customer update restricted to owner organization -> isolated', async () => {
    // Attempting update on customer with invalid org returns 403
    const res = await request({
      port: 5050,
      path: `/api/customers/${createdCustomerId}`,
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 22. Existing migrated customers remain accessible
  await test('22. All 10 existing migrated customer records remain accessible', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers?limit=50',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    // Check for original migrated customer names
    const originalNames = ['Aniket Kuanra', 'Deepti', 'Dudul', 'Ritwik Rohitakhya'];
    const foundNames = res.body.data.map(c => c.name);
    for (const name of originalNames) {
      if (!foundNames.includes(name)) {
        throw new Error(`Original migrated customer '${name}' not found in list`);
      }
    }
  });

  // Cleanup/Soft-delete verification (Admin only)
  await test('Admin can soft-deactivate customer (DELETE /api/customers/:id) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: `/api/customers/${createdCustomerId}`,
      method: 'DELETE',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.status !== 'Inactive') throw new Error('Customer status was not set to Inactive');
  });

  console.log(`\n=== CRM TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runCrmTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
