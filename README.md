# 🚀 Mini ERP + CRM Operations Portal

<p align="center">
  <strong>A Full-Stack ERP & CRM Operations Platform for Wholesale & Distribution Businesses</strong>
</p>

<p align="center">
  Manage customers, products, inventory, stock movements, sales challans, users, and business operations from a single modern web application.
</p>

<p align="center">

<a href="https://nodejs.org/">
<img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
</a>

<a href="https://www.typescriptlang.org/">
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</a>

<a href="https://expressjs.com/">
<img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
</a>

<a href="https://react.dev/">
<img src="https://img.shields.io/badge/React-18%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
</a>

<a href="https://www.postgresql.org/">
<img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</a>

<a href="https://jwt.io/">
<img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
</a>

</p>

<p align="center">

<img src="https://img.shields.io/badge/REST%20API-Enabled-FF6B35?style=flat-square" />
<img src="https://img.shields.io/badge/RBAC-Enabled-8E44AD?style=flat-square" />
<img src="https://img.shields.io/badge/Responsive-UI-00A86B?style=flat-square" />
<img src="https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker&logoColor=white" />

</p>

---

## 📌 Overview

**Mini ERP + CRM Operations Portal** is a full-stack business management application designed for **wholesale and distribution companies**.

The platform combines essential **ERP (Enterprise Resource Planning)** and **CRM (Customer Relationship Management)** capabilities into one centralized system.

It helps businesses manage:

* 👥 Customers and CRM activities
* 📦 Products and categories
* 📊 Inventory and stock levels
* 🔄 Stock movement history
* 🧾 Sales challans
* 👤 Role-based users
* 📈 Operational dashboards
* 🔐 Authentication and authorization
* 📝 Customer follow-ups and notes
* 🧮 Business and sales information

The system is designed with a **RESTful backend**, **responsive React frontend**, and **relational PostgreSQL database architecture**.

---

# ✨ Key Features

## 👥 CRM — Customer Management

Manage the complete customer lifecycle from one place.

### Customer Information

* Customer Name
* Mobile Number
* Email
* Business Name
* GST Number
* Customer Type

  * Retail
  * Wholesale
  * Distributor
* Address
* Customer Status

  * Lead
  * Active
  * Inactive
* Follow-up Date
* Notes

### CRM Operations

* ➕ Add customer
* ✏️ Edit customer
* 🔍 Search customers
* 📋 View customer details
* 📝 Add follow-up notes
* 📅 Track follow-up dates
* 👁️ View customer history
* 🗑️ Manage customer records

---

# 📦 Product & Inventory Management

The inventory module provides centralized control over products and stock.

### Product Information

* Product Name
* SKU
* Category
* Unit Price
* Current Stock
* Minimum Stock Alert Quantity
* Warehouse / Location

### Inventory Features

* Create products
* Update products
* Search products
* Filter products
* View product details
* Monitor stock levels
* Low-stock alerts
* Warehouse/location tracking

---

# 🔄 Stock Movement Tracking

Every important stock change can be recorded as a movement.

### Movement Types

| Type     | Description                  |
| -------- | ---------------------------- |
| 🟢 `IN`  | Stock added to inventory     |
| 🔴 `OUT` | Stock removed from inventory |

### Stock Movement Data

* Product
* Quantity
* Movement Type
* Reason
* Created By
* Timestamp

This provides an auditable history of inventory changes.

---

# 🧾 Sales Challan Management

The Sales Challan module manages product dispatch/sales operations.

### Challan Features

* Create challan
* Select customer
* Add multiple products
* Specify product quantities
* Automatic challan number
* Draft challans
* Confirm challans
* Cancel challans
* Product snapshot storage
* Stock validation
* Automatic stock deduction

### Challan Status

```text
DRAFT
   │
   ├───────────────┐
   │               │
   ▼               ▼
CONFIRMED       CANCELLED
```

---

# 🔐 Stock Safety

The system prevents invalid inventory operations.

### No Negative Stock

When confirming a challan:

```text
Requested Quantity
        ↓
Check Current Stock
        ↓
 ┌──────┴──────┐
 │             │
Enough       Insufficient
 │             │
 ▼             ▼
Confirm      Return Error
 │
 ▼
Reduce Stock
 │
 ▼
Create OUT Movement
```

If available stock is insufficient, the API rejects the operation instead of allowing negative inventory.

---

# 📸 Product Snapshot in Challans

Confirmed challans store product information as a **snapshot**.

For example:

