require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../db/index');

async function seedFourTestUsers() {
  console.log('Seeding 4 Role-Based Test Accounts under Admin organization (ORG001)...');

  const testAccounts = [
    {
      id: 'USER_ADMIN_TEST',
      userId: 'USER_ADMIN_TEST',
      name: 'Super Admin',
      email: 'admin@test.com',
      passwordPlain: 'password123',
      role: 'Admin',
      userType: 'organization',
      organizationId: 'ORG001',
      permissions: [
        { module: 'organization', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'store', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'inventory', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'pos', actions: ['read', 'write'] },
        { module: 'reports', actions: ['read', 'write'] },
        { module: 'users', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'sales', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'crm', actions: ['read', 'write', 'delete', 'manage'] }
      ]
    },
    {
      id: 'USER_SALES_TEST',
      userId: 'USER_SALES_TEST',
      name: 'Sales Representative',
      email: 'sales@test.com',
      passwordPlain: 'password123',
      role: 'Sales',
      userType: 'organization',
      organizationId: 'ORG001',
      permissions: [
        { module: 'crm', actions: ['read', 'write', 'manage'] },
        { module: 'challans', actions: ['read', 'write'] },
        { module: 'inventory', actions: ['read'] },
        { module: 'pos', actions: ['read', 'write'] }
      ]
    },
    {
      id: 'USER_WAREHOUSE_TEST',
      userId: 'USER_WAREHOUSE_TEST',
      name: 'Warehouse Officer',
      email: 'warehouse@test.com',
      passwordPlain: 'password123',
      role: 'Warehouse',
      userType: 'organization',
      organizationId: 'ORG001',
      permissions: [
        { module: 'inventory', actions: ['read', 'write', 'manage'] },
        { module: 'stock_movements', actions: ['read', 'write', 'manage'] },
        { module: 'challans', actions: ['read', 'write', 'manage'] },
        { module: 'products', actions: ['read', 'write', 'manage'] }
      ]
    },
    {
      id: 'USER_ACCOUNTS_TEST',
      userId: 'USER_ACCOUNTS_TEST',
      name: 'Accounts Executive',
      email: 'accounts@test.com',
      passwordPlain: 'password123',
      role: 'Accounts',
      userType: 'organization',
      organizationId: 'ORG001',
      permissions: [
        { module: 'invoices', actions: ['read', 'write', 'manage'] },
        { module: 'reports', actions: ['read', 'write'] },
        { module: 'sales', actions: ['read'] },
        { module: 'challans', actions: ['read'] }
      ]
    }
  ];

  for (const acc of testAccounts) {
    const passwordHash = await bcrypt.hash(acc.passwordPlain, 10);
    const sql = `
      INSERT INTO users (
        id, user_id, name, email, password, role, user_type,
        organization_id, store_id, permissions, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        password = EXCLUDED.password,
        user_type = EXCLUDED.user_type,
        organization_id = EXCLUDED.organization_id,
        permissions = EXCLUDED.permissions,
        status = 'active',
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, email, role, user_type, organization_id, status
    `;

    const res = await query(sql, [
      acc.id, acc.userId, acc.name, acc.email, passwordHash, acc.role, acc.userType, acc.organizationId, JSON.stringify(acc.permissions)
    ]);

    console.log(`Seeded account: ${res.rows[0].email} | Role: ${res.rows[0].role} | Org: ${res.rows[0].organization_id}`);
  }

  console.log('\nAll 4 test accounts seeded successfully under Admin organization ORG001.');
  process.exit(0);
}

seedFourTestUsers().catch(err => {
  console.error('Failed seeding test accounts:', err);
  process.exit(1);
});
