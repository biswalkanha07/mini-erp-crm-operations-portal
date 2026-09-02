require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../db/index');

async function seedAdminTestUser() {
  console.log('Seeding hardcoded Admin test account (admin@test.com)...');

  const passwordPlain = 'password123';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  const email = 'admin@test.com';
  const id = 'USER_ADMIN_TEST';
  const role = 'admin';
  const userType = 'organization';
  const organizationId = 'ORG001';
  const name = 'Admin Test';

  const permissions = [
    { module: 'organization', actions: ['read', 'write', 'delete', 'manage'] },
    { module: 'store', actions: ['read', 'write', 'delete', 'manage'] },
    { module: 'inventory', actions: ['read', 'write', 'delete', 'manage'] },
    { module: 'pos', actions: ['read', 'write'] },
    { module: 'reports', actions: ['read', 'write'] },
    { module: 'users', actions: ['read', 'write', 'delete', 'manage'] },
    { module: 'sales', actions: ['read', 'write', 'delete', 'manage'] },
    { module: 'crm', actions: ['read', 'write', 'delete', 'manage'] }
  ];

  const sql = `
    INSERT INTO users (
      id, user_id, name, email, password, role, user_type,
      organization_id, store_id, permissions, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO UPDATE SET
      password = EXCLUDED.password,
      role = 'admin',
      user_type = 'organization',
      organization_id = EXCLUDED.organization_id,
      permissions = EXCLUDED.permissions,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, name, email, role, user_type, organization_id, status
  `;

  const res = await query(sql, [
    id, id, name, email, passwordHash, role, userType, organizationId, JSON.stringify(permissions)
  ]);

  console.log('Successfully seeded admin test user:', res.rows[0]);
  process.exit(0);
}

seedAdminTestUser().catch(err => {
  console.error('Failed seeding admin test user:', err);
  process.exit(1);
});
