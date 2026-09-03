# TypeScript Migration Master Plan & Inventory
**Project:** Mini ERP + CRM Operations Portal  
**Backend:** POS-Backend  
**Phase 1 Completion Date:** September 3, 2026  
**Target Architecture:** Node.js + Express + PostgreSQL (Neon) in TypeScript (Strict Mode)

---

## 1. Current Backend Structure

The existing backend is a Node.js + Express application operating in CommonJS mode, using parameterised queries via `pg.Pool` connected to Neon PostgreSQL serverless database.

```
POS-Backend/
├── controllers/            # 19 Controller modules
├── services/               # 14 Service modules (PostgreSQL queries & business logic)
├── routes/                 # 20 Express route definitions
├── middleware/             # 4 Middleware files (JWT auth, RBAC, upload, validation)
├── db/                     # PostgreSQL pool, schema, migration, and entity mapper
│   ├── index.js            # pg.Pool connection & query helper
│   ├── mapper.js           # snake_case -> camelCase with _id + id parity mapper
│   ├── migrate.js          # DB schema migration executor
│   ├── test-connection.js  # Connection test utility
│   └── schema.sql          # 16 idempotent PostgreSQL tables
├── utils/                  # 3 Utility helpers (Email, SMS, Store ID generator)
├── models/                 # 12 Legacy Mongoose schemas (retained for entity shape reference)
├── scripts/                # 27 Verification, seeding, and migration scripts
├── index.js                # Express application bootstrap & route mounting
├── package.json            # Backend dependencies and scripts
├── Dockerfile              # Production container build
├── .env.example            # Environment template
└── .env                    # Local environment secrets (untracked by Git)
```

---

## 2. Inventory of JavaScript Files

| Directory / Area | File Count | Description / Role |
| :--- | :---: | :--- |
| `controllers/` | 19 | HTTP handlers parsing requests and returning JSON responses |
| `services/` | 14 | Database query execution, business validation, transactions |
| `routes/` | 20 | Express Router definitions mounting endpoints |
| `middleware/` | 4 | `auth.js` (JWT), `rbac.js` (Role checks), `upload.js` (Multer), `validation.js` |
| `db/` | 4 | Database connection, mapper, migration, connection tester |
| `utils/` | 3 | `emailService.js`, `smsService.js`, `storeIdGenerator.js` |
| `models/` | 12 | Pre-migration Mongoose models (reference schemas) |
| Root files | 3 | `index.js`, `test_store_creation.js`, `test_validation.js` |
| `scripts/` | 27 | Integration test suites (11), schema migrations (5), seed scripts (6) |
| **Total JavaScript Files** | **106** | **Full backend codebase** |

---

## 3. Major Backend Domains

1. **Authentication & RBAC**:
   - Endpoints: `/api/auth/*`
   - Canonical Roles: `Admin`, `Sales`, `Warehouse`, `Accounts` (plus legacy POS roles `manager`, `cashier`).
   - Tokens: JWT with `userId`, `role`, `organizationId`, `storeId`.
   - Security: Password hashing via `bcryptjs`, role enforcement middleware (`middleware/rbac.js`).

2. **CRM & Customers**:
   - Endpoints: `/api/customers/*`
   - Capabilities: Customer directory, customer types (`Retail`, `Wholesale`), follow-up logging, loyalty points tracking.

3. **Inventory & Catalogue**:
   - Endpoints: `/api/catalogues/*`, `/api/products/*`, `/api/categories/*`, `/api/bulk-upload/*`
   - Capabilities: Master SKU catalog, warehouse location tags, minimum stock alert calculation (`current_stock <= minimum_stock`), cut types, CSV bulk upload.

4. **Stock Movement Ledger**:
   - Endpoints: `/api/stock-movements/*`
   - Capabilities: Audit ledger tracking all adjustments, reasons (`INITIAL_STOCK`, `CHALLAN_DISPATCH`, `AUDIT_ADJUSTMENT`, `RESTOCK`), user attribution.