```json
{
  "productId": "123",
  "productName": "Product A",
  "sku": "SKU-001",
  "unitPrice": 500,
  "quantity": 10
}
```

This ensures that historical challans remain accurate even if the product's name, SKU, or price changes later.

---

# 👤 Role-Based Access Control

The application uses **RBAC (Role-Based Access Control)**.

## Available Roles

| Role             | Access                                                  |
| ---------------- | ------------------------------------------------------- |
| 🔴 **Admin**     | Full system access                                      |
| 🔵 **Sales**     | Customers, CRM, challans and relevant inventory         |
| 🟢 **Warehouse** | Products, inventory and stock movements                 |
| 🟡 **Accounts**  | Customers, challans, invoices and financial information |

Authorization is enforced at the **backend API level**, not only through frontend navigation.

---

# 🔑 Authentication

Authentication is implemented using **JWT-based authentication**.

### Authentication Flow

```text
User
 │
 ▼
Login
 │
 ▼
Validate Credentials
 │
 ▼
Generate JWT
 │
 ▼
Frontend Stores Token
 │
 ▼
Send Token with API Requests
 │
 ▼
Backend Middleware
 │
 ▼
Verify Token
 │
 ▼
Check User Role
 │
 ▼
Allow / Reject Request
```

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────────────┐
│                  FRONTEND                   │
│                                             │
│              React + TypeScript             │
│                                             │
│  Dashboard │ CRM │ Inventory │ Challans    │
└──────────────────────┬──────────────────────┘
                       │
                       │ REST API / JSON
                       ▼
┌─────────────────────────────────────────────┐
│                  BACKEND                    │
│                                             │
│          Node.js + Express + TypeScript     │
│                                             │
│ Auth │ CRM │ Products │ Stock │ Challans    │
└──────────────────────┬──────────────────────┘
                       │
                       │ SQL / ORM
                       ▼
┌─────────────────────────────────────────────┐
│                 DATABASE                    │
│                                             │
│                 PostgreSQL                  │
│                                             │
│ Users │ Customers │ Products │ Stock       │
│ Challans │ Follow-ups │ Categories         │
└─────────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

| Technology    | Purpose                        |
| ------------- | ------------------------------ |
| ⚛️ React      | UI development                 |
| 📘 TypeScript | Type-safe frontend development |
| 🎨 CSS        | Responsive styling             |
| 🔗 REST API   | Backend communication          |

## Backend

| Technology    | Purpose                       |
| ------------- | ----------------------------- |
| 🟢 Node.js    | Server runtime                |
| 🚀 Express.js | REST API framework            |
| 📘 TypeScript | Type-safe backend development |
| 🔐 JWT        | Authentication                |
| 🔒 bcrypt     | Password hashing              |

## Database

| Technology           | Purpose              |
| -------------------- | -------------------- |
| 🐘 PostgreSQL        | Relational database  |
| 🔗 ORM / Query Layer | Database interaction |

## Development & Deployment

| Technology                | Purpose             |
| ------------------------- | ------------------- |
| 🐳 Docker                 | Containerization    |
| 🔀 Git                    | Version control     |
| 🐙 GitHub                 | Source code hosting |
| ☁️ Render / Railway / AWS | Deployment          |
| ▲ Vercel / Netlify        | Frontend hosting    |

---

# 📂 Project Structure

```text
mini-erp-crm-operations-portal/
│
├── POS-Backend/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── app.ts
│   │
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── POS-Frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   │
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── README.md
└── .gitignore
```

> **Note:** The exact folder structure may vary slightly depending on the implementation. Existing reusable POS modules should be preserved where appropriate rather than unnecessarily rewritten.

---

# ⚙️ Prerequisites

Before running the project locally, install:

### Required

* Node.js `20+`
* npm `10+`
* PostgreSQL `15+`
* Git

### Recommended

* VS Code
* Postman
* Docker Desktop

Verify installations:

```bash
node --version
npm --version
psql --version
git --version
```

---

# 🚀 Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/mini-erp-crm-operations-portal.git
```

Navigate into the project:

```bash
cd mini-erp-crm-operations-portal
```

---

# 🔧 Backend Setup

Navigate to the backend:

```bash
cd POS-Backend
```

Install dependencies:

```bash
npm install
```

---

# 🔐 Backend Environment Variables

Create a `.env` file inside:

```text
POS-Backend/.env
```

Example:

```env
PORT=5000

NODE_ENV=development

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/erp_crm

JWT_SECRET=your_super_secret_jwt_key

JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### Environment Variable Explanation

| Variable         | Description                  |
| ---------------- | ---------------------------- |
| `PORT`           | Backend server port          |
| `NODE_ENV`       | Application environment      |
| `DATABASE_URL`   | PostgreSQL connection string |
| `JWT_SECRET`     | JWT signing secret           |
| `JWT_EXPIRES_IN` | Token expiration             |
| `CORS_ORIGIN`    | Frontend URL                 |

> ⚠️ Never commit your `.env` file to GitHub.

---

# 🐘 PostgreSQL Database Setup

Create the database:

```sql
CREATE DATABASE erp_crm;
```

Connect to it:

```bash
psql -U postgres -d erp_crm
```

Run the project's database migrations/schema commands according to the configured ORM/database layer.

Example:

```bash
npm run migrate
```

or, if the project uses a schema synchronization command:

```bash
npm run db:push
```

> Use the command defined in the project's `package.json`.

---

# ▶️ Start Backend

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Start production server:

```bash
npm start
```

Backend should be available at:

```text
http://localhost:5000
```

---

# 💻 Frontend Setup

Open a new terminal.

Navigate to:

```bash
cd POS-Frontend
```

Install dependencies:

```bash
npm install
```

---

# 🌐 Frontend Environment Variables

Create:

```text
POS-Frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

---

# ▶️ Start Frontend

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔗 Local Development

Once both servers are running:

```text
Frontend
http://localhost:5173

        ↓

Backend API
http://localhost:5000/api

        ↓

PostgreSQL
localhost:5432
```

Open the frontend in your browser:

```text
http://localhost:5173
```

---

# 🔌 REST API

The application follows REST API principles.

## Authentication

```http
POST /api/auth/login
GET  /api/auth/me
```

---

## Customers

```http
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Follow-ups

```http
POST /api/customers/:id/followups
GET  /api/customers/:id/followups
```

---

## Products

```http
GET  /api/products
GET  /api/products/:id
POST /api/products
PUT  /api/products/:id
```

---

## Stock Movements

```http
GET  /api/stock-movements
POST /api/stock-movements
```

---

## Sales Challans

```http
GET  /api/challans
GET  /api/challans/:id
POST /api/challans
PUT  /api/challans/:id
```

### Challan Actions

```http
POST /api/challans/:id/confirm
POST /api/challans/:id/cancel
```

---

# 📊 API Features

The API supports:

* ✅ Request validation
* ✅ Authentication
* ✅ Role-based authorization
* ✅ Pagination
* ✅ Search
* ✅ Filtering
* ✅ Standard HTTP status codes
* ✅ Consistent error responses
* ✅ Stock validation
* ✅ Transaction-safe challan confirmation

---

# ❌ Error Handling

Example insufficient-stock response:

```json
{
  "success": false,
  "message": "Insufficient stock for product SKU-001",
  "error": {
    "code": "INSUFFICIENT_STOCK"
  }
}
```

Common HTTP status codes:

| Code  | Meaning               |
| ----- | --------------------- |
| `200` | Successful request    |
| `201` | Resource created      |
| `400` | Bad request           |
| `401` | Unauthorized          |
| `403` | Forbidden             |
| `404` | Resource not found    |
| `409` | Conflict              |
| `422` | Validation error      |
| `500` | Internal server error |

---

# 🔄 Challan Confirmation Transaction

Challan confirmation follows a transaction-safe process:

```text
BEGIN TRANSACTION
        │
        ▼
Load Challan
        │
        ▼
Check Status
        │
        ▼
Validate Products
        │
        ▼
Lock / Check Stock
        │
        ▼
Is Stock Sufficient?
    ┌───┴────┐
   YES       NO
    │         │
    ▼         ▼
Reduce      ROLLBACK
Stock
    │
    ▼
Create OUT
Stock Movement
    │
    ▼
Mark Challan
CONFIRMED
    │
    ▼
COMMIT
```

This prevents partial updates and helps maintain inventory consistency.

---

# 🗃️ Core Database Entities

The target relational database contains the following major entities:

```text
users
  │
  ├── customers
  │      │
  │      └── customer_followups
  │
  ├── products
  │      │
  │      └── stock_movements
  │
  └── challans
          │
          └── challan_items
```

### Core Tables

* `users`
* `customers`
* `customer_followups`
* `products`
* `categories`
* `stock_movements`
* `challans`
* `challan_items`

Additional business tables can be retained where existing POS functionality requires them.

---

