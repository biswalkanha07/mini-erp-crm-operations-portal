/**
 * Mini ERP + CRM Operations Portal - Backend Entrypoint
 * Phase 4 - TypeScript Runtime Migration
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import productRoutes from './routes/productRoutes';
import salesRoutes from './routes/salesRoutes';
import userRoutes from './routes/userRoutes';
import organizationRoutes from './routes/organizationRoutes';
import storeRoutes from './routes/storeRoutes';
import categoryRoutes from './routes/categoryRoutes';
import catalogueRoutes from './routes/catalogueRoutes';

import invoiceRoutes from './routes/invoiceRoutes';
import storeOrderInvoiceRoutes from './routes/storeOrderInvoiceRoutes';
import storePriceRoutes from './routes/storePriceRoutes';

import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import reportsRoutes from './routes/reportsRoutes';
import bulkUploadRoutes from './routes/bulkUploadRoutes';
import promoCodeRoutes from './routes/promoCodeRoutes';
import healthRoutes from './routes/healthRoutes';
import customerRoutes from './routes/customerRoutes';
import stockMovementRoutes from './routes/stockMovementRoutes';
import challanRoutes from './routes/challanRoutes';
import { testConnection as testPgConnection } from './db/index';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Serve static files from public directory
app.use('/public', express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/catalogues', catalogueRoutes);

app.use('/api/invoices', invoiceRoutes);
app.use('/api/store-order-invoices', storeOrderInvoiceRoutes);
app.use('/api/store-prices', storePriceRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', bulkUploadRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/health', healthRoutes);

const PORT = process.env.PORT || 5050;

// Start server backed entirely by PostgreSQL / Neon
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const res = await testPgConnection();
    if (res.success) {
      console.log(`[PostgreSQL] Neon database online (${res.database})`);
    } else {
      console.warn(`[PostgreSQL] Neon connection warning: ${res.error}`);
    }
  } catch (err: any) {
    console.warn(`[PostgreSQL] Neon check warning: ${err.message}`);
  }
});

export { app, server };
export default app;
