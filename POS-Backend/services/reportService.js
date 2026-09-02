const { query } = require('../db/index');
const { parseISO, startOfDay, endOfDay } = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');

exports.getCustomerReports = async (storeId, { startDate, endDate, searchTerm } = {}) => {
  let conditions = ['store_id = $1'];
  let params = [storeId];
  let pIdx = 2;

  if (startDate && endDate) {
    const timeZone = 'Asia/Kolkata';
    const start = zonedTimeToUtc(startOfDay(parseISO(startDate)), timeZone);
    const end = zonedTimeToUtc(endOfDay(parseISO(endDate)), timeZone);
    conditions.push(`date_time >= $${pIdx} AND date_time <= $${pIdx + 1}`);
    params.push(start, end);
    pIdx += 2;
  }

  if (searchTerm && searchTerm.trim()) {
    conditions.push(`(
      customer_details->>'name' ILIKE $${pIdx} OR
      customer_details->>'phone' ILIKE $${pIdx}
    )`);
    params.push(`%${searchTerm.trim()}%`);
    pIdx++;
  }

  const sql = `
    SELECT
      COALESCE(NULLIF(customer_details->>'phone', ''), NULLIF(customer_details->>'name', ''), 'anonymous') as customer_id,
      MAX(COALESCE(NULLIF(customer_details->>'name', ''), 'Anonymous Customer')) as customer_name,
      MAX(COALESCE(NULLIF(customer_details->>'phone', ''), '')) as customer_phone,
      MAX(COALESCE(NULLIF(customer_details->>'email', ''), '')) as customer_email,
      COUNT(*) as total_orders,
      COALESCE(SUM(grand_total), 0) as total_spent,
      MAX(date_time) as last_visit,
      MIN(date_time) as first_visit,
      COALESCE(AVG(grand_total), 0) as average_order_value,
      COALESCE(SUM(discount_total), 0) as total_discount_received
    FROM sales
    WHERE ${conditions.join(' AND ')}
    GROUP BY customer_id
    ORDER BY total_spent DESC
  `;

  const res = await query(sql, params);
  const customers = res.rows.map(r => ({
    _id: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerEmail: r.customer_email,
    totalOrders: Number(r.total_orders) || 0,
    totalSpent: Number(r.total_spent) || 0,
    lastVisit: r.last_visit,
    firstVisit: r.first_visit,
    averageOrderValue: Number(r.average_order_value) || 0,
    totalDiscountReceived: Number(r.total_discount_received) || 0
  }));

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);

  return {
    totalCustomers: customers.length,
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    customers
  };
};

exports.getTopCustomers = async (storeId, limit = 5) => {
  const sql = `
    SELECT
      customer_details->>'name' as name,
      customer_details->>'phone' as phone,
      COUNT(*) as total_orders,
      COALESCE(SUM(grand_total), 0) as total_spent,
      MAX(date_time) as last_order_date
    FROM sales
    WHERE store_id = $1 AND customer_details->>'name' IS NOT NULL AND TRIM(customer_details->>'name') != ''
    GROUP BY customer_details->>'name', customer_details->>'phone'
    ORDER BY total_spent DESC
    LIMIT $2
  `;
  const res = await query(sql, [storeId, Number(limit)]);
  return res.rows.map(r => ({
    name: r.name || 'Anonymous Customer',
    phone: r.phone || 'N/A',
    totalOrders: Number(r.total_orders) || 0,
    totalSpent: Number(r.total_spent) || 0,
    lastOrderDate: r.last_order_date
  }));
};

exports.getCustomerPurchaseHistory = async (storeId, customerPhone) => {
  const sql = `
    SELECT *
    FROM sales
    WHERE store_id = $1 AND customer_details->>'phone' = $2
    ORDER BY date_time DESC
  `;
  const res = await query(sql, [storeId, customerPhone]);
  return res.rows.map(r => ({
    transactionId: r.transaction_id,
    dateTime: r.date_time,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
    grandTotal: Number(r.grand_total) || 0,
    paymentMethod: r.payment_method
  }));
};
