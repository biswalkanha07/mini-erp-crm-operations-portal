/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces authoritative server-side role authorization for ERP operations.
 *
 * Supported Canonical ERP Roles:
 * - Admin (Superuser with full system & operational access)
 * - Sales (Customer management, CRM follow-ups, viewing products & stock, draft challans)
 * - Warehouse (Inventory, stock movements, product catalogue updates, dispatch operations)
 * - Accounts (Financial reporting, invoice management, viewing sales & orders)
 *
 * Legacy POS compatibility roles:
 * - manager, cashier (retained for store POS terminal operations)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const userRole = req.user.role.toLowerCase().trim();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase().trim());

    // Admin has superuser privileges across all modules
    if (userRole === 'admin') {
      return next();
    }

    // Check if the user's role matches any of the allowed roles
    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    // Role does not have permission
    return res.status(403).json({
      error: 'Forbidden: Insufficient permissions for this role',
      requiredRoles: allowedRoles,
      currentRole: req.user.role
    });
  };
};

module.exports = {
  requireRole
};
