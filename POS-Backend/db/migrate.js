require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function runMigration() {
  console.log('[Migration] Starting PostgreSQL / Neon schema migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('[Migration] ERROR: DATABASE_URL is not configured.');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`[Migration] ERROR: schema.sql not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('[Migration] Connected to database. Executing schema DDL...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[Migration] Schema executed successfully.');

    // Verify all 8 tables exist
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const expectedTables = [
      'categories',
      'challan_items',
      'challans',
      'customer_followups',
      'customers',
      'products',
      'stock_movements',
      'users'
    ];

    const existingTables = res.rows.map(r => r.table_name);
    console.log('[Migration] Verified tables in public schema:', existingTables.join(', '));

    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
      throw new Error(`Missing expected tables after migration: ${missingTables.join(', ')}`);
    }

    console.log('[Migration] All 8 ERP PostgreSQL tables successfully created and verified.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Migration] Migration FAILED:', err.message || 'Database error occurred');
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();
