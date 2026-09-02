const salesService = require('../services/salesService');
const catalogueService = require('../services/catalogueService');
const { query } = require('../db/index');
const { mapSale, mapStore, mapUser } = require('../db/mapper');
const { parseISO, startOfDay, endOfDay, endOfToday } = require("date-fns");
const { zonedTimeToUtc } = require('date-fns-tz');

// Get all sales/transactions (optionally filter by storeId)
exports.getAllSales = async (req, res) => {
  try {
    const { storeId } = req.query;
    const sales = await salesService.getAll({ storeId });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new POS transaction
exports.createTransaction = async (req, res) => {
  try {
    const transaction = await salesService.createTransaction(req.body);
    res.status(201).json(transaction);
  } catch (err) {
    console.error('Transaction creation error:', err);
    if (err.httpStatus === 404) {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};

// Get single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await salesService.getById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transactions by store with optional filters and search
exports.getTransactionsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { filter, search, date, startDate, endDate } = req.query;
    const timeZone = "Asia/Kolkata";

    let conditions = ['(s.store_id = $1 OR st.store_id = $1)'];
    let params = [storeId];
    let pIdx = 2;

    if (filter === 'today') {
      const start = zonedTimeToUtc(startOfDay(new Date()), timeZone);
      const end = zonedTimeToUtc(endOfToday(), timeZone);
      conditions.push(`s.date_time >= $${pIdx} AND s.date_time < $${pIdx + 1}`);
      params.push(start, end);
      pIdx += 2;
    } else if (filter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const start = zonedTimeToUtc(startOfDay(yesterday), timeZone);
      const end = zonedTimeToUtc(endOfDay(yesterday), timeZone);
      conditions.push(`s.date_time >= $${pIdx} AND s.date_time < $${pIdx + 1}`);
      params.push(start, end);
      pIdx += 2;
    } else if (date) {
      const parsedDate = parseISO(date);
      const start = zonedTimeToUtc(startOfDay(parsedDate), timeZone);
      const end = zonedTimeToUtc(endOfDay(parsedDate), timeZone);
      conditions.push(`s.date_time >= $${pIdx} AND s.date_time < $${pIdx + 1}`);
      params.push(start, end);
      pIdx += 2;
    } else if (startDate && endDate) {
      const start = zonedTimeToUtc(startOfDay(parseISO(startDate)), timeZone);
      const end = zonedTimeToUtc(endOfDay(parseISO(endDate)), timeZone);
      conditions.push(`s.date_time >= $${pIdx} AND s.date_time < $${pIdx + 1}`);
      params.push(start, end);
      pIdx += 2;
    }

    if (['cash', 'card', 'UPI'].includes(filter)) {
      conditions.push(`s.payment_method = $${pIdx}`);
      params.push(filter);
      pIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        s.transaction_id ILIKE $${pIdx} OR
        s.customer_details->>'name' ILIKE $${pIdx} OR
        s.customer_details->>'phone' ILIKE $${pIdx} OR
        s.customer_details->>'email' ILIKE $${pIdx}
      )`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const sql = `
      SELECT s.*,
             row_to_json(st.*) as store_obj,
             row_to_json(u.*) as cashier_obj
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
      LEFT JOIN users u ON s.cashier_id = u.id OR s.cashier_id = u.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.date_time DESC
    `;

    const result = await query(sql, params);
    const transactions = result.rows.map(r => {
      const sale = mapSale(r);
      if (r.store_obj) sale.storeId = mapStore(r.store_obj);
      if (r.cashier_obj) sale.cashier = mapUser(r.cashier_obj);
      return sale;
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get product by SKU
exports.getProductBySKU = async (req, res) => {
  try {
    const product = await catalogueService.getBySku(req.params.sku);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get product by barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const product = await catalogueService.getByBarcode(req.params.barcode);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sales by date range
exports.getSalesByDateRange = async (req, res) => {
  try {
    const { start, end, storeId } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);

    let conditions = ['s.date_time >= $1 AND s.date_time <= $2'];
    let params = [startDate, endDate];

    if (storeId) {
      conditions.push('(s.store_id = $3 OR st.store_id = $3)');
      params.push(storeId);
    }

    const sql = `
      SELECT s.*,
             row_to_json(st.*) as store_obj,
             row_to_json(u.*) as cashier_obj
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
      LEFT JOIN users u ON s.cashier_id = u.id OR s.cashier_id = u.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.date_time DESC
    `;

    const result = await query(sql, params);
    const sales = result.rows.map(r => {
      const sale = mapSale(r);
      if (r.store_obj) sale.storeId = mapStore(r.store_obj);
      if (r.cashier_obj) sale.cashier = mapUser(r.cashier_obj);
      return sale;
    });

    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sales by transaction ID
exports.getSalesByTransactionId = async (req, res) => {
  try {
    const sale = await salesService.getById(req.params.transactionId);
    if (!sale) return res.status(404).json({ error: 'Transaction not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const countsRes = await query(`
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(grand_total), 0) as total_revenue,
        COUNT(CASE WHEN date_time >= $1 AND date_time < $2 THEN 1 END) as today_sales,
        COALESCE(SUM(CASE WHEN date_time >= $1 AND date_time < $2 THEN grand_total ELSE 0 END), 0) as today_revenue
      FROM sales
    `, [today, tomorrow]);

    const pmRes = await query(`
      SELECT payment_method as _id, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
      FROM sales
      GROUP BY payment_method
    `);

    const r = countsRes.rows[0];
    res.json({
      totalSales: Number(r.total_sales) || 0,
      totalRevenue: Number(r.total_revenue) || 0,
      todaySales: Number(r.today_sales) || 0,
      todayRevenue: Number(r.today_revenue) || 0,
      paymentMethodStats: pmRes.rows.map(p => ({
        _id: p._id,
        count: Number(p.count),
        total: Number(p.total)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Advanced search with filtering, sorting, and pagination
exports.advancedSearch = async (req, res) => {
  try {
    const {
      searchTerm = '',
      phone = '',
      paymentMethod = '',
      startDate = '',
      endDate = '',
      storeId = '',
      sortField = 'dateTime',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (storeId) {
      conditions.push(`(s.store_id = $${pIdx} OR st.store_id = $${pIdx})`);
      params.push(storeId);
      pIdx++;
    }

    if (searchTerm && searchTerm.trim()) {
      const phoneDigits = searchTerm.replace(/\D/g, '');
      if (phoneDigits.length > 0) {
        conditions.push(`(
          s.customer_details->>'name' ILIKE $${pIdx} OR
          s.customer_details->>'phone' ILIKE $${pIdx + 1}
        )`);
        params.push(`%${searchTerm.trim()}%`, `%${phoneDigits}%`);
        pIdx += 2;
      } else {
        conditions.push(`s.customer_details->>'name' ILIKE $${pIdx}`);
        params.push(`%${searchTerm.trim()}%`);
        pIdx++;
      }
    }

    if (paymentMethod && paymentMethod !== 'all') {
      conditions.push(`s.payment_method = $${pIdx}`);
      params.push(paymentMethod);
      pIdx++;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(`s.date_time >= $${pIdx}`);
      params.push(start);
      pIdx++;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(`s.date_time <= $${pIdx}`);
      params.push(end);
      pIdx++;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    const sortMap = {
      dateTime: 's.date_time',
      grandTotal: 's.grand_total',
      'customerDetails.name': "s.customer_details->>'name'",
      transactionId: 's.transaction_id',
      paymentMethod: 's.payment_method'
    };
    const sortCol = sortMap[sortField] || 's.date_time';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
      ${whereClause}
    `;
    const countRes = await query(countSql, params);
    const totalRecords = Number(countRes.rows[0]?.total) || 0;

    const dataSql = `
      SELECT s.*,
             row_to_json(st.*) as store_obj,
             row_to_json(u.*) as cashier_obj
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
      LEFT JOIN users u ON s.cashier_id = u.id OR s.cashier_id = u.user_id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataRes = await query(dataSql, [...params, limitNum, offset]);

    const totalPages = Math.ceil(totalRecords / limitNum);

    const formattedTransactions = dataRes.rows.map(transaction => {
      const sale = mapSale(transaction);
      const storeObj = transaction.store_obj ? mapStore(transaction.store_obj) : null;
      const cashierObj = transaction.cashier_obj ? mapUser(transaction.cashier_obj) : null;
      return {
        _id: sale.id,
        transactionId: sale.transactionId,
        dateTime: sale.dateTime,
        customerName: sale.customerDetails?.name || 'Walk-in Customer',
        phoneNumber: sale.customerDetails?.phone || '',
        paymentMethod: sale.paymentMethod,
        amount: sale.grandTotal,
        itemsCount: sale.items?.length || 0,
        storeName: storeObj?.storeName || 'Unknown Store',
        storeCode: storeObj?.storeId || '',
        cashier: cashierObj?.name || 'System',
        items: sale.items || [],
        subTotal: sale.subTotal,
        gstTotal: sale.gstTotal,
        discountTotal: sale.discountTotal,
        customerDetails: sale.customerDetails
      };
    });

    res.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        recordsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        searchTerm,
        phone,
        paymentMethod,
        startDate,
        endDate,
        storeId,
        sortField,
        sortOrder
      }
    });

  } catch (err) {
    console.error('Advanced search error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message,
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalRecords: 0,
        recordsPerPage: 10
      }
    });
  }
};

// Get sales by payment method
exports.getSalesByPaymentMethod = async (req, res) => {
  try {
    const { paymentMethod } = req.params;
    const { storeId } = req.query;

    let conditions = ['s.payment_method = $1'];
    let params = [paymentMethod];

    if (storeId) {
      conditions.push('(s.store_id = $2 OR st.store_id = $2)');
      params.push(storeId);
    }

    const sql = `
      SELECT s.*,
             row_to_json(st.*) as store_obj,
             row_to_json(u.*) as cashier_obj
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
      LEFT JOIN users u ON s.cashier_id = u.id OR s.cashier_id = u.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.date_time DESC
    `;

    const result = await query(sql, params);
    const sales = result.rows.map(r => {
      const sale = mapSale(r);
      if (r.store_obj) sale.storeId = mapStore(r.store_obj);
      if (r.cashier_obj) sale.cashier = mapUser(r.cashier_obj);
      return sale;
    });

    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
