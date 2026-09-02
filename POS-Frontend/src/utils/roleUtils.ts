/**
 * Centralized Role Normalization Utility
 * Maps business labels and case variants to canonical ERP roles:
 * - Admin
 * - Sales
 * - Warehouse
 * - Accounts
 * Preserves legacy POS roles:
 * - manager
 * - cashier
 */

export type CanonicalRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts' | 'manager' | 'cashier' | 'Unknown';

export function normalizeRole(rawRole?: string | null): CanonicalRole {
  if (!rawRole || typeof rawRole !== 'string') return 'Unknown';
  const r = rawRole.toLowerCase().trim();

  // Admin variants
  if (r === 'admin' || r === 'administrator' || r === 'super admin' || r === 'superadmin') {
    return 'Admin';
  }

  // Sales variants
  if (
    r === 'sales' ||
    r === 'sales executive' ||
    r === 'sales representative' ||
    r === 'sales officer' ||
    r === 'seller'
  ) {
    return 'Sales';
  }

  // Warehouse variants
  if (
    r === 'warehouse' ||
    r === 'warehouse officer' ||
    r === 'warehouse manager' ||
    r === 'warehouse executive' ||
    r === 'inventory' ||
    r === 'inventory manager'
  ) {
    return 'Warehouse';
  }

  // Accounts variants
  if (
    r === 'accounts' ||
    r === 'accounts executive' ||
    r === 'accountant' ||
    r === 'finance' ||
    r === 'accountability'
  ) {
    return 'Accounts';
  }

  // Legacy POS compatibility roles
  if (r === 'manager') return 'manager';
  if (r === 'cashier') return 'cashier';

  return 'Unknown';
}

export function isCanonicalRole(role: string): role is CanonicalRole {
  return ['Admin', 'Sales', 'Warehouse', 'Accounts', 'manager', 'cashier'].includes(role);
}
