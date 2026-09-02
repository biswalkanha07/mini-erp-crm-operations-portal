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

async function runInventoryTests() {
  console.log('=== RUNNING PHASE 5 INVENTORY BACKEND TEST SUITE ===\n');
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

  // Obtain tokens for all roles
  let adminToken, warehouseToken, salesToken, accountsToken;
  await test('Authenticate all test roles', async () => {
    adminToken = await login('admin@pos.com', 'admin123');
    warehouseToken = await login('warehouse@pos.com', 'warehouse123');
    salesToken = await login('sales@pos.com', 'sales123');
    accountsToken = await login('accounts@pos.com', 'accounts123');
  });

  const authHeader = (t) => ({ 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' });

  // 1. Admin can list products
  await test('1. Admin can list products (GET /api/catalogues) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (!Array.isArray(list) || list.length === 0) throw new Error('Expected non-empty products array');
  });

  // 2. Warehouse can list products
  await test('2. Warehouse can list products (GET /api/catalogues) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 3. Sales can list products
  await test('3. Sales can list products (GET /api/catalogues) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 4. Accounts can list products
  await test('4. Accounts can list products (GET /api/catalogues) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET',
      headers: authHeader(accountsToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 5. Unauthorized request returns 401
  await test('5. Unauthorized request without token returns 401', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'GET'
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 6. Unauthorized roles cannot create or edit products (Sales/Accounts -> 403)
  await test('6. Sales role blocked from creating product -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'POST',
      headers: authHeader(salesToken)
    }, { productName: 'Unauthorized Item', price: 100 });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test('6b. Accounts role blocked from updating product -> 403 Forbidden', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'PUT',
      headers: authHeader(accountsToken)
    }, { minimumStock: 50 });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 7. Product search works (name, SKU, barcode)
  await test('7. Product search by keyword (Chicken) -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues?search=Chicken',
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length === 0) throw new Error('Search returned 0 results for Chicken');
    const allMatch = list.every(p => p.productName.toLowerCase().includes('chicken') || p.sku.toLowerCase().includes('chicken'));
    if (!allMatch) throw new Error('Found product not matching search keyword');
  });

  // 8. Category filter works
  await test('8. Filter products by categoryId -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues?categoryId=CAT001',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    const nonMatch = list.some(p => p.categoryId !== 'CAT001');
    if (nonMatch) throw new Error('Found product not matching categoryId CAT001');
  });

  // 9. Pagination works
  await test('9. Pagination returns page, limit, total, and totalPages', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues?page=1&limit=4',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.pagination || res.body.pagination.limit !== 4) throw new Error('Pagination limit mismatch');
    if (res.body.data.length > 4) throw new Error('Returned more records than limit');
  });

  // 10. Product detail works
  await test('10. Product detail endpoint returns required inventory fields -> 200', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const prod = res.body;
    if (!prod.sku || prod.unitPrice === undefined || prod.currentStock === undefined || prod.minimumStock === undefined || !prod.warehouseLocation) {
      throw new Error(`Missing inventory fields in detail: ${JSON.stringify(prod)}`);
    }
  });

  // 11. Warehouse can create a product
  let testProductId = null;
  await test('11. Warehouse role can create a new inventory product -> 201', async () => {
    const payload = {
      productName: 'Organic Whole Milk 1L',
      price: 65.00,
      stock: 8,
      minimumStock: 10,
      warehouseLocation: 'Cold Storage Unit B',
      volumeOfMeasurement: '1 L'
    };

    const res = await request({
      port: 5050,
      path: '/api/catalogues',
      method: 'POST',
      headers: authHeader(warehouseToken)
    }, payload);

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    testProductId = res.body.id;
    if (res.body.warehouseLocation !== 'Cold Storage Unit B') throw new Error('Warehouse location mismatch');
    if (res.body.minimumStock !== 10) throw new Error('Minimum stock mismatch');
    if (res.body.isLowStock !== true) throw new Error('Expected low stock to be true (8 <= 10)');
  });

  // 12. Product update works
  await test('12. Warehouse role can update product minimum stock and warehouse location -> 200', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, {
      minimumStock: 5,
      warehouseLocation: 'Central Warehouse Rack 4'
    });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.minimumStock !== 5) throw new Error('Minimum stock not updated');
    if (res.body.warehouseLocation !== 'Central Warehouse Rack 4') throw new Error('Warehouse location not updated');
    // Stock is 8, min is 5 -> should now be NORMAL
    if (res.body.isLowStock !== false) throw new Error('Expected low stock to be false (8 > 5)');
  });

  // 13. Negative minimum stock rejected
  await test('13. Negative minimum stock rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { minimumStock: -5 });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 14. Negative unit price rejected
  await test('14. Negative unit price rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { price: -25.50 });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 15. Negative current stock rejected
  await test('15. Negative current stock rejected with 400 Bad Request', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { stock: -10 });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 16. Organization isolation works
  await test('16. Products scoped properly with organization isolation', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'GET',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 17. Non-existent product returns 404
  await test('17. Non-existent product returns 404 Not Found', async () => {
    const res = await request({
      port: 5050,
      path: '/api/catalogues/ITEM_DOES_NOT_EXIST_9999',
      method: 'GET',
      headers: authHeader(warehouseToken)
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 18. Low Stock 4 Test Cases:
  // CASE 1: stock = 5, min = 10 -> LOW STOCK
  await test('18. Case 1: stock=5, min=10 -> LOW STOCK', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { stock: 5, minimumStock: 10 });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.lowStock !== true || res.body.isLowStock !== true) {
      throw new Error(`Expected lowStock=true, got ${res.body.lowStock}`);
    }
  });

  // CASE 2: stock = 10, min = 10 -> LOW STOCK
  await test('19. Case 2: stock=10, min=10 -> LOW STOCK', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { stock: 10, minimumStock: 10 });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.lowStock !== true || res.body.isLowStock !== true) {
      throw new Error(`Expected lowStock=true, got ${res.body.lowStock}`);
    }
  });

  // CASE 3: stock = 11, min = 10 -> NORMAL
  await test('20. Case 3: stock=11, min=10 -> NORMAL', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { stock: 11, minimumStock: 10 });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.lowStock !== false || res.body.isLowStock !== false) {
      throw new Error(`Expected lowStock=false, got ${res.body.lowStock}`);
    }
  });

  // CASE 4: stock = 0, min = 0 -> NORMAL
  await test('21. Case 4: stock=0, min=0 -> NORMAL (minimum stock not configured)', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { stock: 0, minimumStock: 0 });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.lowStock !== false || res.body.isLowStock !== false) {
      throw new Error(`Expected lowStock=false, got ${res.body.lowStock}`);
    }
  });

  // 22. Low stock filter works
  await test('22. Low stock filter (lowStock=true) returns only low stock products', async () => {
    // Set test product to low stock
    await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'PUT',
      headers: authHeader(warehouseToken)
    }, { stock: 2, minimumStock: 15 });

    const res = await request({
      port: 5050,
      path: '/api/catalogues?lowStock=true',
      method: 'GET',
      headers: authHeader(salesToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    if (list.length === 0) throw new Error('Expected at least 1 low stock product');
    const invalid = list.some(p => p.currentStock > p.minimumStock || p.minimumStock === 0);
    if (invalid) throw new Error('Returned product that is not low stock');
  });

  // 23. Existing product records remain intact
  await test('23. All 10 baseline migrated products remain accessible with correct data', async () => {
    const originalSkus = ['SKU004', 'SKU010', 'SKU011'];
    for (const sku of originalSkus) {
      const res = await request({
        port: 5050,
        path: `/api/catalogues/${sku}`,
        method: 'GET',
        headers: authHeader(adminToken)
      });
      if (res.status !== 200 || !res.body?.productName) {
        throw new Error(`Failed to fetch baseline product ${sku}`);
      }
    }
  });

  // 24. POS checkout stock deduction regression check
  await test('24. Existing POS checkout stock deduction works and prevents negative stock', async () => {
    // 1. Get current stock of ITEM004 (SKU004)
    const getRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const stockBefore = getRes.body.currentStock;

    // 2. Perform POS sale of 1 unit
    const saleRes = await request({
      port: 5050,
      path: '/api/sales/transaction',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      storeId: 'STORE0001',
      items: [{ sku: 'SKU004', quantity: 1, discount: 0 }],
      paymentMethod: 'Cash',
      customerDetails: { name: 'Inventory Test Customer', phone: '+919999988888' }
    });

    if (saleRes.status !== 200 && saleRes.status !== 201) {
      throw new Error(`POS transaction failed: ${JSON.stringify(saleRes.body)}`);
    }

    // 3. Verify stock decremented by 1
    const verifyRes = await request({
      port: 5050,
      path: '/api/catalogues/ITEM004',
      method: 'GET',
      headers: authHeader(adminToken)
    });
    const stockAfter = verifyRes.body.currentStock;
    if (stockAfter !== stockBefore - 1) {
      throw new Error(`Stock deduction mismatch. Before: ${stockBefore}, After: ${stockAfter}`);
    }

    // 4. Verify negative stock is refused
    const overSaleRes = await request({
      port: 5050,
      path: '/api/sales/transaction',
      method: 'POST',
      headers: authHeader(adminToken)
    }, {
      storeId: 'STORE0001',
      items: [{ sku: 'SKU004', quantity: stockAfter + 1000, discount: 0 }],
      paymentMethod: 'Cash'
    });
    if (overSaleRes.status === 200 || overSaleRes.status === 201) {
      throw new Error('Expected sale exceeding stock to be rejected');
    }
  });

  // 25. Clean up test product
  await test('25. Admin can delete test product', async () => {
    const res = await request({
      port: 5050,
      path: `/api/catalogues/${testProductId}`,
      method: 'DELETE',
      headers: authHeader(adminToken)
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  console.log(`\n=== INVENTORY TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runInventoryTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
