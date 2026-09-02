require('dotenv').config();
const { testConnection } = require('./index');

async function run() {
  console.log('[PostgreSQL] Testing connection to Neon database...');
  const result = await testConnection();

  if (result.success) {
    console.log('[PostgreSQL] Connection SUCCESSFUL!');
    console.log(`[PostgreSQL] Connected database: ${result.database}`);
    console.log(`[PostgreSQL] Database server: ${result.version}`);
    console.log(`[PostgreSQL] Server time: ${result.timestamp}`);
    process.exit(0);
  } else {
    console.error('[PostgreSQL] Connection FAILED!');
    console.error(`[PostgreSQL] Error detail: ${result.error}`);
    process.exit(1);
  }
}

run();
