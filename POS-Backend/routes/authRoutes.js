const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const {
  validateLogin,
  validateOrganizationSignup,
  validateStoreSignup,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validation');

// Public routes with validation
router.post('/login', validateLogin, authController.login);
router.post('/organization/signup', validateOrganizationSignup, authController.organizationSignup);
router.post('/store/signup', validateStoreSignup, authController.storeSignup);
// Optional: verification endpoint if frontend needs pre-check
router.post('/store/verify-signup-token', async (req, res) => {
  try {
    const { email, storeId, token } = req.body;
    const user = await require('../models/User').findOne({ email: (email||'').toLowerCase().trim(), storeId });
    if (!user || user.status !== 'pending' || !user.signupToken || user.signupToken !== token || !user.signupTokenExpires || user.signupTokenExpires < new Date()) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired signup token' });
    }
    return res.json({ status: 'success', message: 'Token valid' });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
});
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Legacy routes (keeping for backward compatibility)
router.post('/organization/login', authController.organizationLogin);
router.post('/store/login', authController.storeLogin);
router.post('/organization/register', authController.createOrganizationUser);
router.post('/store/register', authController.createStoreUser);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
