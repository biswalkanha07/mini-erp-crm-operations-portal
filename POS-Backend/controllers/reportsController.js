const { query } = require('../db/index');
const { mapSale } = require('../db/mapper');
const { parseISO, startOfDay, endOfDay } = require("date-fns");
const { zonedTimeToUtc } = require('date-fns-tz');

// Test endpoint to see all sales data
exports.testSalesData = async (req, res) => {
  try {
    const { storeId } = req.params;
    const result = await query(
      'SELECT * FROM sales WHERE store_id = $1 ORDER BY date_time DESC LIMIT 10',
      [storeId]
    );
    res.json({
      storeId,
      totalSales: result.rows.length,
      sales: result.rows.map(sale => ({
        transactionId: sale.transaction_id,
        customerDetails: typeof sale.customer_details === 'string' ? JSON.parse(sale.customer_details) : sale.customer_details,
        grandTotal: Number(sale.grand_total),
        dateTime: sale.date_time,
        paymentMethod: sale.payment_method
      }))
    });
  } catch (err) {
    console.error('Error fetching test sales data:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get customer reports for a specific store
exports.getCustomerReports = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, searchTerm } = req.query;

    const conditions = ['(s.store_id = $1 OR st.store_id = $1)'];
    const params = [storeId];
    let pIdx = 2;

    if (startDate && endDate) {
      const timeZone = "Asia/Kolkata";
      const start = zonedTimeToUtc(startOfDay(parseISO(startDate)), timeZone);
      const end = zonedTimeToUtc(endOfDay(parseISO(endDate)), timeZone);
      conditions.push(`s.date_time >= $${pIdx} AND s.date_time <= $${pIdx + 1}`);
      params.push(start, end);
      pIdx += 2;
    }

    if (searchTerm && searchTerm.trim()) {
      const phoneSearchTerm = searchTerm.replace(/\D/g, '');
      if (phoneSearchTerm.length > 0) {
        conditions.push(`(
          s.customer_details->>'name' ILIKE $${pIdx} OR
          s.customer_details->>'phone' ILIKE $${pIdx + 1}
        )`);
        params.push(`%${searchTerm.trim()}%`, `%${phoneSearchTerm}%`);
        pIdx += 2;
      } else {
        conditions.push(`s.customer_details->>'name' ILIKE $${pIdx}`);
        params.push(`%${searchTerm.trim()}%`);
        pIdx++;
      }
    }

    const sql = `
      SELECT
        COALESCE(NULLIF(s.customer_details->>'phone', ''), NULLIF(s.customer_details->>'name', ''), NULLIF(s.customer_details->>'email', ''), 'anonymous') as customer_id,
        MAX(s.customer_details->>'name') as name,
        MAX(s.customer_details->>'phone') as phone,
        MAX(s.customer_details->>'email') as email,
        COUNT(*) as total_visits,
        COUNT(*) as total_purchases,
        SUM(s.grand_total) as total_spent,
        MIN(s.date_time) as first_visit,
        MAX(s.date_time) as last_visit
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY customer_id
      ORDER BY total_spent DESC
    `;

    const result = await query(sql, params);
    const customers = result.rows.map(report => {
      const totalPurchases = Number(report.total_purchases) || 1;
      const totalSpent = Number(report.total_spent) || 0;
      return {
        _id: report.customer_id,
        name: report.name || (report.customer_id === 'anonymous' ? null : report.customer_id),
        phone: report.phone || null,
        email: report.email || null,
        totalVisits: Number(report.total_visits) || 0,
        totalPurchases,
        totalSpent,
        firstVisit: report.first_visit,
        lastVisit: report.last_visit,
        averageOrderValue: totalPurchases > 0 ? totalSpent / totalPurchases : 0
      };
    });

    const totalCustomers = customers.length;
    const totalVisits = customers.reduce((sum, customer) => sum + customer.totalVisits, 0);
    const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

    res.json({
      customers,
      totalCustomers,
      totalVisits,
      totalRevenue
    });

  } catch (err) {
    console.error('Error generating customer reports:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get top customers for a store
exports.getTopCustomers = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 10 } = req.query;

    const sql = `
      SELECT
        s.customer_details->>'name' as name,
        s.customer_details->>'phone' as phone,
        s.customer_details->>'email' as email,
        SUM(s.grand_total) as total_spent,
        COUNT(*) as total_visits,
        MAX(s.date_time) as last_visit
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id OR s.store_id = st.store_id
      WHERE (s.store_id = $1 OR st.store_id = $1)
        AND (
          NULLIF(s.customer_details->>'name', '') IS NOT NULL OR
          NULLIF(s.customer_details->>'phone', '') IS NOT NULL OR
          NULLIF(s.customer_details->>'email', '') IS NOT NULL
        )
      GROUP BY s.customer_details->>'name', s.customer_details->>'phone', s.customer_details->>'email'
      ORDER BY total_spent DESC
      LIMIT $2
    `;

    const result = await query(sql, [storeId, parseInt(limit) || 10]);

    const customers = result.rows.map(customer => ({
      _id: `${customer.name || 'anonymous'}-${customer.phone || 'nophone'}`,
      name: customer.name || 'Anonymous Customer',
      phone: customer.phone,
      email: customer.email,
      totalSpent: Number(customer.total_spent) || 0,
      totalVisits: Number(customer.total_visits) || 0,
      lastVisit: customer.last_visit
    }));

    res.json(customers);

  } catch (err) {
    console.error('Error getting top customers:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get customer purchase history
exports.getCustomerPurchaseHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { customerPhone, customerEmail, customerName } = req.query;

    if (!customerPhone && !customerEmail && !customerName) {
      return res.status(400).json({ error: 'At least one customer identifier is required' });
    }

    const conditions = ['(s.store_id = $1 OR st.store_id = $1)'];
    const params = [storeId];
    const customerFilter = [];
    let pIdx = 2;

    if (customerPhone) {
      customerFilter.push(`s.customer_details->>'phone' = $${pIdx}`);
      params.push(customerPhone);
      pIdx++;
    }
    if (customerEmail) {
      customerFilter.push(`s.customer_details->>'email' = $${pIdx}`);
      params.push(customerEmail);
      pIdx++;
    }
    if (customerName) {
      customerFilter.push(`s.customer_details->>'name' = $${pIdx}`);
      params.push(customerName);
      pIdx++;
    }

    conditions.push(`(${customerFilter.join(' OR ')})`);

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
    const purchases = result.rows.map(r => {
      const sale = mapSale(r);
      if (r.store_obj) sale.storeId = { storeName: r.store_obj.store_name };
      if (r.cashier_obj) sale.cashier = { name: r.cashier_obj.name };
      return sale;
    });

    res.json(purchases);

  } catch (err) {
    console.error('Error getting customer purchase history:', err);
    res.status(500).json({ error: err.message });
  }
};
