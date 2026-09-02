/**
 * test-auth-user-mgmt.js
 * Verification suite for Login + Admin User Management + RBAC Polish
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:5050/api';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log('====================================================');
  console.log('🧪 RUNNING AUTH + USER MANAGEMENT VERIFICATION SUITE');
  console.log('====================================================\n');

  let adminToken = '';
  let salesToken = '';
  let warehouseToken = '';
  let accountsToken = '';
  let managerToken = '';

  // 1. Single Common Login for all roles
  console.log('--- 1. SINGLE COMMON LOGIN VIA POST /api/auth/login ---');
  try {
    const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@pos.com',
      password: 'admin123'
    });
    assert(adminRes.status === 200, 'Admin login succeeded via common login endpoint');
    assert(adminRes.data.data.token, 'Admin JWT token returned');
    assert(adminRes.data.data.user.role.toLowerCase() === 'admin', 'Admin role returned correctly');
    assert(!adminRes.data.data.user.password, 'Admin password is not returned in login response');
    adminToken = adminRes.data.data.token;
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  try {
    const salesRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'sales@pos.com',
      password: 'sales123'
    });
    assert(salesRes.status === 200, 'Sales login succeeded via common login endpoint');
    assert(salesRes.data.data.user.role.toLowerCase() === 'sales', 'Sales role returned correctly');
    salesToken = salesRes.data.data.token;
  } catch (err) {
    assert(false, `Sales login failed: ${err.message}`);
  }

  try {
    const whRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'warehouse@pos.com',
      password: 'warehouse123'
    });
    assert(whRes.status === 200, 'Warehouse login succeeded via common login endpoint');
    assert(whRes.data.data.user.role.toLowerCase() === 'warehouse', 'Warehouse role returned correctly');
    warehouseToken = whRes.data.data.token;
  } catch (err) {
    assert(false, `Warehouse login failed: ${err.message}`);
  }

  try {
    const accRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'accounts@pos.com',
      password: 'accounts123'
    });
    assert(accRes.status === 200, 'Accounts login succeeded via common login endpoint');
    assert(accRes.data.data.user.role.toLowerCase() === 'accounts', 'Accounts role returned correctly');
    accountsToken = accRes.data.data.token;
  } catch (err) {
    assert(false, `Accounts login failed: ${err.message}`);
  }

  try {
    const mgrRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@pos.com',
      password: 'manager123'
    });
    assert(mgrRes.status === 200, 'Legacy POS manager login succeeded via common login endpoint');
    assert(mgrRes.data.data.user.role.toLowerCase() === 'manager', 'Manager role returned correctly');
    managerToken = mgrRes.data.data.token;
  } catch (err) {
    assert(false, `Manager login failed: ${err.message}`);
  }

  // 2. Admin User Management CRUD & Security
  console.log('\n--- 2. ADMIN USER MANAGEMENT CRUD & SECURITY ---');
  let createdUserId = '';
  const testUserEmail = `employee_test_${Date.now()}@pos.com`;
  const testUserPassword = 'TestPassword#123';

  // 2a. Admin fetches user list
  try {
    const listRes = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listRes.status === 200, 'Admin can fetch organizational users list');
    assert(Array.isArray(listRes.data), 'User list is an array');
    assert(listRes.data.every(u => !u.password), 'Zero passwords/hashes exposed in user list');
  } catch (err) {
    assert(false, `Failed to fetch users: ${err.message}`);
  }

  // 2b. Admin creates a new user
  try {
    const createRes = await axios.post(
      `${BASE_URL}/users`,
      {
        name: 'Verification Employee',
        email: testUserEmail,
        password: testUserPassword,
        role: 'Sales'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(createRes.status === 201, 'Admin created new user with role Sales');
    assert(createRes.data.email === testUserEmail, 'Created user has matching email');
    assert(createRes.data.role === 'Sales', 'Created user has assigned role Sales');
    assert(!createRes.data.password, 'Created user response does NOT expose password');
    assert(createRes.data.organizationId === 'ORG001', 'Organization ID derived from Admin token (ORG001)');
    createdUserId = createRes.data.id || createRes.data._id;
  } catch (err) {
    assert(false, `User creation failed: ${err.message}`);
  }

  // 2c. Newly created user logs in via common login endpoint
  try {
    const newLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUserEmail,
      password: testUserPassword
    });
    assert(newLoginRes.status === 200, 'Newly created user successfully logs in with temporary password');
    assert(newLoginRes.data.data.user.role === 'Sales', 'Newly created user role is Sales in JWT/response');
  } catch (err) {
    assert(false, `Newly created user login failed: ${err.message}`);
  }

  // 2d. Duplicate email rejected with 409 Conflict
  try {
    await axios.post(
      `${BASE_URL}/users`,
      {
        name: 'Duplicate Employee',
        email: testUserEmail,
        password: 'AnotherPassword123',
        role: 'Warehouse'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(false, 'Duplicate email should have been rejected');
  } catch (err) {
    assert(err.response?.status === 409, `Duplicate email rejected with HTTP 409 Conflict (got ${err.response?.status})`);
  }

  // 2e. Non-admin blocked from creating users (403 Forbidden)
  try {
    await axios.post(
      `${BASE_URL}/users`,
      {
        name: 'Illegal User',
        email: `illegal_${Date.now()}@pos.com`,
        password: 'Password123',
        role: 'Admin'
      },
      { headers: { Authorization: `Bearer ${salesToken}` } }
    );
    assert(false, 'Sales user should NOT be allowed to create users');
  } catch (err) {
    assert(err.response?.status === 403, `Sales user blocked from POST /api/users with HTTP 403 Forbidden (got ${err.response?.status})`);
  }

  // 2f. Admin updates user details and deactivates
  if (createdUserId) {
    try {
      const updateRes = await axios.put(
        `${BASE_URL}/users/${createdUserId}`,
        {
          name: 'Updated Employee Name',
          role: 'Accounts'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(updateRes.status === 200, 'Admin updated user name and role to Accounts');
      assert(updateRes.data.name === 'Updated Employee Name', 'User name updated successfully');
      assert(updateRes.data.role === 'Accounts', 'User role updated successfully');
    } catch (err) {
      assert(false, `User update failed: ${err.message}`);
    }

    try {
      const delRes = await axios.delete(
        `${BASE_URL}/users/${createdUserId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assert(delRes.status === 200, 'Admin successfully deactivated user');
    } catch (err) {
      assert(false, `User deactivation failed: ${err.message}`);
    }
  }

  // 3. Initial Admin Registration Endpoint
  console.log('\n--- 3. INITIAL ADMIN REGISTRATION (POST /api/auth/register-admin) ---');
  const initialAdminEmail = `initial_admin_${Date.now()}@apexdist.com`;
  const initialAdminPassword = 'AdminPassword#123';

  try {
    const regRes = await axios.post(`${BASE_URL}/auth/register-admin`, {
      name: 'Initial Super Administrator',
      organizationName: 'Apex Wholesale Distribution Ltd',
      email: initialAdminEmail,
      password: initialAdminPassword
    });
    assert(regRes.status === 201, 'Initial Admin registered via POST /api/auth/register-admin');
    assert(regRes.data.data.user.role.toLowerCase() === 'admin', 'Registered user has role admin');
    assert(!regRes.data.data.user.password, 'Registered user response does NOT expose password');
  } catch (err) {
    assert(false, `Initial admin registration failed: ${err.message}`);
  }

  // Verify newly registered admin can log in
  try {
    const regLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: initialAdminEmail,
      password: initialAdminPassword
    });
    assert(regLoginRes.status === 200, 'Newly registered Initial Admin can log in via POST /api/auth/login');
    assert(regLoginRes.data.data.user.role.toLowerCase() === 'admin', 'Role is admin in login response');
  } catch (err) {
    assert(false, `Newly registered admin login failed: ${err.message}`);
  }

  // Duplicate email registration should return 409
  try {
    await axios.post(`${BASE_URL}/auth/register-admin`, {
      name: 'Duplicate Admin',
      organizationName: 'Another Org',
      email: initialAdminEmail,
      password: 'AnotherPassword123'
    });
    assert(false, 'Duplicate admin registration should fail');
  } catch (err) {
    assert(err.response?.status === 409, `Duplicate admin registration rejected with HTTP 409 Conflict (got ${err.response?.status})`);
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error in verification suite:', err);
  process.exit(1);
});

