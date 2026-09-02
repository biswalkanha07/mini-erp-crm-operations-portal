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

async function runTests() {
  console.log('=== RUNNING COMPLETE API REGRESSION TESTS (PostgreSQL / Neon + RBAC) ===\n');
  let passed = 0;
  let failed = 0;
  let authToken = null;

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

  // 1. Health check (Public)
  await test('GET /api/health (Dual DB Status)', async () => {
    const res = await request({ port: 5050, path: '/api/health', method: 'GET' });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.databases?.postgres?.status !== 'connected') throw new Error('Postgres not connected');
  });

  // 2. Authentication Login against PostgreSQL
  await test('POST /api/auth/login (PostgreSQL Authentication)', async () => {
    const res = await request({
      port: 5050,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@pos.com', password: 'admin123' });

    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.data?.token) throw new Error('No JWT token returned');
    authToken = res.body.data.token;
    if (res.body.data?.user?.email !== 'admin@pos.com') throw new Error('Unexpected user returned');
  });

  const authHeader = () => ({ 'Authorization': `Bearer ${authToken}` });

  // 3. Organizations
  await test('GET /api/organizations', async () => {
    const res = await request({ port: 5050, path: '/api/organizations', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length < 2) throw new Error(`Expected at least 2 orgs, got ${res.body?.length}`);
  });

  // 4. Stores
  await test('GET /api/stores', async () => {
    const res = await request({ port: 5050, path: '/api/stores', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length < 5) throw new Error(`Expected 5 stores, got ${res.body?.length}`);
  });

  // 5. Categories
  await test('GET /api/categories', async () => {
    const res = await request({ port: 5050, path: '/api/categories', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length !== 7) throw new Error(`Expected 7 categories, got ${res.body?.length}`);
  });

  // 6. Products / Catalogues
  await test('GET /api/catalogues', async () => {
    const res = await request({ port: 5050, path: '/api/catalogues', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length < 10) throw new Error(`Expected at least 10 products, got ${res.body?.length}`);
  });

  // 7. Products Search
  await test('GET /api/catalogues/search?search=Chicken', async () => {
    const res = await request({ port: 5050, path: '/api/catalogues/search?search=Chicken', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.success || !Array.isArray(res.body.data)) throw new Error('Search failed');
  });

  // 8. Store Prices
  await test('GET /api/store-prices/STORE0001', async () => {
    const res = await request({ port: 5050, path: '/api/store-prices/STORE0001', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array of prices');
  });

  // 9. Promo Codes
  await test('GET /api/promo-codes', async () => {
    const res = await request({ port: 5050, path: '/api/promo-codes', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array of promo codes');
  });

  // 10. Sales Query
  await test('GET /api/sales?storeId=STORE0001', async () => {
    const res = await request({ port: 5050, path: '/api/sales?storeId=STORE0001', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array of sales');
  });

  // 11. Invoices Query
  await test('GET /api/invoices', async () => {
    const res = await request({ port: 5050, path: '/api/invoices', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length < 89) throw new Error(`Expected at least 89 invoices, got ${res.body?.length}`);
  });

  // 12. Dashboard Stats
  await test('GET /api/dashboard/stats', async () => {
    const res = await request({ port: 5050, path: '/api/dashboard/stats', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body.totalCustomers !== 'number') throw new Error('Missing totalCustomers in stats');
  });

  // 13. Dashboard Sales by Store
  await test('GET /api/dashboard/sales-by-store', async () => {
    const res = await request({ port: 5050, path: '/api/dashboard/sales-by-store', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array of store sales');
  });

  // 14. Store Dashboard Stats
  await test('GET /api/stores/STORE0001/dashboard/stats', async () => {
    const res = await request({ port: 5050, path: '/api/stores/STORE0001/dashboard/stats', method: 'GET', headers: authHeader() });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body.totalCustomers !== 'number') throw new Error('Missing store stats');
  });

  // 15. Protected Customer Reports with JWT Bearer Token
  await test('GET /api/reports/customers/STORE0001 (Authenticated)', async () => {
    const res = await request({
      port: 5050,
      path: '/api/reports/customers/STORE0001',
      method: 'GET',
      headers: authHeader()
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    if (typeof res.body.totalCustomers !== 'number') throw new Error('Missing customer reports data');
  });

  // 16. Create POS Transaction (write test to verify transactional inserts to PostgreSQL)
  let createdTxnId = null;
  await test('POST /api/sales/transaction (Transactional Write to PostgreSQL)', async () => {
    const txnData = {
      storeId: 'STORE0001',
      paymentMethod: 'cash',
      customerDetails: {
        name: 'Verification Customer',
        phone: '+919876543210',
        email: 'verify@pos.local'
      },
      items: [
        {
          sku: 'SKU003',
          quantity: 1,
          discount: 0
        }
      ]
    };
    const res = await request({
      port: 5050,
      path: '/api/sales/transaction',
      method: 'POST',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json'
      }
    }, txnData);

    if (res.status !== 201) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.transactionId) throw new Error('Missing transactionId in response');
    createdTxnId = res.body.transactionId;
  });

  // 17. Verify newly created transaction can be retrieved
  await test('GET /api/sales/transaction/:id (Verify Created Record)', async () => {
    if (!createdTxnId) throw new Error('No transaction ID to verify');
    const res = await request({
      port: 5050,
      path: `/api/sales/transaction/${createdTxnId}`,
      method: 'GET',
      headers: authHeader()
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.transactionId !== createdTxnId) throw new Error('Transaction ID mismatch');
  });

  console.log(`\n=== FINAL RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
