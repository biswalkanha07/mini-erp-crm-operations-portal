require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../db/index');

async function seedTestUsers() {
  console.log('Seeding Phase 3 ERP Operational & POS Compatibility Test Accounts...');

  const testUsers = [
    {
      id: 'USER_SALES_001',
      userId: 'USER_SALES_001',
      name: 'Sales Representative',
      email: 'sales@pos.com',
      passwordPlain: 'sales123',
      role: 'Sales',
      userType: 'organization',
      organizationId: 'ORG001',
      storeId: null
    },
    {
      id: 'USER_WH_001',
      userId: 'USER_WH_001',
      name: 'Warehouse Officer',
      email: 'warehouse@pos.com',
      passwordPlain: 'warehouse123',
      role: 'Warehouse',
      userType: 'organization',
      organizationId: 'ORG001',
      storeId: null
    },
    {
      id: 'USER_ACC_001',
      userId: 'USER_ACC_001',
      name: 'Accounts Executive',
      email: 'accounts@pos.com',
      passwordPlain: 'accounts123',
      role: 'Accounts',
      userType: 'organization',
      organizationId: 'ORG001',
      storeId: null
    },
    {
      id: 'USER_MGR_001',
      userId: 'USER_MGR_001',
      name: 'Store Manager Test',
      email: 'manager@pos.com',
      passwordPlain: 'manager123',
      role: 'manager',
      userType: 'store',
      organizationId: 'ORG001',
      storeId: 'STORE0001'
    }
  ];

  for (const u of testUsers) {
    const passwordHash = await bcrypt.hash(u.passwordPlain, 10);
    const sql = `
      INSERT INTO users (
        id, user_id, name, email, password, role, user_type,
        organization_id, store_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        password = EXCLUDED.password,
        status = 'active',
        store_id = EXCLUDED.store_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, email, role, status
    `;
    const res = await query(sql, [
      u.id, u.userId, u.name, u.email, passwordHash, u.role, u.userType, u.organizationId, u.storeId
    ]);
    console.log(`Seeded test user: ${res.rows[0].email} (Role: ${res.rows[0].role})`);
  }

  console.log('Seeding completed.');
  process.exit(0);
}

seedTestUsers().catch(err => {
  console.error('Failed seeding test users:', err);
  process.exit(1);
});
