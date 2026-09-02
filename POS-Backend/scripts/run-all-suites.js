/**
 * run-all-suites.js
 * Executes all regression & verification test suites sequentially and outputs summary
 */

const { execSync } = require('child_process');
const path = require('path');

const SUITES = [
  { name: 'Auth & User Management Polish Suite', script: 'test-auth-user-mgmt.js' },
  { name: 'Production Hardening & Security Suite', script: 'test-production-hardening.js' },
  { name: 'End-to-End Operational Scenarios Suite', script: 'test-e2e-scenarios.js' },
  { name: 'ERP Dashboard Analytics Suite', script: 'test-dashboard-suite.js' },
  { name: 'Sales Challans & Inventory Sync Suite', script: 'test-challan-suite.js' },
  { name: 'Stock Movement Ledger & Audit Suite', script: 'test-stock-movement-suite.js' },
  { name: 'Inventory & Catalogue Suite', script: 'test-inventory-suite.js' },
  { name: 'CRM Customer Operations Suite', script: 'test-crm-suite.js' },
  { name: 'RBAC Authorization Matrix Suite', script: 'test-rbac-matrix.js' },
  { name: 'Legacy POS & Core API Regression Suite', script: 'test-api-regression.js' },
  { name: 'Frontend Auth Flow Simulation Suite', script: 'test-frontend-auth-flow.js' }
];

console.log('===============================================================');
console.log('🚀 MASTER REGRESSION RUNNER - MINI ERP + CRM OPERATIONS PORTAL');
console.log('===============================================================\n');

let totalSuites = SUITES.length;
let passedSuites = 0;
let failedSuites = 0;

for (const suite of SUITES) {
  const fullPath = path.join(__dirname, suite.script);
  console.log(`\n▶️ RUNNING: ${suite.name} (${suite.script})...`);
  try {
    const output = execSync(`node "${fullPath}"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log(output);
    console.log(`✅ SUITE PASSED: ${suite.name}\n`);
    passedSuites++;
  } catch (err) {
    console.error(`❌ SUITE FAILED: ${suite.name}`);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    failedSuites++;
  }
}

console.log('===============================================================');
console.log(`📊 MASTER TEST SUMMARY: ${passedSuites}/${totalSuites} Suites Passed (${failedSuites} Failed)`);
console.log('===============================================================');

if (failedSuites > 0) {
  process.exit(1);
}
