/**
 * Transitional bridge during Phase 4 TypeScript migration.
 * Delegates directly to the compiled TypeScript runtime in dist/index.js.
 */
module.exports = require('./dist/index');