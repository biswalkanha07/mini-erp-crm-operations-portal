/**
 * Auth Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements authentication, signup, password resets, hardcoded test account resolution,
 * JWT generation, and profile retrieval.
 */

import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userService from '../services/userService';
import organizationService from '../services/organizationService';
import storeService from '../services/storeService';
import { sendPasswordResetEmail } from '../utils/emailService';

const TEST_ACCOUNTS: Record<string, any> = {
  'admin@test.com': {
    id: 'USER_ADMIN_TEST',
    userId: 'USER_ADMIN_TEST',
    name: 'Super Admin',
    role: 'Admin',
    password: 'password123',
    userType: 'organization',
    organizationId: 'ORG001',
    permissions: [
      { module: 'organization', actions: ['read', 'write', 'delete', 'manage'] },
      { module: 'store', actions: ['read', 'write', 'delete', 'manage'] },
      { module: 'inventory', actions: ['read', 'write', 'delete', 'manage'] },
      { module: 'pos', actions: ['read', 'write'] },
      { module: 'reports', actions: ['read', 'write'] },
      { module: 'users', actions: ['read', 'write', 'delete', 'manage'] },
      { module: 'sales', actions: ['read', 'write', 'delete', 'manage'] },
      { module: 'crm', actions: ['read', 'write', 'delete', 'manage'] }
    ]
  },
  'sales@test.com': {
    id: 'USER_SALES_TEST',
    userId: 'USER_SALES_TEST',
    name: 'Sales Representative',
    role: 'Sales',
    password: 'password123',
    userType: 'organization',
    organizationId: 'ORG001',
    permissions: [
      { module: 'crm', actions: ['read', 'write', 'manage'] },
      { module: 'challans', actions: ['read', 'write'] },
      { module: 'inventory', actions: ['read'] },
      { module: 'pos', actions: ['read', 'write'] }
    ]
  },
  'warehouse@test.com': {
    id: 'USER_WAREHOUSE_TEST',
    userId: 'USER_WAREHOUSE_TEST',
    name: 'Warehouse Officer',
    role: 'Warehouse',
    password: 'password123',
    userType: 'organization',
    organizationId: 'ORG001',
    permissions: [
      { module: 'inventory', actions: ['read', 'write', 'manage'] },
      { module: 'stock_movements', actions: ['read', 'write', 'manage'] },
      { module: 'challans', actions: ['read', 'write', 'manage'] },
      { module: 'products', actions: ['read', 'write', 'manage'] }
    ]
  },
  'accounts@test.com': {
    id: 'USER_ACCOUNTS_TEST',
    userId: 'USER_ACCOUNTS_TEST',
    name: 'Accounts Executive',
    role: 'Accounts',
    password: 'password123',
    userType: 'organization',
    organizationId: 'ORG001',
    permissions: [
      { module: 'invoices', actions: ['read', 'write', 'manage'] },
      { module: 'reports', actions: ['read', 'write'] },
      { module: 'sales', actions: ['read'] },
      { module: 'challans', actions: ['read'] }
    ]
  }
};

// Unified Login API
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || '').toLowerCase().trim();
    const testConfig = TEST_ACCOUNTS[normalizedEmail];
    const isHardcodedTestUser = !!testConfig && password === testConfig.password;

    // Find user by email
    let user = await userService.getByEmail(normalizedEmail);

    // Auto-create or ensure hardcoded test user if not yet present in DB
    if (!user && isHardcodedTestUser) {
      const hashedPassword = await bcrypt.hash(testConfig.password, 10);
      user = await userService.create({
        _id: testConfig.id,
        userId: testConfig.userId,
        name: testConfig.name,
        email: normalizedEmail,
        password: hashedPassword,
        userType: testConfig.userType,
        role: testConfig.role,
        organizationId: testConfig.organizationId,
        permissions: testConfig.permissions,
        status: 'active'
      });
    }

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password (allow hardcoded test account match or standard bcrypt comparison)
    const isPasswordValid = isHardcodedTestUser || (await bcrypt.compare(password, user.password || ''));
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active' && !isHardcodedTestUser) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is inactive'
      });
    }

    // Get additional details based on user type
    const additionalData: Record<string, any> = {};
    if (user.userType === 'organization') {
      const organization = user.organizationId ? await organizationService.getById(user.organizationId) : null;
      additionalData.organization = organization || (isHardcodedTestUser ? {
        id: 'ORG001',
        organizationId: 'ORG001',
        organizationName: 'Suguna Chicken 2'
      } : null);
    } else if (user.userType === 'store' && user.storeId) {
      const store = await storeService.getById(user.storeId);
      const organization = store?.organizationId ? await organizationService.getById(store.organizationId) : null;
      additionalData.store = store;
      additionalData.organization = organization;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.userType,
        role: user.role,
        organizationId: user.organizationId || (additionalData.store ? additionalData.store.organizationId : null),
        storeId: user.storeId
      },
      process.env.JWT_SECRET || 'your-very-long-random-string',
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          role: user.role,
          organizationId: user.organizationId || (additionalData.organization ? (additionalData.organization.organizationId || additionalData.organization.id) : null),
          storeId: user.storeId,
          ...additionalData
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Organization Signup API
export const organizationSignup = async (req: Request, res: Response) => {
  try {
    const { organizationId, email, password } = req.body || {};

    const organization = await organizationService.getById(organizationId);
    if (!organization) {
      return res.status(400).json({
        status: 'error',
        message: 'Organization ID not found'
      });
    }

    if ((organization.email || '').toLowerCase() !== (email || '').toLowerCase()) {
      return res.status(400).json({
        status: 'error',
        message: "Email does not match organization's registered contact email"
      });
    }

    const existingUser = await userService.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedUserId = `USER${Date.now().toString().slice(-6)}`;

    const user = await userService.create({
      _id: generatedUserId,
      userId: generatedUserId,
      name: organization.contactPersonName || 'Organization Admin',
      email,
      password: hashedPassword,
      userType: 'organization',
      role: 'admin',
      organizationId,
      permissions: [
        { module: 'organization', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'store', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'inventory', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'pos', actions: ['read', 'write'] },
        { module: 'reports', actions: ['read', 'write'] }
      ]
    });

    if (!user) throw new Error('Failed to create user');

    res.status(201).json({
      status: 'success',
      message: 'Organization signup successful',
      data: {
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          role: user.role,
          organizationId: user.organizationId
        }
      }
    });
  } catch (err: any) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Store Signup API
