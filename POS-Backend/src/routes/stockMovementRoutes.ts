/**
 * Stock Movement Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as stockMovementController from '../controllers/stockMovementController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read stock movements - accessible to all authenticated ERP roles (Admin, Warehouse, Sales, Accounts, legacy POS)
router.get('/', auth, stockMovementController.getAllStockMovements);
router.get('/:id', auth, stockMovementController.getStockMovementById);

// Create stock movement - strictly restricted to Admin and Warehouse
router.post('/', auth, requireRole('Admin', 'Warehouse'), stockMovementController.createStockMovement);

export default router;
