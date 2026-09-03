/**
 * Product Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements product inventory master endpoints, delegating to catalogueService.
 */

import type { Request, Response } from 'express';
import catalogueService from '../services/catalogueService';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      search,
      lowStock,
      warehouseLocation,
      status,
      page,
      limit
    } = req.query as Record<string, string>;

    const organizationId = req.user?.organizationId;

    const products = await catalogueService.getAll({
      categoryId,
      search,
      lowStock,
      warehouseLocation,
      status,
      organizationId,
      page,
      limit
    });
    res.json(products);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await catalogueService.getById(req.params.id, req.user?.organizationId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await catalogueService.create(req.body, req.user?.organizationId);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await catalogueService.update(req.params.id, req.body, req.user?.organizationId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err: any) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await catalogueService.delete(req.params.id, req.user?.organizationId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err: any) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
