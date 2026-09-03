/**
 * Order Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements store replenish ordering, admin approval, fulfillment, and invoice SMS.
 */

import type { Request, Response } from 'express';
import orderService from '../services/orderService';
import { sendInvoiceSMS as sendSMSUtil } from '../utils/smsService';

// Send invoice SMS to customer
export const sendInvoiceSMS = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.body || {};
    const invoice = await orderService.getStoreOrderInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const mobile = invoice.phoneNumber || (invoice as any).customerMobile;
    if (!mobile) return res.status(400).json({ error: 'Customer mobile not found in invoice' });
    const message = `Thank you for your purchase! Invoice No: ${invoice.invoiceNo}, Total: ₹${invoice.totalAmount}`;
    await sendSMSUtil(mobile, message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Store creates a new order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items } = req.body || {};
    const storeId = (req.user && req.user.storeId) || req.body?.storeId;
    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Store and items are required' });
    }
    const order = await orderService.create({ storeId, items });
    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: get all orders (optionally filter by status)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status } = req.query as { status?: string };
    const orders = await orderService.getAll({ status });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: update order status (approve, reject, fulfill)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body || {};
    const result = await orderService.updateStatus(id, { status, adminNote });
    res.json(result);
  } catch (err: any) {
    if (err.httpStatus === 404) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// Store: get own orders
export const getStoreOrders = async (req: Request, res: Response) => {
  try {
    const storeId = (req.user && req.user.storeId) || (req.query.storeId as string);
    if (!storeId) return res.status(400).json({ error: 'Store ID required' });
    const orders = await orderService.getByStore(storeId);
    const ordersWithInvoice = await Promise.all(
      orders.map(async (order) => {
        let invoice = null;
        if (order.invoiceId) {
          invoice = await orderService.getStoreOrderInvoiceById(order.invoiceId);
        }
        return { ...order, invoice };
      })
    );
    res.json(ordersWithInvoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  sendInvoiceSMS,
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getStoreOrders
};
