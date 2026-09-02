const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Customer List & Details
router.get('/', auth, requireRole('Admin', 'Sales', 'Accounts', 'Warehouse', 'manager', 'cashier'), customerController.listCustomers);
router.get('/:id', auth, requireRole('Admin', 'Sales', 'Accounts', 'Warehouse', 'manager', 'cashier'), customerController.getCustomerById);

// Customer Mutations
router.post('/', auth, requireRole('Admin', 'Sales'), customerController.createCustomer);
router.put('/:id', auth, requireRole('Admin', 'Sales'), customerController.updateCustomer);
router.delete('/:id', auth, requireRole('Admin'), customerController.deleteCustomer);

// Customer Follow-ups
router.get('/:id/follow-ups', auth, requireRole('Admin', 'Sales', 'Accounts', 'Warehouse'), customerController.listFollowups);
router.post('/:id/follow-ups', auth, requireRole('Admin', 'Sales'), customerController.addFollowup);

module.exports = router;
