require('dotenv').config();
const { pool } = require('../db');

async function migrateChallanSchema() {
  console.log('=== VERIFYING & MIGRATING SALES CHALLAN SCHEMA ===\n');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify baseline products count
    const prodCountRes = await client.query('SELECT COUNT(*) FROM products');
    console.log(`Baseline products in database: ${prodCountRes.rows[0].count}`);

    // 2. Ensure challans table has all required columns and constraints
    await client.query(`
      CREATE TABLE IF NOT EXISTS challans (
        id VARCHAR(50) PRIMARY KEY,
        challan_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
        notes TEXT,
        created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        confirmed_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure all columns exist on challans
    await client.query(`ALTER TABLE challans ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE`);
    await client.query(`ALTER TABLE challans ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE challans ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE challans ADD COLUMN IF NOT EXISTS notes TEXT`);
    await client.query(`ALTER TABLE challans ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00`);

    // Update check constraint on challans status to accept uppercase DRAFT, CONFIRMED, CANCELLED
    await client.query(`ALTER TABLE challans DROP CONSTRAINT IF EXISTS challans_status_check`);
    await client.query(`ALTER TABLE challans ADD CONSTRAINT challans_status_check CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED', 'Draft', 'Confirmed', 'Cancelled'))`);

    // 3. Ensure challan_items table exists with product snapshots
    await client.query(`
      CREATE TABLE IF NOT EXISTS challan_items (
        id VARCHAR(50) PRIMARY KEY,
        challan_id VARCHAR(50) NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name_snapshot VARCHAR(200) NOT NULL,
        sku_snapshot VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price_snapshot NUMERIC(12, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
        total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure all columns exist on challan_items
    await client.query(`ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(200)`);
    await client.query(`ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS sku_snapshot VARCHAR(100)`);
    await client.query(`ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS unit_price_snapshot NUMERIC(12, 2) DEFAULT 0.00`);
    await client.query(`ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14, 2) DEFAULT 0.00`);

    // 4. Indexes for performance and isolation
    await client.query(`CREATE INDEX IF NOT EXISTS idx_challans_number ON challans(challan_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_challans_customer ON challans(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_challans_org_id ON challans(organization_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_challans_status ON challans(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_challans_created_at ON challans(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_challan_items_challan_id ON challan_items(challan_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_challan_items_product_id ON challan_items(product_id)`);

    // 5. Sequence for concurrent-safe challan number generation
    await client.query(`CREATE SEQUENCE IF NOT EXISTS challan_num_seq START WITH 1 INCREMENT BY 1`);

    await client.query('COMMIT');
    console.log('✅ Sales Challan schema migration completed successfully.');

    // 6. Verify product count is preserved
    const postCountRes = await client.query('SELECT COUNT(*) FROM products');
    console.log(`Post-migration products count: ${postCountRes.rows[0].count} (Preserved intact)`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateChallanSchema();
