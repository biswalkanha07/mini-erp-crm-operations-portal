/**
 * Customer Controller (CRM)
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements CRM customer endpoints: list, get, create, update, deactivate,
 * and customer follow-up actions.
 */

import type { Request, Response } from 'express';
import customerService from '../services/customerService';

export const listCustomers = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, status, type, followUpDate } = req.query as Record<string, string>;
    const organizationId = req.user?.organizationId;

    const result = await customerService.listCustomers({
      page,
      limit,
      search,
      status,
      type,
      followUpDate,
      organizationId
    });

    res.json({
      success: true,
      data: result.customers,
      pagination: result.pagination
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const customer = await customerService.getCustomerById(req.params.id, organizationId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id || req.user?.userId;
    const organizationId = req.user?.organizationId;

    const customer = await customerService.createCustomer(req.body, userId, organizationId);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const customer = await customerService.updateCustomer(req.params.id, req.body, organizationId);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const result = await customerService.deleteOrDeactivateCustomer(req.params.id, organizationId);

    res.json({
      success: true,
      message: 'Customer deactivated successfully',
      data: result
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

export const listFollowups = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const followups = await customerService.listFollowups(req.params.id, organizationId);

    res.json({
      success: true,
      data: followups
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

export const addFollowup = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id || req.user?.userId;
    const organizationId = req.user?.organizationId;

    const followup = await customerService.addFollowup(
      req.params.id,
      {
        ...req.body,
        createdByName: (req.user as any)?.name
      },
      userId,
      organizationId
    );

    res.status(201).json({
      success: true,
      message: 'Follow-up added successfully',
      data: followup
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

export default {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listFollowups,
  addFollowup
};
