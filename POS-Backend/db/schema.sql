-- ============================================================
-- MINI ERP + CRM OPERATIONS PORTAL: COMPLETE POSTGRESQL SCHEMA
-- Target Database: PostgreSQL / Neon
-- Phase 2B Complete Unified Schema (POS + ERP Support)
-- ============================================================

-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(50) PRIMARY KEY,
    organization_id VARCHAR(50) UNIQUE NOT NULL,
    organization_name VARCHAR(200) NOT NULL,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    contact_person_name VARCHAR(150),
    contact_number VARCHAR(30),
    email VARCHAR(150),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    logo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_org_id ON organizations(organization_id);

-- 2. STORES TABLE
CREATE TABLE IF NOT EXISTS stores (
    id VARCHAR(50) PRIMARY KEY,
    store_id VARCHAR(50) UNIQUE NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    store_location VARCHAR(200),
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    contact_person_name VARCHAR(150),
    contact_number VARCHAR(30),
    email VARCHAR(150),
    store_picture TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
    discount_rate NUMERIC(6, 2) DEFAULT 0.00,
    profit_margin_percent NUMERIC(6, 2) DEFAULT 0.00,
    theme VARCHAR(20) DEFAULT 'light',
    gst_rate NUMERIC(6, 2) DEFAULT 0.00,
    bank_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_store_id ON stores(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_org_id ON stores(organization_id);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_id VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(category_name);
CREATE INDEX IF NOT EXISTS idx_categories_org_id ON categories(organization_id);

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL DEFAULT 'organization',
    role VARCHAR(50) NOT NULL,
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL,
    store_id VARCHAR(50) REFERENCES stores(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ,
    signup_token VARCHAR(255),
    signup_token_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) NOT NULL DEFAULT 'organization';
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id VARCHAR(50) REFERENCES stores(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_token_expires TIMESTAMPTZ;

-- Drop any previous restrictive check constraint on role to allow both POS and ERP roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts', 'admin', 'manager', 'cashier'));

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);

-- 5. PRODUCTS TABLE (Catalogue Master)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50),
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
    volume_of_measurement VARCHAR(50),
    source_of_origin VARCHAR(100),
    nutrition_value JSONB DEFAULT '{}'::jsonb,
    certification VARCHAR(100),
    cut_type VARCHAR(50),
    certification_image TEXT,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    warehouse_location VARCHAR(100),
    barcode VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    thumbnail TEXT,
    instructions TEXT,
    expiry VARCHAR(50),
    gst_rate NUMERIC(6, 2) DEFAULT 0.00,
    cgst_rate NUMERIC(6, 2) DEFAULT 0.00,
    igst_rate NUMERIC(6, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS item_id VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_of_measurement VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_of_origin VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS nutrition_value JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS certification VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cut_type VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS certification_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(6, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(6, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS igst_rate NUMERIC(6, 2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(organization_id);

-- 6. STORE PRICES TABLE
CREATE TABLE IF NOT EXISTS store_prices (
    id VARCHAR(50) PRIMARY KEY,
    store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    base_price NUMERIC(12, 2),
    margin_type VARCHAR(20) DEFAULT 'percent',
    margin_value NUMERIC(10, 2) DEFAULT 0.00,
    override_price NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_store_prices_store_sku UNIQUE (store_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_store_prices_store_id ON store_prices(store_id);
CREATE INDEX IF NOT EXISTS idx_store_prices_sku ON store_prices(sku);

-- 7. PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS promo_codes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    expiry_date TIMESTAMPTZ,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- 8. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    business_name VARCHAR(200),
    gst_number VARCHAR(30),
    customer_type VARCHAR(30) NOT NULL DEFAULT 'Retail' CHECK (customer_type IN ('Retail', 'Wholesale', 'Distributor')),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Lead', 'Active', 'Inactive')),
    loyalty_points INTEGER DEFAULT 0,
    follow_up_date DATE,
    notes TEXT,
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- 9. CUSTOMER FOLLOWUPS TABLE
CREATE TABLE IF NOT EXISTS customer_followups (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    follow_up_date DATE NOT NULL,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_followups_customer ON customer_followups(customer_id);

-- 10. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_changed INTEGER NOT NULL,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    reason TEXT NOT NULL,
    reference_id VARCHAR(100),
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- 11. SALES TABLE (POS Transactions)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    sub_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    gst_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL,
    customer_details JSONB DEFAULT '{}'::jsonb,
    cashier_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    date_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_txn_id ON sales(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_date_time ON sales(date_time);

-- 12. INVOICES TABLE (POS Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    transaction_id VARCHAR(100),
    store_id VARCHAR(50) REFERENCES stores(id) ON DELETE CASCADE,
    organization_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(50) NOT NULL,
    qr_code_url TEXT,
    date_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_details JSONB DEFAULT '{}'::jsonb,
    due_date TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'paid',
    notes TEXT,
    store_name VARCHAR(200),
    store_address TEXT,
    organization_name VARCHAR(200),
    gst_number VARCHAR(50),
    phone_number VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_inv_no ON invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_store_id ON invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_invoices_txn_id ON invoices(transaction_id);

-- 13. ORDERS TABLE (Store Replenishment Requests)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    invoice_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 14. STORE ORDER INVOICES TABLE
CREATE TABLE IF NOT EXISTS store_order_invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    organization_id VARCHAR(50) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    date_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT,
    store_name VARCHAR(200),
    store_address TEXT,
    organization_name VARCHAR(200),
    gst_number VARCHAR(50),
    phone_number VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_store_order_inv_no ON store_order_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_store_order_inv_store ON store_order_invoices(store_id);

-- 15. CHALLANS TABLE (ERP Core)
CREATE TABLE IF NOT EXISTS challans (
    id VARCHAR(50) PRIMARY KEY,
    challan_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    notes TEXT,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_challans_number ON challans(challan_number);
CREATE INDEX IF NOT EXISTS idx_challans_customer ON challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_challans_status ON challans(status);

-- 16. CHALLAN ITEMS TABLE (ERP Core)
CREATE TABLE IF NOT EXISTS challan_items (
    id VARCHAR(50) PRIMARY KEY,
    challan_id VARCHAR(50) NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name_snapshot VARCHAR(200) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(12, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON challan_items(challan_id);
