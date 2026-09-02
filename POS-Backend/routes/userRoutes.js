const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// User management endpoints - restricted to Admin
router.get('/', auth, requireRole('Admin'), userController.getAllUsers);
router.get('/:id', auth, requireRole('Admin'), userController.getUserById);
router.post('/', auth, requireRole('Admin'), userController.createUser);
router.put('/:id', auth, requireRole('Admin'), userController.updateUser);
router.delete('/:id', auth, requireRole('Admin'), userController.deleteUser);

module.exports = router;
