/**
 * Organization Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as orgController from '../controllers/organizationController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read organizations
router.get('/', auth, orgController.getAllOrganizations);
router.get('/:id', auth, orgController.getOrganizationById);

// Modify organizations - restricted to Admin
router.post('/', auth, requireRole('Admin'), orgController.createOrganization);
router.put('/:id', auth, requireRole('Admin'), orgController.updateOrganizationById);
router.delete('/:id', auth, requireRole('Admin'), orgController.deleteOrganizationById);

export default router;
