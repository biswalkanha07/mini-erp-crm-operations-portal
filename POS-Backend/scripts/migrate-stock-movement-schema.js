require('dotenv').config();
const { query } = require('../db/index');

async function migrateStockMovements() {
  console.log('=== PHASE 6: STOCK MOVEMENTS SCHEMA MIGRATION & VERIFICATION ===\n');

  // 1. Verify pre-migration product count
  const preProd = await query('SELECT count(*) FROM products');
  const countBefore = parseInt(preProd.rows[0].count, 10);
  console.log(`Pre-migration product count: ${countBefore}`);

  // 2. Ensure stock_movements table exists with required columns
  await query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(50) PRIMARY KEY,
      product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity_changed INTEGER NOT NULL CHECK (quantity_changed > 0),
      movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
      reason TEXT NOT NULL,
      reference_id VARCHAR(50),
      created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
      organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ stock_movements table verified/created');

  // Ensure organization_id column exists
  await query(`
    ALTER TABLE stock_movements 
    ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL;
  `);
  console.log('✅ organization_id column verified');

  // Ensure reference_id column exists
  await query(`
    ALTER TABLE stock_movements 
    ADD COLUMN IF NOT EXISTS reference_id VARCHAR(50);
  `);
  console.log('✅ reference_id column verified');

  // 3. Create performance indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_org_id ON stock_movements(organization_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);`);
  console.log('✅ Performance indexes created');

  // 4. Verify post-migration product count
  const postProd = await query('SELECT count(*) FROM products');
  const countAfter = parseInt(postProd.rows[0].count, 10);
  console.log(`Post-migration product count: ${countAfter}`);

  if (countBefore !== countAfter) {
    throw new Error(`Data loss detected! Products count mismatch: ${countBefore} -> ${countAfter}`);
  }

  console.log('\n=== MIGRATION COMPLETE: ZERO DATA LOSS VERIFIED ===');
  process.exit(0);
}

migrateStockMovements().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
