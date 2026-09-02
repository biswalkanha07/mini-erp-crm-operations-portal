// const Invoice = require('../models/Invoice');
// const Sale = require('../models/Sale');
// const Store = require('../models/Store');
// const Organization = require('../models/Organization');

// // Generate invoice from transaction
// exports.generateInvoice = async (req, res) => {
//   try {
//     const { transactionId } = req.body;
    
//     // Get transaction details
//     const transaction = await Sale.findById(transactionId).populate('storeId');
//     if (!transaction) {
//       return res.status(404).json({ error: 'Transaction not found' });
//     }

//     // Get store and organization details
//     const store = await Store.findById(transaction.storeId);
//     if (!store) {
//       return res.status(404).json({ error: 'Store not found' });
//     }
    
//     const organization = await Organization.findById(store.organizationId);
//     if (!organization) {
//       return res.status(404).json({ error: 'Organization not found' });
//     }

//     // Generate invoice number
//     const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

//     // Recalculate GST for each item using store gstRate
//     const gstRate = store.gstRate || 0;
//     let gstTotal = 0;
//     const recalculatedItems = transaction.items.map(item => {
//       const itemSubTotal = item.quantity * item.pricePerUnit;
//       const itemDiscount = item.discount || 0;
//       const itemGst = ((itemSubTotal - itemDiscount) * gstRate) / 100;
//       gstTotal += itemGst;
//       return {
//         ...item,
//         gst: itemGst,
//         totalAmount: itemSubTotal - itemDiscount + itemGst
//       };
//     });

//     const subTotal = recalculatedItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
//     const discountTotal = recalculatedItems.reduce((sum, item) => sum + item.discount, 0);
//     const grandTotal = subTotal - discountTotal + gstTotal;

//     const invoiceData = {
//       invoiceNo,
//       transactionId: transaction._id,
//       storeId: transaction.storeId,
//       organizationId: store.organizationId,
//       items: recalculatedItems,
//       totalAmount: grandTotal,
//       gstTotal,
//       paymentMode: transaction.paymentMethod,
//       qrCodeUrl: transaction.paymentMethod === 'UPI' ? generateUPIQR(organization, grandTotal) : null,
//       dateTime: transaction.dateTime,
//       customerDetails: transaction.customerDetails,
//       status: 'paid',
//       dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
//     };

//     const invoice = new Invoice(invoiceData);
//     await invoice.save();

//     res.status(201).json({
//       message: 'Invoice generated successfully',
//       invoiceNo,
//       invoice
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// // Get all invoices
// exports.getAllInvoices = async (req, res) => {
//   try {
//     const invoices = await Invoice.find()
//       .populate('transactionId')
//       .populate('storeId')
//       .populate('organizationId');
//     res.json(invoices);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get invoice by ID
// exports.getInvoiceById = async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.id)
//       .populate('transactionId')
//       .populate('storeId')
//       .populate('organizationId');
//     if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
//     res.json(invoice);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get invoices by store
// exports.getInvoicesByStore = async (req, res) => {
//   try {
//     const { storeId } = req.params;
//     const invoices = await Invoice.find({ storeId })
//       .populate('transactionId')
//       .populate('storeId')
//       .populate('organizationId');
//     res.json(invoices);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Generate UPI QR code URL (mock implementation)
// function generateUPIQR(organization, amount) {
//   // This would typically generate a UPI QR code
//   // For now, returning a mock URL
//   return `https://upiqr.in/pay?pa=${organization.gstNumber}@paytm&pn=${organization.organizationName}&am=${amount}&cu=INR`;
// }

