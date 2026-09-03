/**
 * Auth Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router, Request, Response } from 'express';
import * as authController from '../controllers/authController';
import authMiddleware from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import userService from '../services/userService';
import {
  validateLogin,
  validateOrganizationSignup,
  validateStoreSignup,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validation';

const router = Router();

// Public routes with validation
router.post('/login', validateLogin, authController.login);
router.post('/register-admin', authController.registerInitialAdmin);
router.post('/initial-admin', authController.registerInitialAdmin);
router.post('/organization/signup', validateOrganizationSignup, authController.organizationSignup);
router.post('/store/signup', validateStoreSignup, authController.storeSignup);

// Verification endpoint for store signup token
router.post('/store/verify-signup-token', async (req: Request, res: Response) => {
  try {
    const { email, storeId, token } = req.body || {};
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
  } catch (e: any) {
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

export default router;
