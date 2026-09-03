# Mini ERP + CRM Operations Portal — Backend

A modular enterprise resource planning (ERP) and customer relationship management (CRM) backend built with **TypeScript**, **Node.js / Express**, and **PostgreSQL (Neon Serverless)**.

---

## 1. Project Overview

The **Mini ERP + CRM Operations Portal** provides operational support for retail, wholesale, inventory, and supply chain management. The system unifies multi-store point of sale (POS) transactions, multi-role ERP workflows, inventory control, audit-logged stock movements, and customer relationship follow-ups under a single, hardened backend architecture.

### Key Capabilities
- **Unified Authentication & RBAC**: Centralized JWT login supporting `Admin`, `Sales`, `Warehouse`, `Accounts`, `manager`, and `cashier` roles with strict route-level permission enforcement.
- **CRM Customer Operations**: Customer lifecycle tracking (Retail vs. Wholesale, Lead vs. Active vs. Inactive), customer purchase history, and timestamped follow-up note logging.
- **Inventory & Catalogue Control**: Comprehensive product catalog with SKU, barcode, unit pricing, minimum stock thresholds, low-stock alerting, and warehouse location management.
- **Stock Movement Ledger**: Immutable audit log for all stock adjustments (`IN` restocking, `OUT` write-offs/damage/sales) with reason codes and user attribution.
- **Sales Challans (Dispatches)**: Multi-item sales challan workflow (`DRAFT` → `CONFIRMED` / `CANCELLED`) featuring transactional inventory reservation, concurrency-safe pessimistic locking (`SELECT ... FOR UPDATE`), and atomic rollback on insufficient stock.
- **ERP Analytics Dashboard**: Real-time cross-functional metrics, low-stock indicators, upcoming follow-ups, and operational alerts.

---

## 2. Technology Stack

- **Language**: TypeScript 5.x (Strict mode, ES2022 target, CommonJS module resolution)
- **Runtime**: Node.js (v18+)
- **Framework**: Express 4.x
- **Database**: PostgreSQL 18.6 (Neon Serverless with SSL)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) + `bcryptjs`
- **File Uploads**: `multer`
- **PDF & Communication**: `jspdf`, `nodemailer`, `twilio`

---

## 3. Backend Architecture

The backend adheres to a clean, layered architecture where **TypeScript is the single source of truth**:

```
POS-Backend/
├── src/                        # 100% TypeScript source of truth
│   ├── controllers/            # 18 Request handlers & response formatters
│   ├── services/               # 14 Business logic & database transaction services
│   ├── routes/                 # 20 Express route definitions with RBAC middleware
│   ├── middleware/             # Auth (JWT), RBAC guards, file upload, validation
│   ├── db/                     # Neon PostgreSQL pool connection & row mappers
│   ├── types/                  # Domain entity types, Express Request augmentations
│   ├── utils/                  # Store ID generation, email, SMS notification helpers
│   └── index.ts                # Application entrypoint & HTTP server boot
│
├── dist/                       # Compiled JavaScript production build (tsc target)
├── db/                         # Database schema migrations & connection health scripts
├── scripts/                    # Regression verification & seed test suites
├── package.json                # Dependencies, start ("node dist/index.js"), build scripts
├── tsconfig.json               # TypeScript compiler configuration
└── .env.example                # Safe environment variable template
```

### Compilation & Execution
1. **Source Code**: All business logic, controllers, routes, models, and middleware are written in TypeScript in `src/`.
2. **Compiler**: `tsc` compiles TypeScript from `src/` to `dist/` (`npm run build`).
3. **Production Runtime**: `node dist/index.js` executes the compiled code without any runtime TypeScript transpilers.

---

## 4. Database Architecture (Neon PostgreSQL)

The system is backed by **Neon Serverless PostgreSQL**. MongoDB and Mongoose have been completely decoupled and removed.

### Connection & Concurrency Safety
- **Connection Pooling**: Managed via `pg.Pool` with SSL configuration (`rejectUnauthorized: false`).
- **Deadlock-Free Concurrency**: In critical transactional endpoints (Sales POS checkout and Sales Challan confirmation), row-level locks (`SELECT ... FOR UPDATE`) are acquired with sorted product identifiers (`productIds.sort()`) to eliminate transaction deadlock hazards.
- **Atomic Rollback**: If any line item in a multi-item challan or POS transaction encounters insufficient stock, the entire PostgreSQL transaction (`BEGIN ... ROLLBACK`) aborts cleanly without partial inventory deductions.

---

## 5. Authentication & Role-Based Access Control (RBAC)

All users authenticate through a single endpoint: `POST /api/auth/login`.

| Role | Permissions & Access Scope |
| :--- | :--- |
| **Admin** | Unrestricted access: User management, organization/store setup, catalogue, stock movements, challans, pricing, CRM, and financial analytics. |
| **Sales** | Customer CRM & follow-ups, sales transactions, catalogue lookup, challan creation/confirmation, and dashboard overview. Restricted from user management and category modifications. |
| **Warehouse** | Inventory management, minimum stock updates, catalogue creation/edits, manual stock adjustments (`IN`/`OUT`), and challan read access. Restricted from user management, pricing overrides, and customer modifications. |
| **Accounts** | Financial dashboard metrics, invoice generation, customer purchase histories, and sales reports. Restricted from mutating inventory and user management. |
| **Store Manager / Cashier** | Store-level POS interface, transaction creation, store-specific orders, and customer lookups. Scoped strictly to the assigned store. |

