const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

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

module.exports = router;
