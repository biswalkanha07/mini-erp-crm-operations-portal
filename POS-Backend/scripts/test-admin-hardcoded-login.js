require('dotenv').config();
const http = require('http');

// Start backend server in-process if not already running
const app = require('../index');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: process.env.PORT || 5050,
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
      port: process.env.PORT || 5050,
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

async function run() {
  console.log('Testing hardcoded Admin login with admin@test.com / password123...');

  // Wait 1 second for server to bind if needed
  await new Promise(r => setTimeout(r, 1000));

  // 1. Unified login
  const loginRes = await post('/api/auth/login', {
    email: 'admin@test.com',
    password: 'password123'
  });

  console.log('Login response status:', loginRes.status);
  console.log('Login response body:', JSON.stringify(loginRes.body, null, 2));

  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    throw new Error('Unified login failed');
  }

  const token = loginRes.body.data.token;
  const user = loginRes.body.data.user;

  if (user.role.toLowerCase() !== 'admin') {
    throw new Error(`Expected role admin, got ${user.role}`);
  }

  // 2. Test authenticated Admin endpoint (User Management)
  const usersRes = await get('/api/users', token);
  console.log('GET /api/users status:', usersRes.status);
  console.log('Number of users returned:', Array.isArray(usersRes.body) ? usersRes.body.length : 'Not array');

  if (usersRes.status !== 200) {
    throw new Error(`Expected 200 from /api/users, got ${usersRes.status}`);
  }

  console.log('\n✅ Hardcoded Admin credentials verified successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
