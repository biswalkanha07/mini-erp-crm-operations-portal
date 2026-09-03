/**
 * Stock Movement Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements inventory ledger endpoints: manual IN/OUT stock adjustments,
 * audit trail listing with pagination, and single movement details.
 */

import type { Request, Response } from 'express';
import stockMovementService from '../services/stockMovementService';

export const createStockMovement = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, movementType, reason, referenceId } = req.body || {};

    const createdBy = (req.user as any)?.id || req.user?.userId;
    const organizationId = req.user?.organizationId;

    const result = await stockMovementService.createMovement({
      productId,
      quantity: Number(quantity),
      movementType,
      reason,
      referenceId,
      createdBy,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: result.movement,
      currentStock: result.currentStock
    });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getAllStockMovements = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      productId,
      movementType,
      reason,
      search
    } = req.query as Record<string, string>;

    const organizationId = req.user?.organizationId || (req.query.organizationId as string) || null;

    const result = await stockMovementService.getAll({
      page,
      limit,
      productId,
      movementType,
      reason,
      search,
      organizationId
    });

    if (result && 'pagination' in result) {
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      res.json({
        success: true,
        count: Array.isArray(result) ? result.length : 0,
        data: result
      });
    }
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getStockMovementById = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.role?.toLowerCase() === 'admin'
      ? undefined
      : req.user?.organizationId;

    const movement = await stockMovementService.getById(req.params.id, organizationId);
    if (!movement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }

    res.json({
      success: true,
      data: movement
    });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export default {
  createStockMovement,
  getAllStockMovements,
  getStockMovementById
};
