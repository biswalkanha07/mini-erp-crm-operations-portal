const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch (_) {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: path,
      method: 'GET',
      headers
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch (_) {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testFrontendAuth() {
  console.log('=== VERIFYING FRONTEND AUTH FLOWS & ROLE PAYLOADS ===\n');
  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name} ->`, e.message);
      failed++;
    }
  }

  // 1. Admin Organization Login (as used in LoginSelector.tsx)
  let adminToken;
  await check('Frontend Org Login: Admin (admin@pos.com)', async () => {
    const res = await post('/api/auth/organization/login', {
      organizationId: 'ORG001',
      email: 'admin@pos.com',
      password: 'admin123'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.token) throw new Error('No token returned');
    if (res.body.user.role.toLowerCase() !== 'admin') throw new Error(`Expected role admin, got ${res.body.user.role}`);
    if (res.body.user.userType !== 'organization') throw new Error(`Expected userType organization`);
    adminToken = res.body.token;
  });

  // 2. Sales Organization Login
  let salesToken;
  await check('Frontend Org Login: Sales (sales@pos.com)', async () => {
    const res = await post('/api/auth/organization/login', {
      organizationId: 'ORG001',
      email: 'sales@pos.com',
      password: 'sales123'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.token) throw new Error('No token returned');
    if (res.body.user.role !== 'Sales') throw new Error(`Expected role Sales, got ${res.body.user.role}`);
    salesToken = res.body.token;
  });

  // 3. Warehouse Organization Login
  let whToken;
  await check('Frontend Org Login: Warehouse (warehouse@pos.com)', async () => {
    const res = await post('/api/auth/organization/login', {
      organizationId: 'ORG001',
      email: 'warehouse@pos.com',
      password: 'warehouse123'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.token) throw new Error('No token returned');
    if (res.body.user.role !== 'Warehouse') throw new Error(`Expected role Warehouse, got ${res.body.user.role}`);
    whToken = res.body.token;
  });

  // 4. Accounts Organization Login
  let accToken;
  await check('Frontend Org Login: Accounts (accounts@pos.com)', async () => {
    const res = await post('/api/auth/organization/login', {
      organizationId: 'ORG001',
      email: 'accounts@pos.com',
      password: 'accounts123'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.token) throw new Error('No token returned');
    if (res.body.user.role !== 'Accounts') throw new Error(`Expected role Accounts, got ${res.body.user.role}`);
    accToken = res.body.token;
  });

  // 5. Store Manager Login (as used in LoginSelector.tsx fallback)
  await check('Frontend Store Login: Manager (manager@pos.com)', async () => {
    const res = await post('/api/auth/store/login', {
      storeId: 'STORE0001',
      email: 'manager@pos.com',
      password: 'manager123'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (!res.body.token) throw new Error('No token returned');
    if (res.body.user.role !== 'manager') throw new Error(`Expected role manager, got ${res.body.user.role}`);
    if (res.body.user.userType !== 'store') throw new Error(`Expected userType store`);
  });

  // 6. Profile Verification (/api/auth/profile) for each role
  await check('Profile check: Admin', async () => {
    const res = await get('/api/auth/profile', adminToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.user.role.toLowerCase() !== 'admin') throw new Error('Role mismatch');
  });

  await check('Profile check: Sales', async () => {
    const res = await get('/api/auth/profile', salesToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.user.role !== 'Sales') throw new Error('Role mismatch');
  });

  await check('Profile check: Warehouse', async () => {
    const res = await get('/api/auth/profile', whToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.user.role !== 'Warehouse') throw new Error('Role mismatch');
  });

  await check('Profile check: Accounts', async () => {
    const res = await get('/api/auth/profile', accToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.user.role !== 'Accounts') throw new Error('Role mismatch');
  });

  console.log(`\n=== FRONTEND AUTH TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

testFrontendAuth().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
