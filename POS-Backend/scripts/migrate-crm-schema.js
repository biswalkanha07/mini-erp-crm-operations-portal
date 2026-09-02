require('dotenv').config();
const { query } = require('../db/index');

async function migrateCrmSchema() {
  console.log('Running safe CRM schema enhancements in Neon PostgreSQL...');

  // 1. Ensure notes column exists in customer_followups
  await query(`
    ALTER TABLE customer_followups 
    ADD COLUMN IF NOT EXISTS notes TEXT;
  `);
  console.log('Added notes column to customer_followups (if not exists)');

  // 2. Backfill notes from note if any records exist
  await query(`
    UPDATE customer_followups 
    SET notes = note 
    WHERE notes IS NULL AND note IS NOT NULL;
  `);

  // 3. Recommended indexes for search, filtering, and isolation
  await query(`CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_followups_date ON customer_followups(follow_up_date);`);
  console.log('Created CRM indexes');

  // Verify columns in customers and customer_followups
  const custCols = await query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customers'
  `);
  console.log('Verified customers columns count:', custCols.rows.length);

  const followCols = await query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customer_followups'
  `);
  console.log('Verified customer_followups columns:', followCols.rows.map(r => r.column_name));

  console.log('Safe CRM migration completed successfully.');
  process.exit(0);
}

migrateCrmSchema().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
