/**
 * Organization Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements organization management endpoints.
 */

import type { Request, Response } from 'express';
import organizationService from '../services/organizationService';

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const org = await organizationService.create(req.body);
    res.status(201).json(org);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllOrganizations = async (_req: Request, res: Response) => {
  try {
    const orgs = await organizationService.getAll();
    res.json(orgs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const org = await organizationService.getById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json(org);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrganizationById = async (req: Request, res: Response) => {
  try {
    const org = await organizationService.update(req.params.id, req.body);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json(org);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteOrganizationById = async (req: Request, res: Response) => {
  try {
    const org = await organizationService.delete(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationById,
  deleteOrganizationById
};
