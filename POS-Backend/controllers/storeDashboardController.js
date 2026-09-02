const Sale = require('../models/Sale');
const Catalogue = require('../models/Catalogue');

// GET /stores/:storeId/dashboard/stats
exports.getStoreStats = async (req, res) => {
  try {
    const { storeId } = req.params;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySalesAgg, weekSalesAgg, monthSalesAgg] = await Promise.all([
      Sale.aggregate([
        { $match: { storeId, dateTime: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Sale.aggregate([
        { $match: { storeId, dateTime: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Sale.aggregate([
        { $match: { storeId, dateTime: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ])
    ]);

    // Out of stock products: global catalogue (adjust if store-specific stock exists)
    const outOfStockProducts = await Catalogue.countDocuments({ stock: 0 });

    // Unique customers for this store (based on customerName in Sale)
    const uniqueCustomersAgg = await Sale.aggregate([
      { $match: { storeId } },
      { $group: { _id: '$customerName' } },
      { $count: 'count' }
    ]);
    const totalCustomers = uniqueCustomersAgg[0]?.count || 0;

    res.json({
      todaySales: todaySalesAgg[0]?.total || 0,
      thisWeekSales: weekSalesAgg[0]?.total || 0,
      thisMonthSales: monthSalesAgg[0]?.total || 0,
      outOfStockProducts,
      totalCustomers
    });
  } catch (err) {
    console.error('Error fetching store stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /stores/:storeId/dashboard/monthly-sales
exports.getStoreMonthlySales = async (req, res) => {
  try {
    const { storeId } = req.params;
    const currentYear = new Date().getFullYear();

    const monthlySales = await Sale.aggregate([
      {
        $match: {
          storeId,
          dateTime: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) }
        }
      },
      { $group: { _id: { $month: '$dateTime' }, totalSales: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = monthNames.map((label, idx) => {
      const found = monthlySales.find(s => s._id === idx + 1);
      return { label, value: found ? found.totalSales : 0, count: found ? found.count : 0 };
    });

    res.json(data);
  } catch (err) {
    console.error('Error fetching store monthly sales:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /stores/:storeId/dashboard/payment-split
exports.getStorePaymentSplit = async (req, res) => {
  try {
    const { storeId } = req.params;
    const split = await Sale.aggregate([
      { $match: { storeId } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } },
      { $project: { method: '$_id', count: 1, total: 1, _id: 0 } }
    ]);
    res.json(split);
  } catch (err) {
    console.error('Error fetching store payment split:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /stores/:storeId/dashboard/top-products
exports.getStoreTopProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const top = await Sale.aggregate([
      { $match: { storeId } },
      { $unwind: '$items' },
      { $group: { _id: '$items.sku', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }, unitPrice: { $avg: '$items.unitPrice' } } },
      { $sort: { quantity: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'catalogues',
          localField: '_id',
          foreignField: 'sku',
          as: 'catalogue'
        }
      },
      { $unwind: { path: '$catalogue', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, sku: '$_id', quantity: 1, revenue: 1, unitPrice: { $ifNull: ['$unitPrice', '$catalogue.price'] }, itemName: { $ifNull: ['$catalogue.itemName', ''] } } }
    ]);
    res.json(top);
  } catch (err) {
    console.error('Error fetching store top products:', err);
    res.status(500).json({ error: err.message });
  }
};


