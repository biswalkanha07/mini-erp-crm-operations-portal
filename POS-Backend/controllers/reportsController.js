const Sale = require('../models/Sale');
const { parseISO, startOfDay, endOfDay } = require("date-fns");
const { zonedTimeToUtc } = require('date-fns-tz');

// Test endpoint to see all sales data
exports.testSalesData = async (req, res) => {
  try {
    const { storeId } = req.params;
    const sales = await Sale.find({ storeId }).limit(10);
    res.json({
      storeId,
      totalSales: sales.length,
      sales: sales.map(sale => ({
        transactionId: sale.transactionId,
        customerDetails: sale.customerDetails,
        grandTotal: sale.grandTotal,
        dateTime: sale.dateTime,
        paymentMethod: sale.paymentMethod
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
    
    // First, let's check what sales data exists for this store
    // const allSales = await Sale.find({ storeId }).limit(5);
    // console.log('Sample sales for store:', storeId, allSales.map(sale => ({
    //   transactionId: sale.transactionId,
    //   customerDetails: sale.customerDetails,
    //   grandTotal: sale.grandTotal,
    //   dateTime: sale.dateTime
    // })));
    
    // Build date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      const timeZone = "Asia/Kolkata";
      const start = zonedTimeToUtc(startOfDay(parseISO(startDate)), timeZone);
      const end = zonedTimeToUtc(endOfDay(parseISO(endDate)), timeZone);
      dateFilter = { dateTime: { $gte: start, $lte: end } };
    }

    // Build search filter if provided
    let searchFilter = {};
    if (searchTerm) {
      const phoneSearchTerm = searchTerm.replace(/\D/g, ''); // Extract digits for phone search
      const searchConditions = [];

      // Search in customer name
      searchConditions.push({
        'customerDetails.name': { 
          $regex: searchTerm, 
          $options: 'i' 
        }
      });

      // Add phone search if search term contains digits
      if (phoneSearchTerm.length > 0) {
        searchConditions.push({
          'customerDetails.phone': { 
            $regex: phoneSearchTerm, 
            $options: 'i' 
          }
        });
      }

      searchFilter = { $or: searchConditions };
    }

    // Aggregate customer data
    const customerReports = await Sale.aggregate([
      {
        $match: {
          storeId: storeId,
          ...dateFilter,
          ...searchFilter
        }
      },
      {
        $addFields: {
          // Create a customer identifier - use phone if available, otherwise name, otherwise email, otherwise 'anonymous'
          customerId: {
            $cond: {
              if: { $and: [{ $ne: ['$customerDetails.phone', null] }, { $ne: ['$customerDetails.phone', ''] }] },
              then: '$customerDetails.phone',
              else: {
                $cond: {
                  if: { $and: [{ $ne: ['$customerDetails.name', null] }, { $ne: ['$customerDetails.name', ''] }] },
                  then: '$customerDetails.name',
                  else: {
                    $cond: {
                      if: { $and: [{ $ne: ['$customerDetails.email', null] }, { $ne: ['$customerDetails.email', ''] }] },
                      then: '$customerDetails.email',
                      else: 'anonymous'
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$customerId',
          name: { $first: '$customerDetails.name' },
          phone: { $first: '$customerDetails.phone' },
          email: { $first: '$customerDetails.email' },
          totalVisits: { $sum: 1 },
          totalPurchases: { $sum: 1 }, // Same as visits for now, could be different if we track visits separately
          totalSpent: { $sum: '$grandTotal' },
          firstVisit: { $min: '$dateTime' },
          lastVisit: { $max: '$dateTime' },
          transactions: { $push: '$grandTotal' }
        }
      },
      {
        $addFields: {
          averageOrderValue: {
            $divide: ['$totalSpent', '$totalPurchases']
          }
        }
      },
      {
        $sort: { totalSpent: -1 }
      }
    ]);

    // Transform the data to match frontend expectations
    const customers = customerReports.map(report => ({
      _id: report._id,
      name: report.name || (report._id === 'anonymous' ? null : report._id),
      phone: report.phone || null,
      email: report.email || null,
      totalVisits: report.totalVisits,
      totalPurchases: report.totalPurchases,
      totalSpent: report.totalSpent,
      firstVisit: report.firstVisit,
      lastVisit: report.lastVisit,
      averageOrderValue: report.averageOrderValue
    }));

    // Calculate summary statistics
    const totalCustomers = customers.length;
    const totalVisits = customers.reduce((sum, customer) => sum + customer.totalVisits, 0);
    const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

    // console.log('Customer reports generated:', {
    //   storeId,
    //   totalCustomers,
    //   totalVisits,
    //   totalRevenue,
    //   sampleCustomers: customers.slice(0, 3)
    // });

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

    const topCustomers = await Sale.aggregate([
      {
        $match: {
          storeId: storeId,
          $or: [
            { 'customerDetails.name': { $exists: true, $ne: '' } },
            { 'customerDetails.phone': { $exists: true, $ne: '' } },
            { 'customerDetails.email': { $exists: true, $ne: '' } }
          ]
        }
      },
      {
        $group: {
          _id: {
            name: '$customerDetails.name',
            phone: '$customerDetails.phone',
            email: '$customerDetails.email'
          },
          totalSpent: { $sum: '$grandTotal' },
          totalVisits: { $sum: 1 },
          lastVisit: { $max: '$dateTime' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const customers = topCustomers.map(customer => ({
      _id: `${customer._id.name || 'anonymous'}-${customer._id.phone || 'nophone'}`,
      name: customer._id.name || 'Anonymous Customer',
      phone: customer._id.phone,
      email: customer._id.email,
      totalSpent: customer.totalSpent,
      totalVisits: customer.totalVisits,
      lastVisit: customer.lastVisit
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

    // Build customer filter
    const customerFilter = [];
    if (customerPhone) customerFilter.push({ 'customerDetails.phone': customerPhone });
    if (customerEmail) customerFilter.push({ 'customerDetails.email': customerEmail });
    if (customerName) customerFilter.push({ 'customerDetails.name': customerName });

    const purchases = await Sale.find({
      storeId: storeId,
      $or: customerFilter
    })
    .sort({ dateTime: -1 })
    .populate('storeId', 'storeName')
    .populate('cashier', 'name');

    res.json(purchases);

  } catch (err) {
    console.error('Error getting customer purchase history:', err);
    res.status(500).json({ error: err.message });
  }
};
