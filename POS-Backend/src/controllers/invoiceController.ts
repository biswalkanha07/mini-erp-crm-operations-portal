/**
 * Invoice Controller
 * Phase 4 - Mini ERP + CRM Operations Portal
 *
 * Implements invoice querying, generation from transactions, and SMS delivery.
 */

import type { Request, Response } from 'express';
import invoiceService from '../services/invoiceService';
import { sendInvoiceSMS as sendSMSUtil } from '../utils/smsService';

// Send invoice SMS for POS invoice
export const sendInvoiceSMS = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.body || {};
    const invoice = await invoiceService.getById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const mobile = String(invoice.customerDetails?.phone || '').trim();
    if (!mobile) {
      return res.status(400).json({ error: 'Customer mobile not found in invoice' });
    }
    const invoiceLink = `https://pos.hutechsolutions.in/invoice/${invoice._id}`;
    const message = `Thank you for your purchase! Invoice No: ${invoice.invoiceNo}, Total: ₹${invoice.totalAmount}. View/download: ${invoiceLink}`;
    try {
      await sendSMSUtil(mobile, message);
      res.json({ success: true });
    } catch (smsErr: any) {
      console.error('[SMS] Twilio error:', smsErr);
      res.status(500).json({ error: smsErr.message || 'Twilio SMS failed' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Generate invoice from transaction
export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body || {};
    const invoice = await invoiceService.generateInvoiceFromTransaction(transactionId);
    if (!invoice) throw new Error('Failed to generate invoice');
    return res.status(201).json({
      message: 'Invoice generated successfully',
      invoiceNo: invoice.invoiceNo,
      invoice
    });
  } catch (err: any) {
    if (err.httpStatus === 404) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

// Get all invoices
export const getAllInvoices = async (_req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getAll();
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoices by store
export const getInvoicesByStore = async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getByStore(req.params.storeId);
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  sendInvoiceSMS,
  generateInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByStore
};