# 📋 Validation Rules

The application validates important business requirements.

### Customer

* Name required
* Valid mobile/email format
* Customer type must be valid
* Status must be valid

### Product

* Product name required
* SKU required
* Price cannot be invalid
* Stock cannot become negative
* Minimum stock quantity must be valid

### Challan

* Customer required
* At least one product required
* Quantity must be greater than zero
* Product must exist
* Sufficient stock required for confirmation
* Draft challans do not reduce stock
* Confirmed challans reduce stock
* Cancelled challans cannot be confirmed

---

# 🖥️ Main Application Screens

The application includes/targets the following modules:

### Dashboard

* Total customers
* Total products
* Current inventory
* Low-stock products
* Challan statistics
* Operational metrics

### CRM

* Customer list
* Add customer
* Edit customer
* Customer details
* Follow-up history

### Inventory

* Product list
* Product creation
* Product editing
* Stock levels
* Low-stock indicators
* Warehouse location

### Stock

* Stock movement list
* IN/OUT movement
* Movement reason
* Created by
* Timestamp

### Sales Challans

* Challan list
* Create challan
* Draft challan
* Confirm challan
* Cancel challan
* Challan details
* Product snapshots

### Administration

* User management
* Role management
* Access control

---

# 📱 Responsive Design

The frontend is designed to work across:

* 💻 Desktop
* 🖥️ Large screens
* 📱 Mobile
* 📲 Tablet

The interface uses responsive layouts so that core business operations remain accessible on different screen sizes.

---

# 🧪 Testing

Before deployment, test the following critical workflows.

## Authentication

```text
☐ Login with valid credentials
☐ Reject invalid credentials
☐ JWT validation
☐ Unauthorized API access blocked
☐ Role permissions enforced
```

## CRM

```text
☐ Create customer
☐ Edit customer
☐ Search customer
☐ View customer details
☐ Add follow-up
☐ View follow-up history
```

## Inventory

```text
☐ Create product
☐ Update product
☐ Search product
☐ Check stock
☐ Low-stock alert
☐ Create stock movement
```

## Challan

```text
☐ Create draft challan
☐ Draft does not reduce stock
☐ Confirm challan
☐ Stock reduces correctly
☐ OUT movement created
☐ Insufficient stock rejected
☐ Negative stock prevented
☐ Product snapshot stored
☐ Cancel challan
☐ Cancelled challan cannot be confirmed
```

---

# 🧰 Postman API Testing

Import the provided Postman collection into Postman.

Recommended test sequence:

```text
1. Login
   ↓
2. Copy JWT token
   ↓
3. Get customers
   ↓
4. Create customer
   ↓
5. Create product
   ↓
6. Create stock movement
   ↓
7. Create draft challan
   ↓
8. Confirm challan
   ↓
9. Verify stock
   ↓
10. Verify stock movement
```

---

# 🐳 Docker

The backend can be containerized using Docker.

Build:

```bash
docker build -t mini-erp-backend .
```

Run:

```bash
docker run -p 5000:5000 mini-erp-backend
```

For a complete environment, Docker Compose can be used to run:

```text
Frontend
Backend
PostgreSQL
```

together.

---

# ☁️ Deployment

The application can be deployed using platforms such as:

### Frontend

* Vercel
* Netlify

### Backend

* Render
* Railway
* Fly.io
* AWS

### Database

* Neon
* Supabase
* Render PostgreSQL
* AWS RDS

---

# 🌍 Production Environment

Example production configuration:

```env
NODE_ENV=production

PORT=5000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

JWT_SECRET=CHANGE_THIS_TO_A_SECURE_SECRET

JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://your-frontend-domain.com
```

---

# 🔒 Security

Security practices include:

* JWT authentication
* Password hashing
* Role-based authorization
* Environment-based secrets
* Input validation
* Protected API routes
* CORS configuration
* No secrets committed to Git
* Server-side permission enforcement

---

# 📈 Scalability

The architecture is designed to support future expansion.

Potential additions include:

* Advanced reporting
* Invoice generation
* Payment tracking
* Supplier management
* Purchase orders
* Purchase invoices
* Multi-warehouse support
* Product image storage
* AWS S3 integration
* Email notifications
* WhatsApp notifications
* Advanced analytics
* Audit logs
* Automated CI/CD

---

# ⭐ Bonus Features

The project can support additional capabilities such as:

