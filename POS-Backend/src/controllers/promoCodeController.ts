/**
 * Promo Code Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements promo code CRUD and validation/redemption in POS checkout.
 */

import type { Request, Response } from 'express';
import promoCodeService from '../services/promoCodeService';

// Create a new promo code
export const createPromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await promoCodeService.create(req.body);
    res.status(201).json(promo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Get all promo codes (optionally filter by organization)
export const getPromoCodes = async (req: Request, res: Response) => {
  try {
    const promos = await promoCodeService.getAll(req.query.organization as string);
    res.json(promos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Update a promo code
export const updatePromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await promoCodeService.update(req.params.id, req.body);
    if (!promo) return res.status(404).json({ error: 'Promo code not found' });
    res.json(promo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a promo code
export const deletePromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await promoCodeService.delete(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Promo code not found' });
    res.json({ message: 'Promo code deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Validate and apply promo code (for POS)
export const applyPromoCode = async (req: Request, res: Response) => {
  try {
    const result = await promoCodeService.applyPromoCode(req.body);
    res.json(result);
  } catch (err: any) {
    if (err.httpStatus === 404) {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};

export default {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  deletePromoCode,
  applyPromoCode
};
