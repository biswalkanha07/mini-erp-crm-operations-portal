const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Catalogue = require('../models/Catalogue');
const Store = require('../models/Store');
const StorePrice = require('../models/StorePrice');
const { parseISO, startOfDay, endOfDay, endOfToday } = require("date-fns");
// const tz = require("date-fns-tz");

// const  zonedTimeToUtc  = tz.zonedTimeToUtc;
const { zonedTimeToUtc } = require('date-fns-tz');

// Get all sales/transactions (optionally filter by storeId)
exports.getAllSales = async (req, res) => {
  try {
    const { storeId } = req.query;
    const query = {};
    if (storeId) {
      query.storeId = storeId;
    }
    const sales = await Sale.find(query)
      .populate('storeId')
      .populate('cashier')
      .sort({ dateTime: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new POS transaction
exports.createTransaction = async (req, res) => {
  try {
    const {
      storeId,
      items,
      paymentMethod,
      customerDetails,
      cashier
    } = req.body;

    // Validate store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // GST is now per product; default fallback is 0
    const storeGstRate = 0;
    let subTotal = 0;
    let gstTotal = 0;
    let discountTotal = 0;

    const processedItems = await Promise.all(items.map(async (item) => {
      // Get product details from catalogue
      const product = await Catalogue.findOne({ sku: item.sku });
      if (!product) {
        throw new Error(`Product with SKU ${item.sku} not found`);
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.itemName}. Available: ${product.stock}`);
      }

      // Determine effective price for store
      const override = await StorePrice.findOne({ storeId, sku: item.sku, status: 'active' });
      const basePrice = Number(product.price) || 0;
      let effectivePrice = basePrice;
      if (override) {
        if (typeof override.overridePrice === 'number') {
          effectivePrice = Number(override.overridePrice);
        } else {
          const margin = Number(override.marginValue) || 0;
          effectivePrice = override.marginType === 'absolute' ? basePrice + margin : basePrice + (basePrice * margin / 100);
        }
      } else {
        // Fallback: use store-wide profit margin percent if no per-SKU override
        const storeMargin = Number(store.profitMarginPercent) || 0;
        effectivePrice = basePrice + (basePrice * storeMargin / 100);
      }

      const itemSubTotal = Number(item.quantity) * effectivePrice;
      const itemDiscount = item.discount || 0;
      // Calculate GST for each product using product gstRate if present, else store rate
      const productGstRate = typeof product.gstRate === 'number' ? Number(product.gstRate) : null;
      const effectiveGstRate = (productGstRate !== null && !Number.isNaN(productGstRate)) ? productGstRate : storeGstRate;
      const itemGst = ((itemSubTotal - itemDiscount) * effectiveGstRate) / 100;
      const itemTotal = itemSubTotal - itemDiscount + itemGst;

      subTotal += itemSubTotal;
      discountTotal += itemDiscount;
      gstTotal += itemGst;

      return {
        sku: item.sku,
        itemName: product.itemName,
        quantity: item.quantity,
        pricePerUnit: effectivePrice,
        gstRate: effectiveGstRate,
        gst: itemGst,
        discount: itemDiscount,
        totalAmount: itemTotal
      };
    }));

    const grandTotal = subTotal - discountTotal + gstTotal;

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create transaction
    const transaction = new Sale({
      transactionId,
      storeId,
      items: processedItems,
      subTotal,
      gstTotal,
      discountTotal,
      grandTotal,
      paymentMethod,
      customerDetails,
      cashier
    });

    await transaction.save();

    // Update stock for all items
    await Promise.all(items.map(async (item) => {
      await Catalogue.findOneAndUpdate(
        { sku: item.sku },
        { $inc: { stock: -item.quantity } }
      );
    }));

    res.status(201).json({
      message: 'Transaction created successfully',
      transactionId,
      transaction
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Sale.findById(req.params.id)
      .populate('storeId')
      .populate('cashier');
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transactions by store 
// with optional filters and search
exports.getTransactionsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { filter, search, date, startDate, endDate } = req.query; // filter & search from query params

    const query = { storeId };
    const timeZone = "Asia/Kolkata";

    // Apply filter
    if (filter === 'today') {
      const start = zonedTimeToUtc(startOfDay(new Date()), timeZone);
      const end = zonedTimeToUtc(endOfToday(), timeZone);
      query.dateTime = { $gte: start, $lt: end };
    }

    // Yesterday's filter
    if (filter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const start = zonedTimeToUtc(startOfDay(yesterday), timeZone);
      const end = zonedTimeToUtc(endOfDay(yesterday), timeZone);
      query.dateTime = { $gte: start, $lt: end };
    }

    // Single date
    if (date) {
      const parsedDate = parseISO(date);
      const start = zonedTimeToUtc(startOfDay(parsedDate), timeZone);
      const end = zonedTimeToUtc(endOfDay(parsedDate), timeZone);
      query.dateTime = { $gte: start, $lt: end };
    }
    // Date range
    if (startDate && endDate) {
      const start = zonedTimeToUtc(startOfDay(parseISO(startDate)), timeZone);
      const end = zonedTimeToUtc(endOfDay(parseISO(endDate)), timeZone);
      query.dateTime = { $gte: start, $lt: end };
    }

    // Payment filter
    if (['cash', 'card', 'UPI'].includes(filter)) {
      query.paymentMethod = filter;
    }

    // Apply search
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    // const transactions = await Sale.find({ storeId })
    const transactions = await Sale.find(query)
      .populate('storeId')
      .populate('cashier')
      .sort({ dateTime: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get product by SKU (for barcode scanning)
exports.getProductBySKU = async (req, res) => {
  try {
    const { sku } = req.params;
    const product = await Catalogue.findOne({ sku }).populate('categoryId');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get product by barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Catalogue.findOne({ barcode }).populate('categoryId');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sales by date range (optionally filter by storeId)
exports.getSalesByDateRange = async (req, res) => {
  try {
    const { start, end, storeId } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const query = {
      dateTime: { $gte: startDate, $lte: endDate }
    };
    if (storeId) query.storeId = storeId;
    const sales = await Sale.find(query)
      .populate('storeId')
      .populate('cashier')
      .sort({ dateTime: -1 });

    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sales by transaction ID
exports.getSalesByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const sale = await Sale.findOne({ transactionId })
      .populate('storeId')
      .populate('cashier');

    if (!sale) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const totalSales = await Sale.countDocuments();
    const totalRevenue = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await Sale.countDocuments({
      dateTime: { $gte: today, $lt: tomorrow }
    });

    const todayRevenue = await Sale.aggregate([
      {
        $match: {
          dateTime: { $gte: today, $lt: tomorrow }
        }
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const paymentMethodStats = await Sale.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$grandTotal' }
        }
      }
    ]);

    res.json({
      totalSales,
      totalRevenue: totalRevenue[0]?.total || 0,
      todaySales,
      todayRevenue: todayRevenue[0]?.total || 0,
      paymentMethodStats
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

    // Build dynamic search query
    const query = {};

    // Store filter
    if (storeId) {
      query.storeId = storeId;
    }

    // Search term filter (customerName OR phone - partial match, case-insensitive)
    if (searchTerm) {
      // For phone search, extract only digits
      const phoneSearchTerm = searchTerm.replace(/\D/g, ''); // Keep only digits for phone search
      
      const searchConditions = [
        // Search in customer name (original search term with all characters)
        {
          'customerDetails.name': { 
            $regex: searchTerm, 
            $options: 'i' 
          }
        }
      ];

      // Only add phone search condition if we have digits in the search term
      if (phoneSearchTerm.length > 0) {
        searchConditions.push({
          'customerDetails.phone': { 
            $regex: phoneSearchTerm, 
            $options: 'i' 
          }
        });
      }

      query.$or = searchConditions;
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (startDate || endDate) {
      query.dateTime = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.dateTime.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateTime.$lte = end;
      }
    }

    // Pagination settings
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 100); // Max 100 records per page
    const skip = (pageNum - 1) * limitNum;

    // Sort settings
    const sortOptions = {};
    const validSortFields = ['dateTime', 'grandTotal', 'customerDetails.name', 'transactionId', 'paymentMethod'];
    const field = validSortFields.includes(sortField) ? sortField : 'dateTime';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOptions[field] = order;

    // Execute query with pagination
    const [transactions, totalRecords] = await Promise.all([
      Sale.find(query)
        .populate('storeId', 'storeName storeId')
        .populate('cashier', 'username')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Sale.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalRecords / limitNum);

    // Format response
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      transactionId: transaction.transactionId,
      dateTime: transaction.dateTime,
      customerName: transaction.customerDetails?.name || 'Walk-in Customer',
      phoneNumber: transaction.customerDetails?.phone || '',
      paymentMethod: transaction.paymentMethod,
      amount: transaction.grandTotal,
      itemsCount: transaction.items?.length || 0,
      storeName: transaction.storeId?.storeName || 'Unknown Store',
      storeCode: transaction.storeId?.storeId || '',
      cashier: transaction.cashier?.username || 'System',
      items: transaction.items || [],
      subTotal: transaction.subTotal,
      gstTotal: transaction.gstTotal,
      discountTotal: transaction.discountTotal,
      customerDetails: transaction.customerDetails
    }));

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
        sortField: field,
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

// Get today's sales
// const moment = require("moment-timezone");

// exports.getTodaysSales = async (req, res) => {
//   try {
//     const now = new Date();
//     //today.setHours(0, 0, 0, 0);
//     //const tomorrow = new Date(today);
//     //tomorrow.setDate(tomorrow.getDate() + 1);

//     //const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // Indian Standard time

//     //const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

//     // Force to IST
//     const startOfToday = moment().tz("Asia/Kolkata").startOf("day").toDate();
//     const endOfToday = moment().tz("Asia/Kolkata").endOf("day").toDate();
//     const sales = await Sale.find({
//       dateTime: { $gte: startOfToday, $lt: endOfToday }
//     })
//       .populate('storeId')
//       .populate('cashier')
//       .sort({ dateTime: -1 });

//     res.json(sales);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Get sales by payment method (optionally filter by storeId)
exports.getSalesByPaymentMethod = async (req, res) => {
  try {
    const { paymentMethod } = req.params;
    const { storeId } = req.query;
    const query = { paymentMethod };
    if (storeId) query.storeId = storeId;
    const sales = await Sale.find(query)
      .populate('storeId')
      .populate('cashier')
      .sort({ dateTime: -1 });

    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