5. **Sales Challans**:
   - Endpoints: `/api/challans/*`
   - Capabilities: Multi-item dispatch challans, lifecycle states (`DRAFT` -> `CONFIRMED` / `CANCELLED`), historical item/pricing snapshots, transactional stock decrement with no-negative-stock protection.

6. **POS Sales & Billing**:
   - Endpoints: `/api/sales/*`, `/api/invoices/*`, `/api/promo-codes/*`
   - Capabilities: Store transactions, GST calculation, discounts, invoice generation with dual ID (`_id`, `id`).

7. **Store Operations & Replenishment**:
   - Endpoints: `/api/stores/*`, `/api/orders/*`, `/api/store-order-invoices/*`, `/api/store-prices/*`
   - Capabilities: Store profiles, location-specific margin/price overrides, store inventory replenishment orders.

8. **ERP Analytics & Reports**:
   - Endpoints: `/api/dashboard/*`, `/api/reports/*`, `/api/health`
   - Capabilities: Top-level sales KPIs, store-by-store sales breakdowns, inventory health, dual database status health check.

---

## 4. Dependencies Requiring TypeScript Types

### Installed in Phase 1 (`devDependencies`):
- `typescript` (^7.0.2)
- `@types/node` (^26.4.1)
- `@types/express` (^4.17.21)
- `@types/pg` (^8.23.1)
- `@types/cors` (^2.8.19)
- `@types/jsonwebtoken` (^9.0.10)
- `@types/bcryptjs` (^2.4.6)
- `@types/multer` (^2.2.0)
- `@types/nodemailer` (^8.0.1)

### Self-Typing Dependencies (No `@types/*` needed):
- `axios` (includes built-in TypeScript definitions)
- `dotenv` (includes built-in TypeScript definitions)
- `date-fns` (includes built-in TypeScript definitions)
- `date-fns-tz` (includes built-in TypeScript definitions)
- `jspdf` (includes built-in TypeScript definitions)
- `moment-timezone` (includes built-in TypeScript definitions)
- `twilio` (includes built-in TypeScript definitions)

---

## 5. Target TypeScript Architecture

```
POS-Backend/
├── src/
│   ├── config/             # Typed environment & configuration
│   ├── types/              # Domain models & Express type extensions
│   │   ├── index.ts        # Foundational types (Created in Phase 1)
│   │   ├── express.d.ts    # Request.user and Request.userObj augmentations
│   │   ├── auth.ts         # User, JWT payload, RBAC roles
│   │   ├── customer.ts     # Customer and follow-up interfaces
│   │   ├── product.ts      # Product, Category, and Catalogue interfaces
│   │   ├── challan.ts      # Challan and ChallanItem interfaces
│   │   └── stockMovement.ts# Stock movement ledger interfaces
│   ├── db/                 # PostgreSQL pool, query helper, and mappers
│   │   ├── index.ts        # Typed pg.Pool & query() helper
│   │   └── mapper.ts       # Strongly typed entity mappers
│   ├── middleware/         # Auth, RBAC, Multer, and validation middleware
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── upload.ts
│   │   └── validation.ts
│   ├── utils/              # Helper utilities
│   │   ├── storeIdGenerator.ts
│   │   ├── emailService.ts
│   │   └── smsService.ts
│   ├── services/           # Business logic & PostgreSQL transactions
│   ├── controllers/        # Express HTTP controllers
│   ├── routes/             # Express route modules
│   └── index.ts            # Application bootstrap
├── dist/                   # Compiled JavaScript build output
├── tsconfig.json           # Strict ES2022 CommonJS configuration
├── package.json            # Scripts: build (tsc), type-check (tsc --noEmit), start (node index.js)
└── .env.example
```

---

## 6. Systematic Conversion Order

Migration will proceed across clearly bounded phases to ensure zero downtime and zero regression:

