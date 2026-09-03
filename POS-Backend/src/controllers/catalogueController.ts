/**
 * Catalogue Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements catalogue querying, ID generation, file upload handling, and CRUD.
 */

import type { Request, Response } from 'express';
import catalogueService from '../services/catalogueService';

// GET /api/catalogues/search - filter and sort catalogues
export const searchAndFilterCatalogues = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      categoryId,
      lowStock,
      warehouseLocation,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query as Record<string, string>;

    const organizationId = req.user?.organizationId;

    const catalogues = await catalogueService.searchAndFilter({
      search,
      status,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      categoryId,
      lowStock,
      warehouseLocation,
      organizationId,
      sortBy,
      sortOrder
    });
    res.json({ success: true, count: catalogues.length, data: catalogues });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Endpoint to generate itemId and sku
export const generateIds = async (_req: Request, res: Response) => {
  try {
    const ids = await catalogueService.generateNextIds();
    res.json(ids);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const createCatalogue = async (req: Request, res: Response) => {
  try {
    const catalogueData = { ...req.body };
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }

    // Attach organization from logged-in user if available
    if (req.user && req.user.organizationId) {
      catalogueData.organizationId = catalogueData.organizationId || req.user.organizationId;
    }

    // Parse nested fields sent as strings
    if (typeof catalogueData.nutritionValue === 'string') {
      try { catalogueData.nutritionValue = JSON.parse(catalogueData.nutritionValue); } catch (_) {}
    }

    // Normalize images array from JSON
    if (catalogueData.images && typeof catalogueData.images === 'string') {
      try { catalogueData.images = JSON.parse(catalogueData.images); } catch (_) {}
    }
    if (catalogueData.images && !Array.isArray(catalogueData.images)) {
      catalogueData.images = [catalogueData.images];
    }

    // Handle image uploads if files are present
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files.image && files.image[0]) {
        catalogueData.image = `/uploads/${files.image[0].filename}`;
      }
      if (files.thumbnail && files.thumbnail[0]) {
        catalogueData.thumbnail = `/uploads/${files.thumbnail[0].filename}`;
      }
      if (files.images) {
        const paths = files.images.map(f => `/uploads/${f.filename}`);
        catalogueData.images = Array.isArray(catalogueData.images) ? [...catalogueData.images, ...paths] : paths;
      }
    }

    // Backward compatibility: if only single image provided, set images array
    if ((!catalogueData.images || catalogueData.images.length === 0) && catalogueData.image) {
      catalogueData.images = [catalogueData.image];
    }
    // Default thumbnail to first image if not provided
    if (!catalogueData.thumbnail && Array.isArray(catalogueData.images) && catalogueData.images.length > 0) {
      catalogueData.thumbnail = catalogueData.images[0];
    }

    // If expiry is a number, convert to string with unit
    if (typeof catalogueData.expiry === 'number') {
      catalogueData.expiry = `${catalogueData.expiry} hours`;
    }
    if (typeof catalogueData.expiry === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(catalogueData.expiry)) {
      const match = catalogueData.expiry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [, y, m, d] = match;
        catalogueData.expiry = `${d}-${m}-${y}`;
      }
    }

    // Normalize gstRate if provided
    if (catalogueData.gstRate !== undefined && catalogueData.gstRate !== null && catalogueData.gstRate !== '') {
      const parsedGst = Number(catalogueData.gstRate);
      if (!Number.isNaN(parsedGst)) {
        catalogueData.gstRate = parsedGst;
      } else {
        delete catalogueData.gstRate;
      }
    }

    const catalogue = await catalogueService.create(catalogueData, req.user?.organizationId);
    res.status(201).json(catalogue);
  } catch (err: any) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const getAllCatalogues = async (req: Request, res: Response) => {
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

    const result = await catalogueService.getAll({
      categoryId,
      search,
      lowStock,
      warehouseLocation,
      status,
      organizationId,
      page,
      limit
    });
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getCatalogueById = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const catalogue = await catalogueService.getById(req.params.id, organizationId);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json(catalogue);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const updateCatalogueById = async (req: Request, res: Response) => {
  try {
    const catalogueData = { ...req.body };
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }

    if (!catalogueData.organizationId && req.user && req.user.organizationId) {
      catalogueData.organizationId = req.user.organizationId;
    }

    if (catalogueData.images && typeof catalogueData.images === 'string') {
      try { catalogueData.images = JSON.parse(catalogueData.images); } catch (_) {}
    }
    if (catalogueData.images && !Array.isArray(catalogueData.images)) {
      catalogueData.images = [catalogueData.images];
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files.image && files.image[0]) {
        catalogueData.image = `/uploads/${files.image[0].filename}`;
      }
      if (files.thumbnail && files.thumbnail[0]) {
        catalogueData.thumbnail = `/uploads/${files.thumbnail[0].filename}`;
      }
      if (files.images) {
        const paths = files.images.map(f => `/uploads/${f.filename}`);
        catalogueData.images = Array.isArray(catalogueData.images) ? [...catalogueData.images, ...paths] : paths;
      }
    }

    if ((!catalogueData.images || catalogueData.images.length === 0) && catalogueData.image) {
      catalogueData.images = [catalogueData.image];
    }
    if (!catalogueData.thumbnail && Array.isArray(catalogueData.images) && catalogueData.images.length > 0) {
      catalogueData.thumbnail = catalogueData.images[0];
    }

    if (typeof catalogueData.nutritionValue === 'string') {
      try { catalogueData.nutritionValue = JSON.parse(catalogueData.nutritionValue); } catch (_) {}
    }

    if (typeof catalogueData.expiry === 'number') {
      catalogueData.expiry = `${catalogueData.expiry} hours`;
    }
    if (typeof catalogueData.expiry === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(catalogueData.expiry)) {
      const match = catalogueData.expiry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [, y, m, d] = match;
        catalogueData.expiry = `${d}-${m}-${y}`;
      }
    }

    if (catalogueData.gstRate !== undefined && catalogueData.gstRate !== null && catalogueData.gstRate !== '') {
      const parsedGst = Number(catalogueData.gstRate);
      if (!Number.isNaN(parsedGst)) {
        catalogueData.gstRate = parsedGst;
      } else {
        delete catalogueData.gstRate;
      }
    }

    const catalogue = await catalogueService.update(req.params.id, catalogueData, req.user?.organizationId);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json(catalogue);
  } catch (err: any) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

export const deleteCatalogueById = async (req: Request, res: Response) => {
  try {
    const catalogue = await catalogueService.delete(req.params.id, req.user?.organizationId);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export default {
  searchAndFilterCatalogues,
  generateIds,
  createCatalogue,
  getAllCatalogues,
  getCatalogueById,
  updateCatalogueById,
  deleteCatalogueById
};
