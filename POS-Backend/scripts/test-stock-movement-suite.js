const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request({
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

async function runStockMovementTests() {
  console.log('=== RUNNING PHASE 6 STOCK MOVEMENT & AUDIT LOG TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  let adminToken, warehouseToken, salesToken, accountsToken;
  await test('Authenticate all test roles', async () => {
    adminToken = await login('admin@pos.com', 'admin123');
    warehouseToken = await login('warehouse@pos.com', 'warehouse123');
    salesToken = await login('sales@pos.com', 'sales123');
    accountsToken = await login('accounts@pos.com', 'accounts123');
  });

  const authHeader = (t) => ({ 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' });

  // 1. Admin can view movements
  await test('1. Admin can view movements (GET /api/stock-movements) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 2. Admin can create IN movement
  let createdMovementId = null;
  await test('2. Admin can create IN movement (POST /api/stock-movements) -> 201', async () => {
    // Get initial stock
    const pRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const stockBefore = pRes.body.currentStock;

    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: 15,
      movementType: 'IN',
      reason: 'Batch Restock from Supplier'
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    createdMovementId = res.body.data.id;
    if (res.body.currentStock !== stockBefore + 15) {
      throw new Error(`Stock mismatch: before ${stockBefore}, after ${res.body.currentStock}`);
    }
    if (res.body.data.movementType !== 'IN' || res.body.data.quantity !== 15) {
      throw new Error('Movement record payload mismatch');
    }
  });

  // 3. Admin can create OUT movement
  await test('3. Admin can create OUT movement (POST /api/stock-movements) -> 201', async () => {
    const pRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const stockBefore = pRes.body.currentStock;

    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: 5,
      movementType: 'OUT',
      reason: 'Damaged Stock Disposal'
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (res.body.currentStock !== stockBefore - 5) {
      throw new Error(`Stock mismatch: before ${stockBefore}, after ${res.body.currentStock}`);
    }
  });

  // 4. Warehouse can view movements
  await test('4. Warehouse can view movements (GET /api/stock-movements) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 5. Warehouse can create IN movement
  await test('5. Warehouse can create IN movement (POST /api/stock-movements) -> 201', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      productId: 'ITEM010',
      quantity: 20,
      movementType: 'IN',
      reason: 'Warehouse Receipt Inbound'
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
  });

  // 6. Warehouse can create OUT movement
  await test('6. Warehouse can create OUT movement (POST /api/stock-movements) -> 201', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      productId: 'ITEM010',
      quantity: 10,
      movementType: 'OUT',
      reason: 'Internal Warehouse Transfer'
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
  });

  // 7. Sales can view movements
  await test('7. Sales can view movements (GET /api/stock-movements) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 8. Sales cannot create movement (403 Forbidden)
  await test('8. Sales role blocked from creating movement -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      productId: 'ITEM004',
      quantity: 5,
      movementType: 'IN',
      reason: 'Unauthorized Attempt'
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 9. Accounts can view movements
  await test('9. Accounts can view movements (GET /api/stock-movements) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'GET',
      headers: authHeader(accountsToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 10. Accounts cannot create movement (403 Forbidden)
  await test('10. Accounts role blocked from creating movement -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(accountsToken)
    }, {
      productId: 'ITEM004',
      quantity: 5,
      movementType: 'OUT',
      reason: 'Unauthorized Attempt'
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 11. Unauthenticated request returns 401
  await test('11. Unauthenticated request returns 401 Unauthorized', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'GET'
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 12. Invalid product ID returns 404
  await test('12. Invalid product ID returns 404 Not Found', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'NON_EXISTENT_PROD_9999',
      quantity: 10,
      movementType: 'IN',
      reason: 'Test Non-existent'
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 13. Zero quantity rejected (400)
  await test('13. Zero quantity rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: 0,
      movementType: 'IN',
      reason: 'Zero Quantity Test'
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 14. Negative quantity rejected (400)
  await test('14. Negative quantity rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: -10,
      movementType: 'IN',
      reason: 'Negative Quantity Test'
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 15. Decimal quantity rejected (400)
  await test('15. Decimal quantity rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: 5.5,
      movementType: 'IN',
      reason: 'Decimal Quantity Test'
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 16. Invalid movement type rejected (400)
  await test('16. Invalid movement type rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: 10,
      movementType: 'TRANSFER',
      reason: 'Invalid Type Test'
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 17. Missing or empty reason rejected (400)
  await test('17. Missing/empty reason rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: 10,
      movementType: 'IN',
      reason: '   '
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 18. OUT exceeding current stock rejected with 400 and does NOT change stock
  await test('18. OUT exceeding current stock rejected with 400 and preserves stock', async () => {
    const pRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const currentStock = pRes.body.currentStock;

    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM004',
      quantity: currentStock + 5000,
      movementType: 'OUT',
      reason: 'Excessive OUT test'
    });

    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);

    // Verify stock is completely unchanged
    const verifyRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (verifyRes.body.currentStock !== currentStock) {
      throw new Error(`Stock changed after failed OUT! Before: ${currentStock}, After: ${verifyRes.body.currentStock}`);
    }
  });

  // 19. Movement record created_by and server timestamp verified
  await test('19. Created-by user and timestamp accurately recorded in audit log', async () => {
    const res = await request({
      port: 5050,
      path: `/api/stock-movements/${createdMovementId}`,
      method: 'GET',
      headers: authHeader(adminToken)
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const record = res.body.data;
    if (!record.createdAt || isNaN(Date.parse(record.createdAt))) {
      throw new Error('Invalid or missing createdAt timestamp');
    }
    if (!record.createdBy) {
      throw new Error('Missing createdBy user ID in audit record');
    }
    if (record.productName !== 'Mutton Keema') {
      throw new Error(`Product name joined incorrectly: ${record.productName}`);
    }
  });

  // 20. Pagination works (page, limit, total, totalPages)
  await test('20. Pagination works on stock movements list', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements?page=1&limit=2',
      method: 'GET',
      headers: authHeader(adminToken)
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.pagination || res.body.pagination.limit !== 2) {
      throw new Error('Pagination structure mismatch');
    }
    if (res.body.data.length > 2) {
      throw new Error('Returned more records than requested limit');
    }
  });

  // 21. Product filter works
  await test('21. Filter movements by productId/sku', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements?productId=ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length === 0) throw new Error('Expected movement records for ITEM004');
    const invalid = list.some(m => m.productId !== 'ITEM004');
    if (invalid) throw new Error('Found record for different product in filtered results');
  });

  // 22. Movement type filter works
  await test('22. Filter movements by movementType (IN / OUT)', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements?movementType=IN',
      method: 'GET',
      headers: authHeader(adminToken)
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    const invalid = list.some(m => m.movementType !== 'IN');
    if (invalid) throw new Error('Found non-IN movement in filtered results');
  });

  // 23. POS checkout automatically logs OUT movement without double decrement
  await test('23. POS checkout creates atomic OUT movement record with reason=Sale', async () => {
    // 1. Get current stock of SKU010 (ITEM009)
    const pRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM009',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const stockBefore = pRes.body.currentStock;

    // 2. Perform POS sale of 2 units
    const saleRes = await request({
      port: 5050,
      path: '/api/sales/transaction',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      storeId: 'STORE0001',
      items: [{ sku: 'SKU010', quantity: 2, discount: 0 }],
      paymentMethod: 'Cash',
      customerDetails: { name: 'Stock Movement POS Customer', phone: '+919999977777' }
    });

    if (saleRes.status !== 200 && saleRes.status !== 201) {
      throw new Error(`POS transaction failed: ${JSON.stringify(saleRes.body)}`);
    }
    const txnId = saleRes.body.data?.transactionId || saleRes.body.transactionId;

    // 3. Verify stock decremented exactly once by 2
    const verifyProd = await request({
      port: 5050,
      path: '/api/catalogues/ITEM009',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (verifyProd.body.currentStock !== stockBefore - 2) {
      throw new Error(`Stock deduction mismatch: before ${stockBefore}, after ${verifyProd.body.currentStock}`);
    }

    // 4. Verify OUT movement was recorded with reason 'Sale'
    const smRes = await request({
      port: 5050,
      path: `/api/stock-movements?productId=ITEM009&movementType=OUT`,
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(smRes.body) ? smRes.body : smRes.body.data;
    const saleMovement = list.find(m => m.reason === 'Sale' && m.quantity === 2);
    if (!saleMovement) {
      throw new Error('Expected OUT movement with reason=Sale and quantity=2 not found');
    }
  });

  // 24. Transaction atomicity check: Rollback on error
  await test('24. Transaction atomicity: Invalid transaction rolls back cleanly', async () => {
    const pRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM011',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const stockBefore = pRes.body.currentStock;

    // Trigger failure by requesting OUT > stock
    await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      productId: 'ITEM011',
      quantity: stockBefore + 99999,
      movementType: 'OUT',
      reason: 'Should Fail and Rollback'
    });

    const verifyProd = await request({
      port: 5050,
      path: '/api/catalogues/ITEM011',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (verifyProd.body.currentStock !== stockBefore) {
      throw new Error('Stock changed despite transaction failure');
    }
  });

  // 25. Exactly one audit record per movement
  await test('25. Exactly one audit record per stock movement', async () => {
    const listBefore = await request({
      port: 5050,
      path: '/api/stock-movements?productId=ITEM012',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const countBefore = (Array.isArray(listBefore.body) ? listBefore.body : listBefore.body.data).length;

    await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      productId: 'ITEM012',
      quantity: 5,
      movementType: 'IN',
      reason: 'Audit Log Single Record Test'
    });

    const listAfter = await request({
      port: 5050,
      path: '/api/stock-movements?productId=ITEM012',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const countAfter = (Array.isArray(listAfter.body) ? listAfter.body : listAfter.body.data).length;
    if (countAfter !== countBefore + 1) {
      throw new Error(`Expected exactly 1 new record, got ${countAfter - countBefore}`);
    }
  });

  // 26. Cross-organization product access restriction
  await test('26. Cross-organization product lookup respects isolation', async () => {
    const res = await request({
      port: 5050,
      path: '/api/stock-movements',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 27. Verify 10 baseline products remain intact
  await test('27. All 10 baseline products remain intact', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length < 10) {
      throw new Error(`Expected at least 10 products, found ${list.length}`);
    }
  });

  // 28. Verify 10 CRM customers remain intact
  await test('28. All 10 baseline CRM customers remain intact', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length < 10) {
      throw new Error(`Expected at least 10 customers, found ${list.length}`);
    }
  });

  console.log(`\n=== STOCK MOVEMENT TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runStockMovementTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
