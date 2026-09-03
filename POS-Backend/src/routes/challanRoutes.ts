/**
 * Challan Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as challanController from '../controllers/challanController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(auth);

// View routes (Admin, Sales, Warehouse, Accounts, POS roles)
router.get('/', requireRole('Admin', 'Sales', 'Warehouse', 'Accounts', 'admin', 'manager', 'cashier'), challanController.getAllChallans);
router.get('/:id', requireRole('Admin', 'Sales', 'Warehouse', 'Accounts', 'admin', 'manager', 'cashier'), challanController.getChallanById);

// Mutation routes (Admin and Sales only)
router.post('/', requireRole('Admin', 'Sales'), challanController.createChallan);
router.put('/:id', requireRole('Admin', 'Sales'), challanController.updateDraftChallan);
router.post('/:id/confirm', requireRole('Admin', 'Sales'), challanController.confirmChallan);
router.post('/:id/cancel', requireRole('Admin', 'Sales'), challanController.cancelChallan);

export default router;
