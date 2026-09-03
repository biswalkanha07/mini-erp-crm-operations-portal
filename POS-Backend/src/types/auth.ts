/**
 * Authentication and User Type Definitions
 * Phase 2 - Mini ERP + CRM Operations Portal
 */

export type CanonicalErpRole = 'admin' | 'sales' | 'warehouse' | 'accounts';

export type UserRole =
  | 'admin'
  | 'sales'
  | 'warehouse'
  | 'accounts'
  | 'Admin'
  | 'Sales'
  | 'Warehouse'
  | 'Accounts'
  | 'manager'
  | 'cashier'
  | 'organization'
  | string;

export interface UserPermission {
  module: string;
  actions: string[];
}

export interface JwtPayloadData {
  userId: string;
  email: string;
  userType?: string;
  role: string;
  organizationId?: string | null;
  storeId?: string | null;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Object attached to req.user by authentication middleware
 */
export interface AuthenticatedUser extends JwtPayloadData {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  userType: string;
  organizationId?: string | null;
  storeId?: string | null;
}

/**
 * Full database user model returned by mapUser and attached to req.userObj
 */
export interface MappedUser {
  _id: string;
  id: string;
  userId: string;
  name: string;
  email: string;
  password?: string;
  userType: string;
  role: string;
  organizationId?: string | null;
  storeId?: string | null;
  permissions: UserPermission[] | string[];
  status: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: string | Date | null;
  signupToken?: string | null;
  signupTokenExpires?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