1. **Phase 1: Foundation (COMPLETED)**
   - Audit complete codebase.
   - Install TypeScript and required `@types/*` packages.
   - Create tailored `tsconfig.json` with strict checking.
   - Prepare package scripts (`build`, `type-check`).
   - Create baseline types (`src/types/index.ts`).
   - Verify compiler execution without touching business logic.

2. **Phase 2: Core Infrastructure & Database Layer**
   - Create `src/types/express.d.ts` (Express `Request` type extension for `req.user`).
   - Migrate `db/index.js` -> `src/db/index.ts`.
   - Migrate `db/mapper.js` -> `src/db/mapper.ts` (strongly-typed dual `id`/`_id` mappers).
   - Migrate `middleware/auth.js` -> `src/middleware/auth.ts`.
   - Migrate `middleware/rbac.js` -> `src/middleware/rbac.ts`.

3. **Phase 3: Utilities & Foundational Domain Services**
   - Migrate `utils/` (`storeIdGenerator.ts`, `emailService.ts`, `smsService.ts`).
   - Migrate core identity and org services: `userService.ts`, `organizationService.ts`, `storeService.ts`.

4. **Phase 4: Operations Domain Services (ERP Core)**
   - Migrate `catalogueService.ts` & `categoryService.ts` (Inventory).
   - Migrate `stockMovementService.ts` (Audit ledger).
   - Migrate `challanService.ts` (Sales challans & transactional stock updates).
   - Migrate `customerService.ts` (CRM & follow-ups).
   - Migrate `salesService.ts`, `invoiceService.ts`, `orderService.ts`, `promoCodeService.ts`, `dashboardService.ts`, `reportService.ts`.

5. **Phase 5: Controllers, Routes & Application Entry Point**
   - Migrate all 19 controllers from `controllers/*.js` to `src/controllers/*.ts`.
   - Migrate all 20 routes from `routes/*.js` to `src/routes/*.ts`.
   - Migrate `index.js` -> `src/index.ts`.
   - Switch `npm start` to run compiled `dist/index.js`.
   - Execute full regression test suite (all 11 test suites) against the compiled TypeScript backend.

---

## 7. Known Migration Risks & Mitigations

1. **Express Request User Augmentation:**
   - *Risk:* `req.user` and `req.userObj` injected by `auth.js` will cause TypeScript compilation errors if not declared on Express `Request`.
   - *Mitigation:* Create ambient declaration `src/types/express.d.ts` extending `Express.Request` interface.

2. **Dual-Field Identity Parity (`_id` and `id`):**
   - *Risk:* Frontend components access both `._id` (from MongoDB legacy) and `.id` (relational).
   - *Mitigation:* The TypeScript entity interfaces will strictly define both `id: string` and `_id: string`.

3. **JSONB Type Parsing:**
   - *Risk:* PostgreSQL `address`, `items`, and `customer_details` columns are JSONB, returned as objects by `pg` but sometimes passed as strings.
   - *Mitigation:* Implement strongly-typed parser utility guaranteeing object shape.

4. **Zero Production Disruption During Migration:**
   - *Risk:* Incomplete TypeScript migration breaking deployment if `npm start` is modified prematurely.
   - *Mitigation:* The current production `start` command (`node index.js`) remains untouched throughout preliminary phases until Phase 5 switchover.

---

## 8. Phase 2 Starting Point

**Phase 2 Target:** Database Layer & Express Request Augmentation.  
Files to migrate in Phase 2:
1. `src/types/express.d.ts` (Express `Request.user` & `Request.userObj` typing)
2. `src/db/index.ts` (PostgreSQL connection pool & parameterised query helper)
3. `src/db/mapper.ts` (Dual `_id`/`id` entity mapper functions)
4. `src/middleware/auth.ts` (JWT verification & user attachment)
5. `src/middleware/rbac.ts` (Authoritative server-side role authorization)
