/**
 * Organization Service
 * Phase 3 - Mini ERP + CRM Operations Portal
 *
 * Handles database operations for tenant organizations and multi-tenant isolation.
 */

import { query } from '../db/index';
import { mapOrganization, Organization } from '../db/mapper';

export interface CreateOrganizationData {
  _id?: string;
  organizationId?: string;
  organizationName?: string;
  address?: Record<string, unknown> | string;
  contactPersonName?: string;
  contactNumber?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  logo?: string;
}

export interface UpdateOrganizationData {
  organizationName?: string;
  address?: Record<string, unknown> | string;
  contactPersonName?: string;
  contactNumber?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  logo?: string;
}

export const getAll = async (): Promise<Organization[]> => {
  const res = await query('SELECT * FROM organizations ORDER BY created_at DESC');
  return res.rows.map(mapOrganization).filter(Boolean) as Organization[];
};

export const getById = async (id: string): Promise<Organization | null> => {
  const res = await query(
    'SELECT * FROM organizations WHERE id = $1 OR organization_id = $1 LIMIT 1',
    [id]
  );
  return mapOrganization(res.rows[0]);
};

export const create = async (data: CreateOrganizationData): Promise<Organization | null> => {
  const id = data.organizationId || data._id || `ORG${Date.now()}`;
  const orgId = data.organizationId || id;
  const res = await query(`
    INSERT INTO organizations (
      id, organization_id, organization_name, address,
      contact_person_name, contact_number, email, gst_number, pan_number, logo,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `, [
    id,
    orgId,
    data.organizationName || '',
    JSON.stringify(data.address || {}),
    data.contactPersonName || '',
    data.contactNumber || '',
    data.email || '',
    data.gstNumber || '',
    data.panNumber || '',
    data.logo || ''
  ]);
  return mapOrganization(res.rows[0]);
};

export const update = async (id: string, data: UpdateOrganizationData): Promise<Organization | null> => {
  const current = await getById(id);
  if (!current) return null;

  const organizationName = data.organizationName !== undefined ? data.organizationName : current.organizationName;
  const address = data.address !== undefined ? data.address : current.address;
  const contactPersonName = data.contactPersonName !== undefined ? data.contactPersonName : current.contactPersonName;
  const contactNumber = data.contactNumber !== undefined ? data.contactNumber : current.contactNumber;
  const email = data.email !== undefined ? data.email : current.email;
  const gstNumber = data.gstNumber !== undefined ? data.gstNumber : current.gstNumber;
  const panNumber = data.panNumber !== undefined ? data.panNumber : current.panNumber;
  const logo = data.logo !== undefined ? data.logo : current.logo;

  const res = await query(`
    UPDATE organizations
    SET organization_name = $1,
        address = $2,
        contact_person_name = $3,
        contact_number = $4,
        email = $5,
        gst_number = $6,
        pan_number = $7,
        logo = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $9 OR organization_id = $9
    RETURNING *
  `, [
    organizationName,
    JSON.stringify(address || {}),
    contactPersonName,
    contactNumber,
    email,
    gstNumber,
    panNumber,
    logo,
    id
  ]);

  return mapOrganization(res.rows[0]);
};

export const deleteOrg = async (id: string): Promise<Organization | null> => {
  const res = await query(
    'DELETE FROM organizations WHERE id = $1 OR organization_id = $1 RETURNING *',
    [id]
  );
  return mapOrganization(res.rows[0]);
};

export { deleteOrg as delete };

export default {
  getAll,
  getById,
  create,
  update,
  delete: deleteOrg,
  deleteOrg
};
