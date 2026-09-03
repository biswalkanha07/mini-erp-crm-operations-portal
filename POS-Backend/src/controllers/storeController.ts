/**
 * Store Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements store lifecycle endpoints, search, filtering, and per-store price overrides.
 */

import type { Request, Response } from 'express';
import storeService from '../services/storeService';

export const createStore = async (req: Request, res: Response) => {
  try {
    const result = await storeService.createStore(req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    console.error('Error creating store:', err);

    if (err.httpStatus === 409) {
      return res.status(409).json({ status: 'error', message: 'Email already exists' });
    }

    if (err.httpStatus === 400 || err.code === '23505') {
      return res.status(400).json({ error: err.message || 'Duplicate key or validation error' });
    }

    return res.status(500).json({
      error: 'Internal server error while creating store',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
};

export const searchAndFilterStores = async (req: Request, res: Response) => {
  try {
    const stores = await storeService.searchAndFilter(req.query as any);
    return res.json({ success: true, count: stores.length, data: stores });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllStores = async (req: Request, res: Response) => {
  try {
    const stores = await storeService.getAll(req.query as any);
    res.json(stores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getStoreById = async (req: Request, res: Response) => {
  try {
    const store = await storeService.getById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json(store);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStoreById = async (req: Request, res: Response) => {
  try {
    const store = await storeService.update(req.params.id, req.body);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json(store);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteStoreById = async (req: Request, res: Response) => {
  try {
    const store = await storeService.delete(req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listStorePrices = async (req: Request, res: Response) => {
  try {
    const prices = await storeService.listStorePrices(req.params.storeId);
    res.json(prices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const upsertStorePrice = async (req: Request, res: Response) => {
  try {
    const { marginType, marginValue, basePrice, overridePrice } = req.body || {};
    const price = await storeService.upsertStorePrice(req.params.storeId, req.params.sku, {
      marginType, marginValue, basePrice, overridePrice
    });
    res.json(price);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEffectivePrice = async (req: Request, res: Response) => {
  try {
    const { storeId, sku } = req.params;
    const priceData = await storeService.getEffectivePrice(storeId, sku);
    if (!priceData) return res.status(404).json({ error: 'Product not found' });
    res.json(priceData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  createStore,
  searchAndFilterStores,
  getAllStores,
  getStoreById,
  updateStoreById,
  deleteStoreById,
  listStorePrices,
  upsertStorePrice,
  getEffectivePrice
};
