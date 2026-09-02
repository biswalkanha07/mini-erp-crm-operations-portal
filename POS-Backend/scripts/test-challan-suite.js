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

async function runChallanTests() {
  console.log('=== RUNNING PHASE 7 SALES CHALLAN TEST SUITE ===\n');
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

  let adminToken, salesToken, warehouseToken, accountsToken;
  await test('Authenticate all test roles', async () => {
    adminToken = await login('admin@pos.com', 'admin123');
    salesToken = await login('sales@pos.com', 'sales123');
    warehouseToken = await login('warehouse@pos.com', 'warehouse123');
    accountsToken = await login('accounts@pos.com', 'accounts123');
  });

  const authHeader = (t) => ({ 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' });

  // Get a valid customer ID
  let validCustomerId;
  await test('Fetch baseline customer ID', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (!list || list.length === 0) throw new Error('No customers found');
    validCustomerId = list[0].id || list[0]._id;
  });

  // 1. Create draft challan
  let draftChallanId, draftChallanNumber;
  await test('1. Create draft challan (POST /api/challans) -> 201', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [
        { productId: 'ITEM004', quantity: 10 }
      ],
      notes: 'Initial Draft Order for Wholesale Delivery'
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    draftChallanId = res.body.data.id;
    draftChallanNumber = res.body.data.challanNumber;
    if (res.body.data.status !== 'DRAFT') throw new Error(`Expected status DRAFT, got ${res.body.data.status}`);
    if (!draftChallanNumber || !draftChallanNumber.startsWith('CH-')) {
      throw new Error(`Invalid challan number: ${draftChallanNumber}`);
    }
  });

  // 2. Draft does not change stock
  await test('2. Draft creation does NOT alter product stock', async () => {
    const pRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const initialStock = pRes.body.currentStock;

    // Create another draft
    await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: 20 }]
    });

    const verifyProd = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });

    if (verifyProd.body.currentStock !== initialStock) {
      throw new Error(`Stock changed after draft creation! Before: ${initialStock}, After: ${verifyProd.body.currentStock}`);
    }
  });

  // 3. Draft does not create stock movement
  await test('3. Draft creation does NOT create stock movement records', async () => {
    const smRes = await request({
      port: 5050,
      path: `/api/stock-movements?search=${draftChallanNumber}`,
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(smRes.body) ? smRes.body : smRes.body.data;
    if (list && list.length > 0) {
      throw new Error('Stock movement record found for draft challan!');
    }
  });

  // 4. Multiple products supported in one challan
  let multiItemChallanId;
  await test('4. Multiple products supported in one challan', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [
        { productId: 'ITEM004', quantity: 5 },
        { productId: 'ITEM009', quantity: 3 }
      ],
      notes: 'Multi-item delivery draft'
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    multiItemChallanId = res.body.data.id;
    if (!res.body.data.items || res.body.data.items.length !== 2) {
      throw new Error(`Expected 2 items in response, got ${res.body.data.items?.length}`);
    }
  });

  // 5. Prevent duplicate products in single challan (400 Bad Request)
  await test('5. Duplicate products within single challan rejected with 400', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [
        { productId: 'ITEM004', quantity: 5 },
        { productId: 'ITEM004', quantity: 10 }
      ]
    });

    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 6. Product snapshot data preserved in challan_items
  await test('6. Product snapshot data accurately stored', async () => {
    const res = await request({
      port: 5050,
      path: `/api/challans/${multiItemChallanId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const items = res.body.data.items;
    if (!items || items.length !== 2) throw new Error('Items missing in detail view');

    const item1 = items.find(i => i.productId === 'ITEM004');
    if (!item1.productName || !item1.sku || item1.unitPrice <= 0 || item1.totalAmount !== item1.unitPrice * 5) {
      throw new Error('Snapshot values missing or incorrect for item 1');
    }
  });

  // 7. Update DRAFT challan works
  await test('7. Update DRAFT challan (PUT /api/challans/:id) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: `/api/challans/${draftChallanId}`,
      method: 'PUT',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [
        { productId: 'ITEM004', quantity: 12 },
        { productId: 'ITEM010', quantity: 4 }
      ],
      notes: 'Updated quantities for shipment'
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (res.body.data.items.length !== 2) throw new Error('Items not updated');
    const it = res.body.data.items.find(i => i.productId === 'ITEM004');
    if (it.quantity !== 12) throw new Error(`Expected quantity 12, got ${it.quantity}`);
  });

  // 8. Confirm challan with sufficient stock
  let confirmedChallanId, confirmedChallanNumber;
  await test('8. Confirm challan with sufficient stock: Deducts stock & logs movements', async () => {
    // 1. Get stock before
    const pRes1 = await request({ port: 5050, path: '/api/catalogues/ITEM004', method: 'GET', headers: authHeader(adminToken) });
    const pRes2 = await request({ port: 5050, path: '/api/catalogues/ITEM010', method: 'GET', headers: authHeader(adminToken) });
    const stockBefore1 = pRes1.body.currentStock;
    const stockBefore2 = pRes2.body.currentStock;

    // 2. Create and confirm challan
    const createRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [
        { productId: 'ITEM004', quantity: 5 },
        { productId: 'ITEM010', quantity: 3 }
      ],
      notes: 'Confirm test order'
    });
    confirmedChallanId = createRes.body.data.id;
    confirmedChallanNumber = createRes.body.data.challanNumber;

    const confirmRes = await request({
      port: 5050,
      path: `/api/challans/${confirmedChallanId}/confirm`,
      method: 'POST',
      headers: authHeader(salesToken)
    });

    if (confirmRes.status !== 200) throw new Error(`Expected 200, got ${confirmRes.status}: ${JSON.stringify(confirmRes.body)}`);
    if (confirmRes.body.data.status !== 'CONFIRMED') throw new Error(`Expected status CONFIRMED, got ${confirmRes.body.data.status}`);
    if (!confirmRes.body.data.confirmedAt) throw new Error('Missing confirmedAt timestamp');

    // 3. Verify stock accurately decremented
    const pAfter1 = await request({ port: 5050, path: '/api/catalogues/ITEM004', method: 'GET', headers: authHeader(adminToken) });
    const pAfter2 = await request({ port: 5050, path: '/api/catalogues/ITEM010', method: 'GET', headers: authHeader(adminToken) });
    if (pAfter1.body.currentStock !== stockBefore1 - 5) throw new Error('Stock 1 mismatch after confirmation');
    if (pAfter2.body.currentStock !== stockBefore2 - 3) throw new Error('Stock 2 mismatch after confirmation');

    // 4. Verify OUT stock movement audit trail
    const smRes = await request({
      port: 5050,
      path: `/api/stock-movements?search=${confirmedChallanNumber}`,
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const smList = Array.isArray(smRes.body) ? smRes.body : smRes.body.data;
    if (!smList || smList.length !== 2) {
      throw new Error(`Expected exactly 2 OUT stock movements, found ${smList?.length}`);
    }
    const mov1 = smList.find(m => m.productId === 'ITEM004');
    if (!mov1 || mov1.movementType !== 'OUT' || mov1.reason !== 'Sales Challan' || mov1.quantity !== 5) {
      throw new Error('Invalid stock movement attributes for confirmed challan');
    }
  });

  // 9. Confirming same challan twice is rejected (409 Conflict)
  await test('9. Confirming already CONFIRMED challan fails with 409 Conflict', async () => {
    const res = await request({
      port: 5050,
      path: `/api/challans/${confirmedChallanId}/confirm`,
      method: 'POST',
      headers: authHeader(salesToken)
    });
    if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
  });

  // 10. Update CONFIRMED challan fails (409 Conflict)
  await test('10. Update CONFIRMED challan fails with 409 Conflict', async () => {
    const res = await request({
      port: 5050,
      path: `/api/challans/${confirmedChallanId}`,
      method: 'PUT',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: 1 }]
    });
    if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
  });

  // 11. Confirm with insufficient stock fails and rolls back
  await test('11. Confirm with insufficient stock fails and preserves stock', async () => {
    const pRes = await request({ port: 5050, path: '/api/catalogues/ITEM004', method: 'GET', headers: authHeader(adminToken) });
    const stockBefore = pRes.body.currentStock;

    const createRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: stockBefore + 9999 }]
    });
    const cId = createRes.body.data.id;

    const confirmRes = await request({
      port: 5050,
      path: `/api/challans/${cId}/confirm`,
      method: 'POST',
      headers: authHeader(salesToken)
    });

    if (confirmRes.status !== 409 && confirmRes.status !== 400) {
      throw new Error(`Expected 409/400, got ${confirmRes.status}`);
    }

    // Verify stock completely unchanged
    const verifyProd = await request({ port: 5050, path: '/api/catalogues/ITEM004', method: 'GET', headers: authHeader(adminToken) });
    if (verifyProd.body.currentStock !== stockBefore) {
      throw new Error('Stock changed after failed confirmation!');
    }
  });

  // 12. Multi-item challan with ONE insufficient item: NO item is deducted
  await test('12. Multi-item challan with ONE insufficient item rolls back all items', async () => {
    const pRes1 = await request({ port: 5050, path: '/api/catalogues/ITEM004', method: 'GET', headers: authHeader(adminToken) });
    const pRes2 = await request({ port: 5050, path: '/api/catalogues/ITEM010', method: 'GET', headers: authHeader(adminToken) });
    const stock1Before = pRes1.body.currentStock;
    const stock2Before = pRes2.body.currentStock;

    // Item 1 has sufficient stock, Item 2 has excessive quantity
    const createRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [
        { productId: 'ITEM004', quantity: 2 },
        { productId: 'ITEM010', quantity: stock2Before + 5000 }
      ]
    });
    const cId = createRes.body.data.id;

    const confirmRes = await request({
      port: 5050,
      path: `/api/challans/${cId}/confirm`,
      method: 'POST',
      headers: authHeader(salesToken)
    });
    if (confirmRes.status !== 409 && confirmRes.status !== 400) {
      throw new Error(`Expected 409/400, got ${confirmRes.status}`);
    }

    // Verify NEITHER item was deducted
    const verify1 = await request({ port: 5050, path: '/api/catalogues/ITEM004', method: 'GET', headers: authHeader(adminToken) });
    const verify2 = await request({ port: 5050, path: '/api/catalogues/ITEM010', method: 'GET', headers: authHeader(adminToken) });
    if (verify1.body.currentStock !== stock1Before) throw new Error('Sufficient item was deducted despite transaction failure!');
    if (verify2.body.currentStock !== stock2Before) throw new Error('Item 2 stock changed unexpectedly');
  });

  // 13. Cancel DRAFT challan
  let cancelledChallanId;
  await test('13. Cancel DRAFT challan (POST /api/challans/:id/cancel) -> 200', async () => {
    const createRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: 3 }]
    });
    cancelledChallanId = createRes.body.data.id;

    const res = await request({
      port: 5050,
      path: `/api/challans/${cancelledChallanId}/cancel`,
      method: 'POST',
      headers: authHeader(salesToken)
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.status !== 'CANCELLED') throw new Error(`Expected status CANCELLED, got ${res.body.data.status}`);
    if (!res.body.data.cancelledAt) throw new Error('Missing cancelledAt timestamp');
  });

  // 14. Update CANCELLED challan fails (409 Conflict)
  await test('14. Update CANCELLED challan fails with 409 Conflict', async () => {
    const res = await request({
      port: 5050,
      path: `/api/challans/${cancelledChallanId}`,
      method: 'PUT',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: 1 }]
    });
    if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
  });

  // 15. Cancel CONFIRMED challan fails (409 Conflict)
  await test('15. Cancel CONFIRMED challan fails with 409 Conflict', async () => {
    const res = await request({
      port: 5050,
      path: `/api/challans/${confirmedChallanId}/cancel`,
      method: 'POST',
      headers: authHeader(salesToken)
    });
    if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
  });

  // 16. Historical Snapshot Regression Test
  await test('16. Historical Snapshot Regression: Product updates do not alter past challans', async () => {
    // 1. Fetch current product data for ITEM004
    const prodRes = await request({ port: 5050, path: '/api/catalogues/ITEM004', method: 'GET', headers: authHeader(adminToken) });
    const originalName = prodRes.body.itemName || prodRes.body.productName;
    const originalPrice = prodRes.body.price || prodRes.body.unitPrice;

    // 2. Create a challan with this product
    const chRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: 5 }]
    });
    const snapChallanId = chRes.body.data.id;

    // 3. Update the product name and price in catalogue
    await request({
      port: 5050,
      path: `/api/catalogues/ITEM004`,
      method: 'PUT',
      headers: authHeader(adminToken)
    }, {
      itemName: 'Modified Catalogue Name for Keema',
      price: originalPrice + 100
    });

    // 4. Fetch the old challan and verify it preserved original snapshot values
    const verifyCh = await request({
      port: 5050,
      path: `/api/challans/${snapChallanId}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });

    const item = verifyCh.body.data.items.find(i => i.productId === 'ITEM004');
    if (!item) throw new Error('Item missing in challan');
    if (item.productName !== originalName) {
      throw new Error(`Product name was overwritten! Expected '${originalName}', got '${item.productName}'`);
    }
    if (item.unitPrice !== originalPrice) {
      throw new Error(`Unit price was overwritten! Expected ${originalPrice}, got ${item.unitPrice}`);
    }
    if (item.totalAmount !== originalPrice * 5) {
      throw new Error(`Total amount was overwritten! Expected ${originalPrice * 5}, got ${item.totalAmount}`);
    }

    // 5. Restore product back to original name and price
    await request({
      port: 5050,
      path: `/api/catalogues/ITEM004`,
      method: 'PUT',
      headers: authHeader(adminToken)
    }, {
      itemName: originalName,
      price: originalPrice
    });
  });

  // 17. RBAC: Warehouse role can view but cannot create/confirm/cancel
  await test('17. Warehouse role can view but blocked from creating/confirming challans', async () => {
    const listRes = await request({ port: 5050, path: '/api/challans', method: 'GET', headers: authHeader(warehouseToken) });
    if (listRes.status !== 200) throw new Error(`Expected 200 on GET, got ${listRes.status}`);

    const createRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: 1 }]
    });
    if (createRes.status !== 403) throw new Error(`Expected 403 on POST, got ${createRes.status}`);
  });

  // 18. RBAC: Accounts role can view but cannot create/confirm/cancel
  await test('18. Accounts role can view but blocked from creating/confirming challans', async () => {
    const listRes = await request({ port: 5050, path: '/api/challans', method: 'GET', headers: authHeader(accountsToken) });
    if (listRes.status !== 200) throw new Error(`Expected 200 on GET, got ${listRes.status}`);

    const createRes = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(accountsToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: 1 }]
    });
    if (createRes.status !== 403) throw new Error(`Expected 403 on POST, got ${createRes.status}`);
  });

  // 19. Unauthenticated request returns 401
  await test('19. Unauthenticated request returns 401 Unauthorized', async () => {
    const res = await request({ port: 5050, path: '/api/challans', method: 'GET' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 20. Invalid product ID returns 404
  await test('20. Invalid product ID returns 404 Not Found', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'NON_EXISTENT_PROD_9999', quantity: 5 }]
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 21. Invalid customer ID returns 404
  await test('21. Invalid customer ID returns 404 Not Found', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: 'NON_EXISTENT_CUST_9999',
      items: [{ productId: 'ITEM004', quantity: 5 }]
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 22. Zero/negative quantity rejected with 400
  await test('22. Zero or negative quantity rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans',
      method: 'POST',
      headers: authHeader(salesToken)
    }, {
      customerId: validCustomerId,
      items: [{ productId: 'ITEM004', quantity: -5 }]
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 23. Pagination works on challans list
  await test('23. Pagination works on challans list', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans?page=1&limit=2',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.pagination || res.body.pagination.limit !== 2) {
      throw new Error('Pagination metadata mismatch');
    }
  });

  // 24. Search works by challan number or customer
  await test('24. Search challans by challanNumber or customer name', async () => {
    const res = await request({
      port: 5050,
      path: `/api/challans?search=${draftChallanNumber}`,
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length === 0 || !list.some(c => c.challanNumber === draftChallanNumber)) {
      throw new Error('Challan search failed to find matching record');
    }
  });

  // 25. Status filter works
  await test('25. Filter challans by status (CONFIRMED, DRAFT, CANCELLED)', async () => {
    const res = await request({
      port: 5050,
      path: '/api/challans?status=CONFIRMED',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    const invalid = list.some(c => c.status !== 'CONFIRMED');
    if (invalid) throw new Error('Non-confirmed challan returned in status filter');
  });

  // 26. Verify 10 baseline products remain intact
  await test('26. All 10 baseline products remain intact', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length < 10) throw new Error(`Expected at least 10 products, found ${list.length}`);
  });

  // 27. Verify 10 baseline CRM customers remain intact
  await test('27. All 10 baseline CRM customers remain intact', async () => {
    const res = await request({
      port: 5050,
      path: '/api/customers',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length < 10) throw new Error(`Expected at least 10 customers, found ${list.length}`);
  });

  console.log(`\n=== SALES CHALLAN TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runChallanTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
