# 🚀 Mini ERP + CRM Operations Portal

<p align="center">
  <strong>A Full-Stack ERP & CRM Operations Platform for Wholesale & Distribution Businesses</strong>
</p>

<p align="center">
  Manage customers, products, inventory, stock movements, sales challans,
  users, follow-ups, and business operations from one centralized platform.
</p>

<p align="center">

<img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
<img src="https://img.shields.io/badge/Express.js-REST%20API-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
<img src="https://img.shields.io/badge/React-18%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/TypeScript-Frontend-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black" alt="Neon"/>
<img src="https://img.shields.io/badge/Render-Deployment-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render"/>
<img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>

</p>

<p align="center">

<img src="https://img.shields.io/badge/REST%20API-Enabled-FF6B35?style=flat-square" alt="REST API"/>
<img src="https://img.shields.io/badge/RBAC-Enabled-8E44AD?style=flat-square" alt="RBAC"/>
<img src="https://img.shields.io/badge/Responsive-UI-00A86B?style=flat-square" alt="Responsive UI"/>
<img src="https://img.shields.io/badge/PostgreSQL-Production-4169E1?style=flat-square" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Status-Production-2EA44F?style=flat-square" alt="Production"/>

</p>

---

## 📌 Overview

**Mini ERP + CRM Operations Portal** is a full-stack business operations platform designed for **wholesale and distribution companies**.

The platform combines essential **ERP (Enterprise Resource Planning)** and **CRM (Customer Relationship Management)** workflows into one centralized system.

It helps businesses manage:

- 👥 Customers and CRM activities
- 📦 Products and categories
- 📊 Inventory and stock levels
- 🔄 Stock movement history
- 🧾 Sales challans
- 👤 Role-based users
- 📈 Operational dashboards
- 🔐 Authentication and authorization
- 📅 Customer follow-ups
- 📝 Customer notes
- 🧮 Business and sales information

The project extends an existing POS foundation and transforms it into a focused ERP + CRM operations platform.

---

# 🎯 Project Objective

The objective of this project is to provide a practical ERP + CRM solution for wholesale and distribution operations while demonstrating:

- Full-stack web application development
- REST API development
- JWT authentication
- Role-based access control
- PostgreSQL database integration
- Customer relationship management
- Product and inventory management
- Stock movement auditing
- Sales challan workflows
- Transaction-safe stock operations
- Responsive React frontend
- Production deployment
- API testing and documentation

The implementation focuses on the core business requirements without unnecessarily expanding the system beyond the assignment scope.

---

# ✨ Features

## 🔐 Authentication & Authorization

- JWT-based authentication
- Secure password hashing
- Role-based access control
- Protected API routes
- Organization-level data isolation
- Authenticated frontend routes
- Role-aware navigation
- Structured authentication errors

### Supported Roles

| Role | Access |
|---|---|
| 👑 **Admin** | Full system access |
| 💼 **Sales** | CRM, customer follow-ups, challans and operational views |
| 🏭 **Warehouse** | Products, inventory and stock movements |
| 💰 **Accounts** | Customer, challan and operational/financial views |

Legacy POS roles such as `manager` and `cashier` are retained where required for compatibility with existing POS functionality.

---

# 👥 CRM — Customer Management

The CRM module manages customers and their business interactions.

## Customer Fields

- Customer name
- Mobile number
- Email
- Business name
- GST number
- Customer type
- Address
- Status
- Follow-up date
- Notes

### Customer Types

- Retail
- Wholesale
- Distributor

### Customer Status

- Lead
- Active
- Inactive

## CRM Capabilities

- Add customer
- Edit customer
- View customer details
- Search customers
- Filter customers
- Pagination
- Customer follow-ups
- Follow-up history
- Follow-up notes
- Customer status management
- Organization-level isolation

---

# 📦 Product & Inventory Management

The inventory module manages products, pricing and stock information.

## Product Fields

