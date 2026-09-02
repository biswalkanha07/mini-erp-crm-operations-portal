require('dotenv').config();
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

async function testAllFourUsers() {
  console.log('=== VERIFYING 4 TEST ACCOUNTS UNDER ADMIN (ORG001) ===\n');

  const users = [
    { email: 'admin@test.com', expectedRole: 'Admin' },
    { email: 'sales@test.com', expectedRole: 'Sales' },
    { email: 'warehouse@test.com', expectedRole: 'Warehouse' },
    { email: 'accounts@test.com', expectedRole: 'Accounts' }
  ];

  let adminToken = null;

  for (const u of users) {
    const res = await post('/api/auth/login', {
      email: u.email,
      password: 'password123'
    });

    if (res.status !== 200 || !res.body?.data?.token) {
      throw new Error(`Login failed for ${u.email}: status ${res.status}, body: ${JSON.stringify(res.body)}`);
    }

    const role = res.body.data.user.role;
    const orgId = res.body.data.user.organizationId;
    console.log(`✅ Login Success: ${u.email} -> Role: "${role}", Org: "${orgId}"`);

    if (role.toLowerCase() !== u.expectedRole.toLowerCase()) {
      throw new Error(`Role mismatch for ${u.email}: expected ${u.expectedRole}, got ${role}`);
    }
    if (orgId !== 'ORG001') {
      throw new Error(`Org mismatch for ${u.email}: expected ORG001, got ${orgId}`);
    }

    if (u.email === 'admin@test.com') {
      adminToken = res.body.data.token;
    }
  }

  // Verify Admin sees all 4 users under ORG001 in User Management
  const usersRes = await get('/api/users', adminToken);
  if (usersRes.status !== 200 || !Array.isArray(usersRes.body)) {
    throw new Error(`Failed fetching users list for Admin: status ${usersRes.status}`);
  }

  console.log(`\nAdmin fetched ${usersRes.body.length} users in organization ORG001.`);
  for (const u of users) {
    const found = usersRes.body.find(x => x.email.toLowerCase() === u.email.toLowerCase());
    if (!found) {
      throw new Error(`User ${u.email} was NOT found in Admin's user management list!`);
    }
    console.log(`  - Found under Admin: ${found.name} (${found.email}) [Role: ${found.role}]`);
  }

  console.log('\n🎉 ALL 4 TEST USERS VERIFIED SUCCESSFULLY UNDER ADMIN!');
  process.exit(0);
}

testAllFourUsers().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