* 🐳 Docker
* 🔄 GitHub Actions
* 📄 PDF invoice generation
* 🖼️ Product image upload
* ☁️ Cloud storage
* 📊 Advanced reports
* 📱 Responsive UI
* 🧾 Printable documents
* 🔎 Advanced search and filtering

---

# 🧑‍💻 Development Workflow

Recommended development workflow:

```text
Feature Request
      ↓
Requirement Analysis
      ↓
Database Design
      ↓
Backend API
      ↓
Validation & Business Logic
      ↓
Frontend Integration
      ↓
Testing
      ↓
Code Review
      ↓
Deployment
```

---

# 🌿 Git Workflow

Recommended branch structure:

```text
main
 │
 ├── develop
 │
 ├── feature/crm
 ├── feature/inventory
 ├── feature/challan
 ├── feature/rbac
 └── fix/stock-validation
```

Example:

```bash
git checkout -b feature/crm
```

Commit changes:

```bash
git add .
git commit -m "feat: add customer CRM module"
```

Push:

```bash
git push origin feature/crm
```

---

# 📌 Project Goals

The primary goals of this project are:

1. Centralize wholesale business operations.
2. Improve customer relationship management.
3. Maintain accurate inventory.
4. Prevent stock inconsistencies.
5. Provide controlled role-based access.
6. Simplify sales challan operations.
7. Maintain historical transaction accuracy.
8. Provide a scalable full-stack architecture.

---

# 🎯 Business Benefits

### For Admin

* Complete operational visibility
* User and role management
* Inventory and sales oversight

### For Sales

* Faster customer management
* Follow-up tracking
* Quick challan creation

### For Warehouse

* Accurate stock information
* Stock movement history
* Low-stock monitoring

### For Accounts

* Customer and transaction visibility
* Challan information
* Financial workflow integration

---

# 📊 Project Status

| Module                   | Status                    |
| ------------------------ | ------------------------- |
| Authentication           | ✅ Implemented             |
| JWT Authorization        | ✅ Implemented             |
| Role-Based Access        | ✅ Implemented / Extended  |
| Customer CRM             | 🚧 In Progress / Extended |
| Customer Follow-ups      | 🚧 In Progress            |
| Product Management       | ✅ Existing + Extended     |
| Inventory                | ✅ Existing + Extended     |
| Minimum Stock Alerts     | 🚧 Added                  |
| Warehouse Location       | 🚧 Added                  |
| Stock Movements          | 🚧 Added                  |
| Sales Challans           | 🚧 Added                  |
| Draft / Confirm / Cancel | 🚧 Added                  |
| Product Snapshots        | 🚧 Added                  |
| Dashboard                | ✅ Existing + Extended     |
| REST APIs                | ✅                         |
| Validation               | ✅                         |
| Pagination & Search      | ✅                         |
| Docker                   | ✅ Supported               |
| PDF / Invoice            | ⭐ Bonus                   |
| Deployment               | 🚧 Configuration Required |

> Update the status column before final submission to reflect the actual implementation state.

---

# 📝 Known Limitations

The following items may depend on the final deployment and implementation:

* Production infrastructure configuration
* Cloud database setup
* Final frontend/backend deployment URLs
* Production credentials
* Advanced analytics
* Optional third-party integrations

These should be documented honestly in the final project submission.

---

# 🔮 Future Improvements

Future versions can include:

```text
Multi-Warehouse Management
        ↓
Supplier Management
        ↓
Purchase Management
        ↓
Payment Management
        ↓
Advanced Financial Reports
        ↓
Automated Notifications
        ↓
AI-Based Sales Insights
```

---

# 🤝 Contributing

Contributions are welcome.

### Steps

```bash
git clone <repository-url>

git checkout -b feature/your-feature

npm install

# Make your changes

git add .

git commit -m "feat: describe your change"

git push origin feature/your-feature
```

Then open a Pull Request.

---

# 📄 License

This project is intended for educational, evaluation, and demonstration purposes.

Add an appropriate open-source license if the repository is intended for public distribution.

---

# 👨‍💻 Author

**Aparupa Raj**

🔗 LinkedIn:
https://www.linkedin.com/in/aparuparaj

---

# 📬 Contact

For questions, collaboration, or project discussions, please open an issue in the repository or connect through LinkedIn.

---

# ⭐ If You Like This Project

If this project was useful or interesting, consider giving the repository a ⭐ star.

---

<p align="center">

<strong>Mini ERP + CRM Operations Portal</strong>

<br/>

Built with ❤️ using React, TypeScript, Node.js, Express.js and PostgreSQL.

</p>
