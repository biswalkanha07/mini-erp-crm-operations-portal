const express = require('express');
const router = express.Router();
const { testConnection } = require('../db/index');

/**
 * System Health Check Endpoint
 * Inspects Express and PostgreSQL (Neon) status.
 */
router.get('/', async (req, res) => {
  let postgresStatus = { status: 'untested' };
  try {
    const pgCheck = await testConnection();
    postgresStatus = pgCheck.success
      ? { status: 'connected', database: pgCheck.database, version: pgCheck.version }
      : { status: 'disconnected', error: pgCheck.error };
  } catch (err) {
    postgresStatus = { status: 'disconnected', error: err.message || 'PostgreSQL error' };
  }

  res.json({
    status: 'ok',
    service: 'mini-erp-crm-operations-portal',
    timestamp: new Date().toISOString(),
    databases: {
      mongodb: {
        status: 'decoupled'
      },
      postgres: postgresStatus
    }
  });
});

/**
 * Dedicated PostgreSQL (Neon) Health Check Endpoint
 */
router.get('/postgres', async (req, res) => {
  try {
    const check = await testConnection();
    if (check.success) {
      return res.json({
        status: 'success',
        database: 'postgresql',
        provider: 'neon',
        connected: true,
        currentDatabase: check.database,
        serverVersion: check.version,
        serverTime: check.timestamp
      });
    } else {
      return res.status(503).json({
        status: 'error',
        database: 'postgresql',
        provider: 'neon',
        connected: false,
        message: check.error
      });
    }
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      database: 'postgresql',
      connected: false,
      message: err.message || 'PostgreSQL check failed'
    });
  }
});

module.exports = router;
