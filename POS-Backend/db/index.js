const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[PostgreSQL] WARNING: DATABASE_URL environment variable is not defined.');
}

// Configure PostgreSQL Pool with Neon SSL support
const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum pool size suitable for serverless pooler
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // Never expose credentials in unexpected pool errors
  console.error('[PostgreSQL] Unexpected pool client error:', err.message || 'Database error occurred');
});

/**
 * Execute parameterized query safely
 * @param {string} text SQL statement
 * @param {Array} params Parameter array
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log query type and timing for debugging without leaking query parameters
    if (process.env.NODE_ENV === 'development') {
      const command = text.trim().split(' ')[0].toUpperCase();
      console.log(`[PostgreSQL] ${command} executed in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    // Sanitize error: never leak connection string or passwords
    const sanitizedError = new Error(err.message || 'PostgreSQL query execution failed');
    sanitizedError.code = err.code;
    throw sanitizedError;
  }
};

/**
 * Safely test PostgreSQL connection without exposing credentials
 * @returns {Promise<{ success: boolean, timestamp?: string, database?: string, version?: string, error?: string }>}
 */
const testConnection = async () => {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      error: 'DATABASE_URL is not configured'
    };
  }
  try {
    const res = await pool.query(
      'SELECT NOW() AS current_time, current_database() AS db_name, version() AS pg_version;'
    );
    const row = res.rows[0];
    return {
      success: true,
      timestamp: row.current_time,
      database: row.db_name,
      version: row.pg_version ? row.pg_version.split(' ')[0] + ' ' + row.pg_version.split(' ')[1] : 'PostgreSQL'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Connection failed'
    };
  }
};

module.exports = {
  pool,
  query,
  getClient: () => pool.connect(),
  testConnection
};
