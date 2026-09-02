const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizationController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Read organizations
router.get('/', auth, orgController.getAllOrganizations);
router.get('/:id', auth, orgController.getOrganizationById);

// Modify organizations - restricted to Admin
router.post('/', auth, requireRole('Admin'), orgController.createOrganization);
router.put('/:id', auth, requireRole('Admin'), orgController.updateOrganizationById);
router.delete('/:id', auth, requireRole('Admin'), orgController.deleteOrganizationById);

module.exports = router;
