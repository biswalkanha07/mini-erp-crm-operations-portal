/**
 * Order Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Store creates order
router.post('/', auth, requireRole('Admin', 'Sales', 'manager', 'cashier'), orderController.createOrder);

// Store gets own orders
router.get('/my', auth, requireRole('Admin', 'Sales', 'manager', 'cashier'), orderController.getStoreOrders);

// Admin & operational roles get all orders
router.get('/', auth, requireRole('Admin', 'Sales', 'Warehouse', 'Accounts'), orderController.getAllOrders);

// Admin & Warehouse update order status
router.patch('/:id', auth, requireRole('Admin', 'Warehouse'), orderController.updateOrderStatus);

export default router;