---

## 6. Local Setup & Installation

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- PostgreSQL database URL (Neon Serverless or compatible PostgreSQL 14+)

### 1. Clone & Install
```bash
cd POS-Backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your credentials:
```bash
cp .env.example .env
```

Required variables:
```env
PORT=5050
DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secure-random-jwt-secret-key

# Optional integrations
TWILIO_SID=your-twilio-sid
TWILIO_AUTH=your-twilio-auth-token
TWILIO_FROM=+1234567890
```

### 3. Verify Database Connection
```bash
npm run db:test
```

### 4. Build TypeScript Distribution
```bash
npm run build
```

### 5. Start Production Server
```bash
npm start
```
The server will start on port `5050` (or `PORT` defined in `.env`).

---

## 7. Scripts Reference

| Command | Purpose |
| :--- | :--- |
| `npm run build` | Compiles TypeScript from `src/` to `dist/` using `tsc`. |
| `npm run type-check` | Performs strict TypeScript type validation (`tsc --noEmit`). |
| `npm start` | Launches the compiled production application (`node dist/index.js`). |
| `npm run db:test` | Validates PostgreSQL connection health and version. |
| `npm run db:migrate` | Runs database schema definitions (`db/schema.sql`). |
| `node scripts/run-all-suites.js` | Runs all 11 backend regression test suites sequentially. |

---

## 8. Verification & Test Suites

The backend includes 11 automated test suites covering all operational endpoints:

1. **Auth & User Management**: Common login, password sanitization, user creation, role assignment, duplicate prevention.
2. **Production Hardening & Security**: Input validation, 401/403/404 boundary handling, SQL injection resistance, JWT tampering.
3. **End-to-End Scenarios**: Cross-functional operational workflows across CRM, Inventory, Stock Movements, and Challans.
4. **ERP Dashboard Analytics**: Real-time overview metrics, alert generation, and read-only query integrity.
5. **Sales Challans & Inventory Sync**: Draft state isolation, stock reservation, insufficient stock 409 conflict, concurrent confirmation.
6. **Stock Movement Ledger & Audit**: IN/OUT adjustments, positive integer validation, audit trail attribution.
7. **Inventory & Catalogue**: Category filtering, low-stock threshold detection, search by SKU/keyword.
8. **CRM Customer Operations**: Customer CRUD, status/type filters, timestamped follow-up append-only history.
9. **RBAC Authorization Matrix**: Strict 403 Forbidden enforcement across all role boundaries.
10. **Legacy POS & Core API Regression**: Store prices, promo codes, transactions, invoice generation.
11. **Frontend Auth Flow Simulation**: Multi-role login payload verification matching frontend expectations.

To run the complete verification suite:
```bash
node scripts/run-all-suites.js
```

---

## 9. API Reference Summary

All API routes are prefixed with `/api`:

- **Auth**: `POST /api/auth/login`, `POST /api/auth/register-admin`, `GET /api/auth/profile`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- **Users**: `GET /api/users`, `POST /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- **Catalogues & Products**: `GET /api/catalogues`, `POST /api/catalogues`, `GET /api/catalogues/:id`, `PUT /api/catalogues/:id`, `DELETE /api/catalogues/:id`
- **Categories**: `GET /api/categories`, `POST /api/categories`, `GET /api/categories/:id`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
- **Customers**: `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`, `GET /api/customers/:id/follow-ups`, `POST /api/customers/:id/follow-ups`
- **Stock Movements**: `GET /api/stock-movements`, `POST /api/stock-movements`, `GET /api/stock-movements/:id`
- **Sales Challans**: `GET /api/challans`, `POST /api/challans`, `GET /api/challans/:id`, `PUT /api/challans/:id`, `POST /api/challans/:id/confirm`, `POST /api/challans/:id/cancel`
- **Sales & POS**: `POST /api/sales/transaction`, `GET /api/sales`, `GET /api/sales/transaction/:id`, `GET /api/sales/search`
- **Invoices**: `POST /api/invoices/generate`, `GET /api/invoices`, `GET /api/invoices/:id`, `POST /api/invoices/send-sms`
- **Dashboard**: `GET /api/dashboard/overview`, `GET /api/dashboard/stats`, `GET /api/dashboard/inventory-stats`, `GET /api/dashboard/sales-by-store`
- **Health**: `GET /api/health`, `GET /api/health/postgres`

---

## 10. Known Limitations

- Real SMS delivery via Twilio and external email delivery require valid credentials configured in the environment (`TWILIO_*`, `EMAIL_*`). If unconfigured, notification services safely log messages without failing the core business transactions.
- Offline POS transactions must be synchronized upon network restoration via the standard `POST /api/sales/transaction` endpoint.

---

## 11. Migration Summary

- **Phase 1**: TypeScript foundation, tsconfig setup, project audit.
- **Phase 2**: Neon PostgreSQL pool connection, row mapper, auth and RBAC middleware migrated to TypeScript.
- **Phase 3**: Core utilities, User, Store, and Organization services migrated to TypeScript.
- **Phase 4**: Full runtime migration (18 controllers, 14 services, 20 routes, entrypoint) to TypeScript.
- **Phase 5**: Dead code removal, legacy Mongoose models and dependency removal, transitional bridge removal, regression test pass (252/252 tests), documentation update, and production deployment readiness.