export const storeSignup = async (req: Request, res: Response) => {
  try {
    const { storeId, email, password, token } = req.body || {};

    const store = await storeService.getById(storeId);
    if (!store) {
      return res.status(400).json({
        status: 'error',
        message: 'Store ID not found'
      });
    }

    const organization = store.organizationId ? await organizationService.getById(store.organizationId) : null;
    if (!organization) {
      return res.status(400).json({
        status: 'error',
        message: 'Organization ID not found'
      });
    }

    if (email && (store.email || '').toLowerCase() !== (email || '').toLowerCase()) {
      return res.status(400).json({ status: 'error', message: "Email does not match store's registered contact email" });
    }

    let pendingUser = email ? await userService.getByEmail(email) : null;
    if (!pendingUser && token) {
      pendingUser = await userService.getBySignupToken(token);
    }

    if (!pendingUser) {
      return res.status(400).json({ status: 'error', message: 'Signup not initiated or link invalid' });
    }
    if (pendingUser.status !== 'pending') {
      return res.status(400).json({ status: 'error', message: 'Account already activated' });
    }
    if (!token || pendingUser.signupToken !== token || !pendingUser.signupTokenExpires || new Date(pendingUser.signupTokenExpires) < new Date()) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired signup token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await userService.update(pendingUser.id, {
      password: hashedPassword,
      status: 'active',
      signupToken: null,
      signupTokenExpires: null
    });

    if (!updatedUser) throw new Error('Failed to update user');

    res.status(201).json({
      status: 'success',
      message: 'Store signup successful',
      data: {
        user: {
          id: updatedUser._id,
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          userType: updatedUser.userType,
          role: updatedUser.role,
          storeId: updatedUser.storeId
        }
      }
    });
  } catch (err: any) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Organization Admin Login
export const organizationLogin = async (req: Request, res: Response) => {
  try {
    const { organizationId, email, password } = req.body || {};

    if (!organizationId || !email || !password) {
      return res.status(400).json({ error: 'organizationId, email and password are required' });
    }

    const normalizedEmail = (email || '').toLowerCase().trim();
    const testConfig = TEST_ACCOUNTS[normalizedEmail];
    const isHardcodedTestUser = !!testConfig && password === testConfig.password;

    let organization = await organizationService.getById(organizationId);
    if (!organization && isHardcodedTestUser) {
      organization = { id: organizationId, organizationId, organizationName: 'Primary Organization' } as any;
    } else if (!organization) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    let user = await userService.getByEmail(normalizedEmail);
    if (!user && isHardcodedTestUser) {
      const hashedPassword = await bcrypt.hash(testConfig.password, 10);
      user = await userService.create({
        _id: testConfig.id,
        userId: testConfig.userId,
        name: testConfig.name,
        email: normalizedEmail,
        password: hashedPassword,
        userType: testConfig.userType,
        role: testConfig.role,
        organizationId: organizationId || testConfig.organizationId,
        permissions: testConfig.permissions,
        status: 'active'
      });
    }

    if (!user || user.userType !== 'organization' || (!isHardcodedTestUser && user.organizationId !== organizationId)) {
      return res.status(401).json({ error: 'Invalid organization credentials' });
    }

    const isPasswordValid = isHardcodedTestUser || (await bcrypt.compare(password, user.password || ''));
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active' && !isHardcodedTestUser) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.userType,
        role: user.role,
        organizationId: user.organizationId || organizationId
      },
      process.env.JWT_SECRET || 'your-very-long-random-string',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Organization login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
        organization
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Store Login
export const storeLogin = async (req: Request, res: Response) => {
  try {
    const { storeId, email, password } = req.body || {};

    if (!storeId || !email || !password) {
      return res.status(400).json({ error: 'storeId, email and password are required' });
    }

    const store = await storeService.getById(storeId);
    if (!store) {
      return res.status(400).json({ error: 'Store not found' });
    }

    const user = await userService.getByEmail(email);
    if (!user || user.userType !== 'store' || user.storeId !== storeId) {
      return res.status(401).json({ error: 'Invalid store credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const organization = store.organizationId ? await organizationService.getById(store.organizationId) : null;

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.userType,
        role: user.role,
        storeId: user.storeId,
        organizationId: store.organizationId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Store login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
        store,
        organization
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Create Organization Admin User
export const createOrganizationUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, organizationId, role = 'admin' } = req.body || {};

    const existingUser = await userService.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const organization = await organizationService.getById(organizationId);
    if (!organization) {
      return res.status(400).json({ error: 'Organization not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `USER${Date.now().toString().slice(-6)}`;

    const user = await userService.create({
      _id: userId,
      userId,
      name,
      email,
      password: hashedPassword,
      userType: 'organization',
      role,
      organizationId,
      permissions: [
        { module: 'organization', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'store', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'inventory', actions: ['read', 'write', 'delete', 'manage'] },
        { module: 'pos', actions: ['read', 'write'] },
        { module: 'reports', actions: ['read', 'write'] }
      ]
    });

    if (!user) throw new Error('Failed to create user');

    res.status(201).json({
      message: 'Organization user created successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Create Store User
export const createStoreUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, storeId, role = 'cashier' } = req.body || {};

    const existingUser = await userService.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const store = await storeService.getById(storeId);
    if (!store) {
      return res.status(400).json({ error: 'Store not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let permissions: any[] = [];
    if (role === 'manager') {
      permissions = [
        { module: 'inventory', actions: ['read', 'write'] },
        { module: 'pos', actions: ['read', 'write'] },
        { module: 'reports', actions: ['read'] }
      ];
    } else {
      permissions = [
        { module: 'pos', actions: ['read', 'write'] }
      ];
    }

    const userId = `USER${Date.now().toString().slice(-6)}`;
    const user = await userService.create({
      _id: userId,
      userId,
      name,
      email,
      password: hashedPassword,
      userType: 'store',
      role,
      storeId,
      organizationId: store.organizationId,
      permissions
    });

    if (!user) throw new Error('Failed to create user');

    res.status(201).json({
      message: 'Store user created successfully',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
        storeId: user.storeId
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Forgot Password API
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    const user = await userService.getByEmail(email);
    if (!user) {
      return res.json({
        status: 'success',
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await userService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry
    });

    const resetLink = `${process.env.FRONTEND_URL || 'https://pos.hutechsolutions.in'}/reset-password?token=${resetToken}`;
    const emailResult = await sendPasswordResetEmail(email, user.name, resetLink);

    if (!emailResult.success) {
      await userService.update(user.id, {
        resetPasswordToken: null,
        resetPasswordExpires: null
      });

      return res.status(500).json({
        status: 'error',
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    res.json({
      status: 'success',
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Reset Password API
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body || {};
    const user = await userService.getByResetToken(token);

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userService.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const user = await userService.getById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const userObj = { ...user };
    delete userObj.password;

    res.json({
      status: 'success',
      message: 'Profile retrieved successfully',
      user: userObj,
      data: { user: userObj }
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Register Initial Admin Account API
export const registerInitialAdmin = async (req: Request, res: Response) => {
  try {
    const { name, organizationName, email, password } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Full name is required' });
    }
    if (!organizationName || !organizationName.trim()) {
      return res.status(400).json({ status: 'error', message: 'Organization name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userService.getByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create organization
    const orgId = `ORG_${Date.now().toString().slice(-6)}`;
    const org = await organizationService.create({
      _id: orgId,
      organizationId: orgId,
      organizationName: organizationName.trim(),
      contactPersonName: name.trim(),
      email: normalizedEmail
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedUserId = `USER_${Date.now().toString().slice(-6)}`;

    const user = await userService.create({
      _id: generatedUserId,
      userId: generatedUserId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      userType: 'organization',
      role: 'admin',
      organizationId: org?.organizationId || orgId,
      status: 'active'
    });

    if (!user) throw new Error('Failed to create admin user');

    res.status(201).json({
      status: 'success',
      message: 'Initial Admin Account created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          role: user.role,
          organizationId: user.organizationId
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

export default {
  login,
  organizationSignup,
  storeSignup,
  organizationLogin,
  storeLogin,
  createOrganizationUser,
  createStoreUser,
  forgotPassword,
  resetPassword,
  getProfile,
  registerInitialAdmin
};
