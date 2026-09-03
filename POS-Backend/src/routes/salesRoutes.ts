/**
 * Sales Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as salesController from '../controllers/salesController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Product lookup routes (for POS barcode scanner & terminal) - all authenticated users
router.get('/product/sku/:sku', auth, salesController.getProductBySKU);
router.get('/product/barcode/:barcode', auth, salesController.getProductByBarcode);

// Transaction creation - POS Terminal (Admin, Sales, and store staff manager/cashier)
router.post('/transaction', auth, requireRole('Admin', 'Sales', 'manager', 'cashier'), salesController.createTransaction);

// Transaction search and listing (Admin, Sales, Accounts, and store staff)
router.get('/search', auth, requireRole('Admin', 'Sales', 'Accounts', 'manager', 'cashier'), salesController.advancedSearch);
router.get('/', auth, requireRole('Admin', 'Sales', 'Accounts', 'manager', 'cashier'), salesController.getAllSales);
router.get('/transaction/:id', auth, requireRole('Admin', 'Sales', 'Accounts', 'manager', 'cashier'), salesController.getTransactionById);
router.get('/store/:storeId', auth, requireRole('Admin', 'Sales', 'Accounts', 'manager', 'cashier'), salesController.getTransactionsByStore);

// Sales filtering and statistics routes
router.get('/date-range', auth, requireRole('Admin', 'Sales', 'Accounts', 'manager', 'cashier'), salesController.getSalesByDateRange);
router.get('/transaction-id/:transactionId', auth, requireRole('Admin', 'Sales', 'Accounts', 'manager', 'cashier'), salesController.getSalesByTransactionId);
router.get('/stats', auth, requireRole('Admin', 'Sales', 'Accounts'), salesController.getSalesStats);
router.get('/payment-method/:paymentMethod', auth, requireRole('Admin', 'Sales', 'Accounts', 'manager', 'cashier'), salesController.getSalesByPaymentMethod);

export default router;
