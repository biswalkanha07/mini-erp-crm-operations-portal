/**
 * Reports Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as reportsController from '../controllers/reportsController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Customer and store reports
router.get('/test-sales/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.testSalesData);
router.get('/customers/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.getCustomerReports);
router.get('/top-customers/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.getTopCustomers);
router.get('/customer-history/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.getCustomerPurchaseHistory);

export default router;
