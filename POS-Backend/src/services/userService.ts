/**
 * User Service
 * Phase 3 - Mini ERP + CRM Operations Portal
 *
 * Handles database operations for user accounts, role management, and authentication credentials.
 */

import { query } from '../db/index';
import { mapUser } from '../db/mapper';
import type { MappedUser, UserPermission } from '../types/auth';

export interface CreateUserData {
  _id?: string;
  userId?: string;
  name?: string;
  email: string;
  password?: string;
  userType?: string;
  role?: string;
  organizationId?: string | null;
  storeId?: string | null;
  permissions?: UserPermission[] | string[];
  status?: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | string | null;
  signupToken?: string | null;
  signupTokenExpires?: Date | string | null;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  userType?: string;
  role?: string;
  organizationId?: string | null;
  storeId?: string | null;
  permissions?: UserPermission[] | string[];
  status?: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | string | null;
  signupToken?: string | null;
  signupTokenExpires?: Date | string | null;
}

export const getAll = async (): Promise<MappedUser[]> => {
  const res = await query('SELECT * FROM users ORDER BY created_at DESC');
  return res.rows.map(mapUser).filter(Boolean) as MappedUser[];
};

export const getById = async (id: string): Promise<MappedUser | null> => {
  const res = await query('SELECT * FROM users WHERE id = $1 OR user_id = $1 LIMIT 1', [id]);
  return mapUser(res.rows[0]);
};

export const getByEmail = async (email: string): Promise<MappedUser | null> => {
  if (!email) return null;
  const res = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase().trim()]);
  return mapUser(res.rows[0]);
};

export const getByResetToken = async (token: string): Promise<MappedUser | null> => {
  const res = await query(
    'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > CURRENT_TIMESTAMP LIMIT 1',
    [token]
  );
  return mapUser(res.rows[0]);
};

export const getBySignupToken = async (token: string): Promise<MappedUser | null> => {
  const res = await query(
    'SELECT * FROM users WHERE signup_token = $1 AND signup_token_expires > CURRENT_TIMESTAMP LIMIT 1',
    [token]
  );
  return mapUser(res.rows[0]);
};

export const create = async (data: CreateUserData): Promise<MappedUser | null> => {
  const id = data._id || data.userId || `USER_${Date.now()}`;
  const userId = data.userId || id;
  const email = (data.email || '').toLowerCase().trim();

  const res = await query(`
    INSERT INTO users (
      id, user_id, name, email, password, user_type, role,
      organization_id, store_id, permissions, status,
      reset_password_token, reset_password_expires,
      signup_token, signup_token_expires, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11,
      $12, $13,
      $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `, [
    id,
    userId,
    data.name || '',
    email,
    data.password,
    data.userType || 'organization',
    data.role || 'cashier',
    data.organizationId || null,
    data.storeId || null,
    JSON.stringify(data.permissions || []),
    data.status || 'active',
    data.resetPasswordToken || null,
    data.resetPasswordExpires || null,
    data.signupToken || null,
    data.signupTokenExpires || null
  ]);

  return mapUser(res.rows[0]);
};

export const update = async (id: string, data: UpdateUserData): Promise<MappedUser | null> => {
  const current = await getById(id);
  if (!current) return null;

  const name = data.name !== undefined ? data.name : current.name;
  const email = data.email !== undefined ? data.email.toLowerCase().trim() : current.email;
  const password = data.password !== undefined ? data.password : current.password;
  const userType = data.userType !== undefined ? data.userType : current.userType;
  const role = data.role !== undefined ? data.role : current.role;
  const organizationId = data.organizationId !== undefined ? data.organizationId : current.organizationId;
  const storeId = data.storeId !== undefined ? data.storeId : current.storeId;
  const permissions = data.permissions !== undefined ? data.permissions : current.permissions;
  const status = data.status !== undefined ? data.status : current.status;
  const resetPasswordToken = data.resetPasswordToken !== undefined ? data.resetPasswordToken : current.resetPasswordToken;
  const resetPasswordExpires = data.resetPasswordExpires !== undefined ? data.resetPasswordExpires : current.resetPasswordExpires;
  const signupToken = data.signupToken !== undefined ? data.signupToken : current.signupToken;
  const signupTokenExpires = data.signupTokenExpires !== undefined ? data.signupTokenExpires : current.signupTokenExpires;

  const res = await query(`
    UPDATE users
    SET name = $1,
        email = $2,
        password = $3,
        user_type = $4,
        role = $5,
        organization_id = $6,
        store_id = $7,
        permissions = $8,
        status = $9,
        reset_password_token = $10,
        reset_password_expires = $11,
        signup_token = $12,
        signup_token_expires = $13,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $14 OR user_id = $14
    RETURNING *
  `, [
    name,
    email,
    password,
    userType,
    role,
    organizationId,
    storeId,
    JSON.stringify(permissions || []),
    status,
    resetPasswordToken,
    resetPasswordExpires,
    signupToken,
    signupTokenExpires,
    id
  ]);

  return mapUser(res.rows[0]);
};

export const deleteUser = async (id: string): Promise<MappedUser | null> => {
  const res = await query('DELETE FROM users WHERE id = $1 OR user_id = $1 RETURNING *', [id]);
  return mapUser(res.rows[0]);
};

export { deleteUser as delete };

export default {
  getAll,
  getById,
  getByEmail,
  getByResetToken,
  getBySignupToken,
  create,
  update,
  delete: deleteUser,
  deleteUser
};
