const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const userService = require('../services/userService');
const {
  validateLogin,
  validateOrganizationSignup,
  validateStoreSignup,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validation');

// Public routes with validation
router.post('/login', validateLogin, authController.login);
router.post('/register-admin', authController.registerInitialAdmin);
router.post('/initial-admin', authController.registerInitialAdmin);
router.post('/organization/signup', validateOrganizationSignup, authController.organizationSignup);
router.post('/store/signup', validateStoreSignup, authController.storeSignup);

// Verification endpoint for store signup token
router.post('/store/verify-signup-token', async (req, res) => {
  try {
    const { email, storeId, token } = req.body;
    const user = await userService.getByEmail(email);
    if (
      !user ||
      user.storeId !== storeId ||
      user.status !== 'pending' ||
      !user.signupToken ||
      user.signupToken !== token ||
      !user.signupTokenExpires ||
      new Date(user.signupTokenExpires) < new Date()
    ) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired signup token' });
    }
    return res.json({ status: 'success', message: 'Token valid' });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
});

router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Legacy login routes (public)
router.post('/organization/login', authController.organizationLogin);
router.post('/store/login', authController.storeLogin);

// Protected user registration (restricted to Admin)
router.post('/organization/register', authMiddleware, requireRole('Admin'), authController.createOrganizationUser);
router.post('/store/register', authMiddleware, requireRole('Admin'), authController.createStoreUser);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