- Product name
- SKU / Product Code
- Category
- Unit price
- Current stock
- Minimum stock alert quantity
- Warehouse / Location
- Barcode where applicable

## Inventory Capabilities

- Add product
- Edit product
- View products
- Search products
- Filter products
- Pagination
- Low-stock detection
- Out-of-stock detection
- Warehouse/location tracking
- Current stock visibility

### Low Stock Rule

A product is considered low stock when:

```text
minimum_stock > 0
AND
current_stock <= minimum_stock
🔄 Stock Movement Management
The platform maintains an auditable history of inventory changes.

Each stock movement records:

Field	Description
Product	Product affected by the movement
Quantity	Quantity changed
Type	IN or OUT
Reason	Reason for the movement
Created By	User who performed the operation
Timestamp	Date and time
Reference	Related transaction/challan where applicable
Movement Types
IN
→ Stock added to inventory

OUT
→ Stock removed from inventory
Stock movement records are treated as historical audit records.

🧾 Sales Challan Management
The Sales Challan module implements the required wholesale sales-document workflow.

Challan Features
Select customer

Add multiple products

Add product quantities

Automatic challan number

Create Draft Challan

Edit Draft Challan

Confirm Challan

Cancel Challan

View Challan details

Preserve historical product information

Challan Status
DRAFT
CONFIRMED
CANCELLED
Draft Challan
Editable
No stock deduction
No stock OUT movement
Confirmed Challan
Immutable
Stock deducted
Stock OUT movement created
Cancelled Challan
Immutable
No new stock deduction
🛡️ Challan Business Rules
The system prevents inventory from becoming negative.

During challan confirmation:

1. Load the challan
2. Validate challan status
3. Lock required product rows
4. Check available stock
5. Reject if stock is insufficient
6. Deduct stock
7. Create stock OUT movements
8. Mark challan as CONFIRMED
9. Commit the transaction
If available stock is insufficient, the API returns a conflict response and the transaction is rolled back.

HTTP 409 Conflict
This prevents partial stock deductions.

📸 Product Snapshot Preservation
Sales challans preserve product information at the time the challan is created.

Challan item snapshots include:

Product name

SKU

Unit price

Quantity

Line total

This ensures that historical challans remain accurate even if the product information changes later.

📊 ERP Operations Dashboard
The dashboard provides a centralized view of business operations.

Customer Metrics
Total customers

Active customers

Lead customers

Inactive customers

Inventory Metrics
Total products

Low-stock products

Out-of-stock products

Total stock quantity

Estimated inventory value

Challan Metrics
Today's challans

Draft challans

Confirmed challans

Cancelled challans

Today's confirmed amount

CRM Metrics
Follow-ups due

Upcoming follow-ups

Operational Alerts
🚨 Out-of-stock products

⚠️ Low-stock products

🧾 Pending draft challans

📅 Due / overdue follow-ups

🔌 REST API
The backend exposes REST APIs for authentication, users, CRM, products, inventory, stock movements, sales challans and dashboard operations.

Production Backend
https://mini-erp-crm-operations-portal-q5pf.onrender.com
Production API Base URL
https://mini-erp-crm-operations-portal-q5pf.onrender.com/api
Authentication Header
Protected endpoints use:

Authorization: Bearer <JWT_TOKEN>
📚 Main API Modules
Module	Endpoint
🔐 Authentication	/api/auth
👤 Users / RBAC	/api/users
👥 Customers	/api/customers
📦 Products	/api/products
📦 Catalogue	/api/catalogues
🔄 Stock Movements	/api/stock-movements
🧾 Sales Challans	/api/challans
📊 Dashboard	/api/dashboard
🛒 Sales	/api/sales
🧾 Invoices	/api/invoices
📦 Orders	/api/orders
🧪 Core API Endpoints
Authentication
POST /api/auth/login
POST /api/auth/organization/login
POST /api/auth/store/login
GET  /api/auth/profile
Customers
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id

GET    /api/customers/:id/follow-ups
POST   /api/customers/:id/follow-ups
Products
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
Catalogue Compatibility
GET    /api/catalogues
GET    /api/catalogues/:id
POST   /api/catalogues
PUT    /api/catalogues/:id
DELETE /api/catalogues/:id

GET    /api/catalogues/search
Stock Movements
GET  /api/stock-movements
GET  /api/stock-movements/:id
POST /api/stock-movements
Sales Challans
POST /api/challans
GET  /api/challans
GET  /api/challans/:id
PUT  /api/challans/:id
POST /api/challans/:id/confirm
POST /api/challans/:id/cancel
Dashboard
GET /api/dashboard/overview
📋 API Design
The REST API implements:

Request validation

JWT authentication

Role authorization

Organization isolation

Proper HTTP status codes

Structured error responses

Pagination

Search

Filtering

PostgreSQL transactions

Row-level locking

Inventory validation

Audit logging

🧪 Postman API Testing
The APIs have been tested and documented using Postman.

The Postman collection is organized around the major application modules:

01. Authentication
02. Customers (CRM)
03. Products & Inventory
04. Stock Movements
05. Sales Challans
06. ERP Dashboard
07. Existing POS APIs
Typical Testing Flow
Login
  ↓
Get Customers
  ↓
Create Customer
  ↓
Get Products
  ↓
Create / Update Product
  ↓
Add Stock
  ↓
Create Draft Challan
  ↓
Confirm Challan
  ↓
Verify Stock Movement
  ↓
Verify Dashboard
API documentation contains:

HTTP method

Endpoint

Authentication requirements

Headers

Request JSON

Response JSON

Validation errors

HTTP status codes

Role restrictions

Business rules

🗄️ Database
Production Database
PostgreSQL
Hosted on Neon
The project uses PostgreSQL as the production operational database.

The previous MongoDB/Mongoose data layer was migrated to PostgreSQL.

🧩 Core Database Entities
Organizations
Stores
Users
Categories
Products
Store Prices
Promo Codes
Customers
Customer Follow-ups
Stock Movements
Sales
Invoices
Orders
Store Order Invoices
Challans
Challan Items
🔒 Database Integrity
The database layer uses:

Relational constraints

Foreign keys

Indexes

Transactions

Row-level locking

Validation constraints

Audit records

Organization-level data isolation

Stock-sensitive operations use transactional logic to prevent inconsistent inventory states.

🏗️ Application Architecture
The application is organized into frontend, backend and database layers.

React Frontend
      │
      ▼
REST API
      │
      ▼
Express Backend
      │
      ├── Authentication
      ├── RBAC
      ├── Controllers
      ├── Services
      └── Validation
      │
      ▼
PostgreSQL
      │
      ▼
Neon
🛠️ Technology Stack
Frontend
React

TypeScript

HTML5

CSS

JavaScript / TypeScript

Axios

Responsive UI

Backend
Node.js

Express.js

REST APIs

JWT

bcrypt

PostgreSQL

pg

Database
PostgreSQL

Neon

Deployment
Render Static Site

Render Web Service

Neon PostgreSQL

Supporting Technologies
jsPDF

Multer

Nodemailer

Twilio integration

CSV parsing

Date/time utilities

📁 Project Structure
mini-erp-crm-operations-portal/
│
├── POS-Backend/
│   ├── controllers/
│   ├── db/
│   │   ├── index.js
│   │   ├── migrate.js
│   │   ├── schema.sql
│   │   └── test-connection.js
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   ├── utils/
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── POS-Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── modules/
│   │   ├── pages/
│   │   └── api.ts
│   └── package.json
│
├── README.md
└── ...
The backend structure will be updated to the final TypeScript structure after the JavaScript-to-TypeScript migration.

💻 Local Development
Prerequisites
Install the following:

Node.js 20+

npm

Git

PostgreSQL / Neon database access

1. Clone the Repository
git clone https://github.com/biswalkanha07/mini-erp-crm-operations-portal.git

cd mini-erp-crm-operations-portal
⚙️ Backend Setup
Navigate to the backend:

cd POS-Backend
Install dependencies:

npm install
Create a .env file:

DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
Start the backend:

npm start
🗄️ Database Setup
Test the PostgreSQL connection:

npm run db:test
Run the database migration:

npm run db:migrate
🎨 Frontend Setup
From the project root:

cd POS-Frontend
Install dependencies:

npm install
Configure the frontend API URL:

REACT_APP_API_URL=http://localhost:5050/api
Run the frontend using the development command configured in the frontend package.

🔐 Environment Variables
Backend
DATABASE_URL=
JWT_SECRET=
NODE_ENV=
Frontend
REACT_APP_API_URL=
Security
Do not commit:

.env
database passwords
JWT secrets
API keys
Twilio credentials
email passwords
private credentials
Use .env.example to document required environment variables.

🚀 Production Deployment
The application is deployed using Render with Neon PostgreSQL.

Backend
https://mini-erp-crm-operations-portal-q5pf.onrender.com
Backend API
https://mini-erp-crm-operations-portal-q5pf.onrender.com/api
Health Check
GET /api/health
The health endpoint verifies application and PostgreSQL connectivity.

Frontend
<https://erpandcrmportal.onrender.com/>
📊 Testing & Verification
The implementation has been verified through module-level and regression testing.

Module	Result
Authentication / RBAC	✅ 26 / 26
CRM	✅ 24 / 24
Inventory	✅ 27 / 27
Stock Movements	✅ 29 / 29
Sales Challans	✅ 29 / 29
ERP Dashboard	✅ 26 / 26
Existing POS Regression	✅ 17 / 17
Frontend Authentication	✅ 9 / 9
Frontend Production Build	✅ PASS
Recorded Regression Result
187 / 187 tests passed
The frontend production build also completed successfully.

🔄 PostgreSQL Migration
The project was migrated from the original MongoDB/Mongoose data layer to PostgreSQL.

The migration included:

Relational database schema

Existing business data migration

Organizations

Stores

Users

Categories

Products

Customers

Sales

Invoices

Orders

Stock-related data

PostgreSQL services

PostgreSQL controllers

PostgreSQL API routes

The production runtime uses PostgreSQL.

🔐 Security & Data Isolation
The application implements:

JWT authentication

bcrypt password hashing

Role-based access control

Protected routes

Organization-level isolation

Server-side authorization

Request validation

Database constraints

Transaction-safe stock operations

Users cannot access data outside their authorized organization context.

📋 Role Access Summary
Feature	Admin	Sales	Warehouse	Accounts
Login	✅	✅	✅	✅
Customers	✅	✅	👁️	👁️
Customer Follow-ups	✅	✅	❌	👁️
Products	✅	👁️	✅	👁️
Inventory	✅	👁️	✅	👁️
Stock Movements	✅	👁️	✅	👁️
Sales Challans	✅	✅	👁️	👁️
Dashboard	✅	✅	✅	✅
User Management	✅	❌	❌	❌
Legend:

✅ Full / permitted access
👁️ View access
❌ Restricted
📦 Sales Challan Transaction Safety
The challan confirmation process is designed to avoid partial stock updates.

The system:

Validates the challan.

Locks the required product rows.

Checks stock availability.

Rejects insufficient stock.

Deducts inventory.

Creates stock movement records.

Updates challan status.

Commits the transaction.

If any critical operation fails, the transaction is rolled back.

📝 API Error Handling
The API uses appropriate HTTP status codes.

Code	Meaning
200	Successful request
201	Resource created
400	Validation / bad request
401	Authentication required / invalid credentials
403	Insufficient permission
404	Resource not found
409	Business rule conflict
500	Internal server error
Example insufficient stock response:

{
  "status": "error",
  "message": "Insufficient stock",
  "data": {
    "productId": "PRODUCT_ID",
    "availableStock": 5,
    "requestedQuantity": 10
  }
}
📚 Documentation
The project documentation includes:

Project overview

Setup instructions

API documentation

Postman testing

Architecture explanation

Database information

Role permissions

Business rules

Deployment information

Testing results

Known limitations

🌐 Project Links
GitHub Repository
https://github.com/biswalkanha07/mini-erp-crm-operations-portal
Active Branch
erp-final
Backend
https://mini-erp-crm-operations-portal-q5pf.onrender.com
API Base URL
https://mini-erp-crm-operations-portal-q5pf.onrender.com/api
Health Endpoint
https://mini-erp-crm-operations-portal-q5pf.onrender.com/api/health
Frontend
<ADD_FINAL_FRONTEND_RENDER_URL>
👤 Evaluation Credentials
For security, credentials should not be committed to this public repository.

Provide the evaluator credentials through the official assignment submission channel.
Authentication	✅
JWT Authentication	✅
Admin Role	✅
Sales Role	✅
Warehouse Role	✅
Accounts Role	✅
Customer Management	✅
Customer Search	✅
Customer Details	✅
Customer Follow-ups	✅
Product Management	✅
Inventory Management	✅
Minimum Stock Alert	✅
Warehouse / Location	✅
Stock Movement Log	✅
IN / OUT Movements	✅
Stock Audit	✅
Sales Challan	✅
Multiple Challan Products	✅
Automatic Challan Number	✅
Draft Challan	✅
Confirmed Challan	✅
Cancelled Challan	✅
Product Snapshots	✅
No Negative Stock	✅
Insufficient Stock Error	✅
REST APIs	✅
Request Validation	✅
HTTP Status Codes	✅
Error Handling	✅
Pagination	✅
Search / Filtering	✅
Responsive React UI	✅
PostgreSQL	✅
Neon Database	✅
Backend Deployment	✅
Frontend Deployment	✅
README Documentation	✅
Postman/API Documentation	✅
Architecture Explanation	✅
Known Limitations	✅
Backend TypeScript	🔄 Final Migration
⚠️ Known Limitations
The backend is currently implemented using Node.js + Express.js with JavaScript. The final migration to TypeScript is the remaining technical compliance task.

The repository retains broader legacy POS functionality beyond the core ERP/CRM case-study scope.

Some legacy frontend components may contain lint warnings even though the production build completes successfully.

Optional email/SMS integrations require their respective production credentials and configuration when enabled.

The core ERP/CRM workflows are implemented and covered by the recorded regression tests.

🔮 Future Improvements
Possible future enhancements include:

Advanced business analytics

Extended reporting

PDF challan generation

Cloud-based product image storage

Automated CI/CD workflows

Dockerized deployment

Granular permission management

Advanced notification workflows

Additional ERP modules

📋 Final Submission Checklist
Before submitting the project, verify:

 GitHub repository is accessible

 Final branch contains the latest code

 README is updated

 Frontend live URL is added

 Backend live URL is verified

 PostgreSQL / Neon is connected

 Admin credentials are prepared

 Sales credentials are prepared

 Warehouse credentials are prepared

 Accounts credentials are prepared

 Postman collection is ready

 API documentation is ready

 Architecture explanation is included

 Known limitations are documented

 Final live E2E testing is completed

 Backend TypeScript migration is completed

 Final production build passes

 No secrets are committed to GitHub

🏁 Project Status
<p align="center">
<strong>Mini ERP + CRM Operations Portal</strong>

<br><br>

Wholesale & Distribution Operations Platform

<br><br>

<strong>ERP • CRM • Inventory • Stock Audit • Sales Challans • RBAC</strong>

<br><br>

React • TypeScript • Node.js • Express.js • PostgreSQL • Neon • Render

</p>
<p align="center"> Built as a focused full-stack ERP + CRM operations solution for wholesale and distribution workflows. </p> ```
