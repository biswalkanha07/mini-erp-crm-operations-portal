const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizationController');

router.post('/', orgController.createOrganization);
router.get('/', orgController.getAllOrganizations);
router.get('/:id', orgController.getOrganizationById);
router.put('/:id', orgController.updateOrganizationById);
router.delete('/:id', orgController.deleteOrganizationById);

module.exports = router;
