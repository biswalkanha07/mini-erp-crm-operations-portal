/**
 * Category Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements category searching, generation of next sequential identifier, CRUD, and deletion.
 */

import type { Request, Response } from 'express';
import categoryService from '../services/categoryService';

export const searchAndFilterCategories = async (req: Request, res: Response) => {
  try {
    const { search, status, sortBy = 'createdAt', sortOrder = -1 } = req.query as Record<string, string>;
    const categories = await categoryService.searchAndFilter({ search, status, sortBy, sortOrder });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const generateCategoryId = async (_req: Request, res: Response) => {
  try {
    const categoryId = await categoryService.generateNextCategoryId();
    res.json({ categoryId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate categoryId' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const categoryData = { ...req.body };
    if (req.user && req.user.organizationId) {
      categoryData.organizationId = categoryData.organizationId || req.user.organizationId;
    }
    const category = await categoryService.create(categoryData);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAll(req.query.search as string);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCategoryById = async (req: Request, res: Response) => {
  try {
    const categoryData = { ...req.body };
    if (!categoryData.organizationId && req.user && req.user.organizationId) {
      categoryData.organizationId = req.user.organizationId;
    }
    const category = await categoryService.update(req.params.id, categoryData);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.delete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  searchAndFilterCategories,
  generateCategoryId,
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById
};
