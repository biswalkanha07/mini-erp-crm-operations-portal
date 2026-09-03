import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[PostgreSQL] WARNING: DATABASE_URL environment variable is not defined.');
}

// Configure PostgreSQL Pool with Neon SSL support
export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum pool size suitable for serverless pooler
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err: Error) => {
  // Never expose credentials in unexpected pool errors
  console.error('[PostgreSQL] Unexpected pool client error:', err.message || 'Database error occurred');
});

/**
 * Execute parameterized query safely
 * @param text SQL statement
 * @param params Parameter array
 * @returns Promise resolving to QueryResult
 */
export const query = async <R extends QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<R>> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  const start = Date.now();
  try {
    const res = await pool.query<R>(text, params);
    const duration = Date.now() - start;
    // Log query type and timing for debugging without leaking query parameters
    if (process.env.NODE_ENV === 'development') {
      const command = text.trim().split(' ')[0].toUpperCase();
      console.log(`[PostgreSQL] ${command} executed in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (err: any) {
    // Sanitize error: never leak connection string or passwords
    const sanitizedError = new Error(err.message || 'PostgreSQL query execution failed') as Error & { code?: string };
    sanitizedError.code = err.code;
    throw sanitizedError;
  }
};

/**
 * Connection test result shape
 */
export interface ConnectionTestResult {
  success: boolean;
  timestamp?: string;
  database?: string;
  version?: string;
  error?: string;
}

/**
 * Safely test PostgreSQL connection without exposing credentials
 */
export const testConnection = async (): Promise<ConnectionTestResult> => {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      error: 'DATABASE_URL is not configured'
    };
  }
  try {
    const res = await pool.query<{
      current_time: string;
      db_name: string;
      pg_version: string;
    }>(
      'SELECT NOW() AS current_time, current_database() AS db_name, version() AS pg_version;'
    );
    const row = res.rows[0];
    return {
      success: true,
      timestamp: row.current_time,
      database: row.db_name,
      version: row.pg_version ? row.pg_version.split(' ')[0] + ' ' + row.pg_version.split(' ')[1] : 'PostgreSQL'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Connection failed'
    };
  }
};

export const getClient = (): Promise<PoolClient> => pool.connect();

export default {
  pool,
  query,
  getClient,
  testConnection
};
