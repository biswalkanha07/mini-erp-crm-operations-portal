// Get sales per store for org admin dashboard
exports.getSalesByStore = async (req, res) => {
  try {
    // Optionally, filter by organizationId if needed (e.g., req.user.organizationId)
    const salesByStore = await Sale.aggregate([
      {
        $group: {
          _id: '$storeId',
          totalSales: { $sum: '$grandTotal' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: 'storeId',
          as: 'storeInfo'
        }
      },
      { $unwind: { path: '$storeInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          storeId: '$_id',
          storeName: '$storeInfo.storeName',
          totalSales: 1,
          transactionCount: 1,
          _id: 0
        }
      },
      { $sort: { totalSales: -1 } }
    ]);
    res.json(salesByStore);
  } catch (err) {
    console.error('Error fetching sales by store:', err);
    res.status(500).json({ error: err.message });
  }
};
const Sale = require('../models/Sale');
const Invoice = require('../models/Invoice');
const Catalogue = require('../models/Catalogue');
const Store = require('../models/Store');
const Organization = require('../models/Organization');

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calculate today's sales
    const todaySales = await Sale.aggregate([
      {
        $match: {
          dateTime: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' }
        }
      }
    ]);

    // Calculate this week's sales
    const thisWeekSales = await Sale.aggregate([
      {
        $match: {
          dateTime: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' }
        }
      }
    ]);

    // Calculate this month's sales
    const thisMonthSales = await Sale.aggregate([
      {
        $match: {
          dateTime: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' }
        }
      }
    ]);

    // Count out of stock products
    const outOfStockProducts = await Catalogue.countDocuments({ stock: 0 });

    // Count total customers (unique customer names from sales)
    const totalCustomers = await Sale.distinct('customerDetails.name').then(names => 
      names.filter(name => name && name.trim() !== '').length
    );

    // Calculate monthly profit (simplified - assuming 20% profit margin)
    const monthlyProfit = thisMonthSales.length > 0 ? thisMonthSales[0].total * 0.2 : 0;

    const stats = {
      todaySales: todaySales.length > 0 ? todaySales[0].total : 0,
      thisWeekSales: thisWeekSales.length > 0 ? thisWeekSales[0].total : 0,
      thisMonthSales: thisMonthSales.length > 0 ? thisMonthSales[0].total : 0,
      outOfStockProducts,
      totalCustomers,
      monthlyProfit
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get monthly sales data for charts
exports.getMonthlySales = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlySales = await Sale.aggregate([
      {
        $match: {
          dateTime: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$dateTime' },
          totalSales: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const salesData = monthNames.map((month, index) => {
      const monthData = monthlySales.find(sale => sale._id === index + 1);
      return {
        month,
        sales: monthData ? monthData.totalSales : 0,
        transactions: monthData ? monthData.count : 0
      };
    });

    res.json(salesData);
  } catch (err) {
    console.error('Error fetching monthly sales:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get most sold products
exports.getMostSoldProducts = async (req, res) => {
  try {
    const mostSoldProducts = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            sku: '$items.sku',
            itemName: '$items.itemName'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalAmount' }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          productName: '$_id.itemName',
          sku: '$_id.sku',
          quantitySold: '$totalQuantity',
          revenue: '$totalRevenue',
          _id: 0
        }
      }
    ]);

    res.json(mostSoldProducts);
  } catch (err) {
    console.error('Error fetching most sold products:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get sales trend data
exports.getSalesTrend = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let matchCondition = {};
    let groupFormat = {};

    const now = new Date();
    
    if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      matchCondition = { dateTime: { $gte: startOfWeek } };
      groupFormat = {
        year: { $year: '$dateTime' },
        month: { $month: '$dateTime' },
        day: { $dayOfMonth: '$dateTime' }
      };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      matchCondition = { dateTime: { $gte: startOfMonth } };
      groupFormat = {
        year: { $year: '$dateTime' },
        month: { $month: '$dateTime' },
        day: { $dayOfMonth: '$dateTime' }
      };
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      matchCondition = { dateTime: { $gte: startOfYear } };
      groupFormat = {
        year: { $year: '$dateTime' },
        month: { $month: '$dateTime' }
      };
    }

    const salesTrend = await Sale.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$grandTotal' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json(salesTrend);
  } catch (err) {
    console.error('Error fetching sales trend:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get profit data
exports.getProfitData = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let matchCondition = {};
    let groupFormat = {};

    const now = new Date();
    
    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      matchCondition = { dateTime: { $gte: startOfMonth } };
      groupFormat = {
        year: { $year: '$dateTime' },
        month: { $month: '$dateTime' }
      };
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      matchCondition = { dateTime: { $gte: startOfYear } };
      groupFormat = {
        year: { $year: '$dateTime' },
        month: { $month: '$dateTime' }
      };
    }

    const profitData = await Sale.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: '$grandTotal' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          // Assuming 20% profit margin
          profit: { $multiply: ['$totalRevenue', 0.2] },
          cost: { $multiply: ['$totalRevenue', 0.8] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json(profitData);
  } catch (err) {
    console.error('Error fetching profit data:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
  try {
    const customerStats = await Sale.aggregate([
      {
        $match: {
          'customerDetails.name': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$customerDetails.name',
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
          lastPurchase: { $max: '$dateTime' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 20
      }
    ]);

    const totalCustomers = customerStats.length;
    const totalCustomerRevenue = customerStats.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const averageOrderValue = totalCustomers > 0 ? totalCustomerRevenue / totalCustomers : 0;

    res.json({
      totalCustomers,
      totalCustomerRevenue,
      averageOrderValue,
      topCustomers: customerStats
    });
  } catch (err) {
    console.error('Error fetching customer stats:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get inventory statistics
exports.getInventoryStats = async (req, res) => {
  try {
    const inventoryStats = await Catalogue.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          },
          lowStock: {
            $sum: {
              $cond: [{ $lte: ['$stock', 10] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryStats = await Catalogue.aggregate([
      {
        $group: {
          _id: '$categoryId',
          productCount: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          categoryName: '$category.categoryName',
          productCount: 1,
          totalStock: 1,
          totalValue: 1
        }
      },
      {
        $sort: { productCount: -1 }
      }
    ]);

    res.json({
      overview: inventoryStats[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        outOfStock: 0,
        lowStock: 0
      },
      categoryBreakdown: categoryStats
    });
  } catch (err) {
    console.error('Error fetching inventory stats:', err);
    res.status(500).json({ error: err.message });
  }
};
