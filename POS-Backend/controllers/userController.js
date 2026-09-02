const userService = require('../services/userService');
const { sanitizeUser } = require('../db/mapper');
const bcrypt = require('bcryptjs');

const ALLOWED_ROLES = ['Admin', 'Sales', 'Warehouse', 'Accounts', 'admin', 'sales', 'warehouse', 'accounts', 'manager', 'cashier'];

exports.getAllUsers = async (req, res) => {
  try {
    const adminOrgId = req.user?.organizationId || req.user?.organization_id;
    let users = await userService.getAll();
    
    // Filter by organization if authenticated admin belongs to an organization
    if (adminOrgId) {
      users = users.filter(u => !u.organizationId || u.organizationId === adminOrgId);
    }

    const { role, status, search } = req.query;
    if (role) {
      users = users.filter(u => (u.role || '').toLowerCase() === role.toLowerCase());
    }
    if (status) {
      users = users.filter(u => (u.status || '').toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => 
        (u.name || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q)
      );
    }

    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, storeId, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const assignedRole = role || 'Sales';
    if (!ALLOWED_ROLES.includes(assignedRole)) {
      return res.status(400).json({ 
        error: `Invalid role. Allowed roles: Admin, Sales, Warehouse, Accounts` 
      });
    }

    // Check duplicate email
    const existing = await userService.getByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Derive organization strictly from authenticated Admin
    const adminOrgId = req.user?.organizationId || req.user?.organization_id || 'ORG001';

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedUserId = `USER_${Date.now().toString().slice(-6)}`;

    const user = await userService.create({
      _id: generatedUserId,
      userId: generatedUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      userType: storeId ? 'store' : 'organization',
      role: assignedRole,
      organizationId: adminOrgId,
      storeId: storeId || null,
      status: status || 'active'
    });

    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await userService.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const adminOrgId = req.user?.organizationId || req.user?.organization_id;
    if (adminOrgId && existing.organizationId && existing.organizationId !== adminOrgId) {
      return res.status(403).json({ error: 'Access denied to user outside your organization' });
    }

    const { name, email, password, role, status, storeId } = req.body;
    const updatePayload = {};

    if (name !== undefined) updatePayload.name = name.trim();
    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updatePayload.role = role;
    }
    if (status !== undefined) updatePayload.status = status;
    if (storeId !== undefined) updatePayload.storeId = storeId;

    if (email !== undefined && email.toLowerCase().trim() !== existing.email) {
      const emailDup = await userService.getByEmail(email);
      if (emailDup) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      updatePayload.email = email.toLowerCase().trim();
    }

    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updatePayload.password = await bcrypt.hash(password, 10);
    }

    const updated = await userService.update(id, updatePayload);
    res.json(sanitizeUser(updated));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await userService.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const adminOrgId = req.user?.organizationId || req.user?.organization_id;
    if (adminOrgId && existing.organizationId && existing.organizationId !== adminOrgId) {
      return res.status(403).json({ error: 'Access denied to user outside your organization' });
    }

    // Soft-deactivate user
    await userService.update(id, { status: 'inactive' });
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

