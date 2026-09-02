require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const storeRoutes = require('./routes/storeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const catalogueRoutes = require('./routes/catalogueRoutes');

const invoiceRoutes = require('./routes/invoiceRoutes');
const storeOrderInvoiceRoutes = require('./routes/storeOrderInvoiceRoutes');
const storePriceRoutes = require('./routes/storePriceRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');

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

const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://aniketkuanar2001:aniketkuanar2001@cluster0.kvpotek.mongodb.net/POS?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));