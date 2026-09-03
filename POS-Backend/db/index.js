/**
 * Transitional bridge during Phase 2 TypeScript migration.
 * Delegates directly to the compiled TypeScript implementation in dist/db/index.
 */
module.exports = require('../dist/db/index');
