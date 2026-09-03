/**
 * User Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as userController from '../controllers/userController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// User management endpoints - restricted to Admin
router.get('/', auth, requireRole('Admin'), userController.getAllUsers);
router.get('/:id', auth, requireRole('Admin'), userController.getUserById);
router.post('/', auth, requireRole('Admin'), userController.createUser);
router.put('/:id', auth, requireRole('Admin'), userController.updateUser);
router.delete('/:id', auth, requireRole('Admin'), userController.deleteUser);

export default router;
