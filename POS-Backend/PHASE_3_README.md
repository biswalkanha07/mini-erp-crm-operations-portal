# Phase 3: Utilities & Core Domain Services Documentation

## Overview

In **Phase 3**, the foundational utility and core identity/organization services were migrated from CommonJS JavaScript to genuine TypeScript with strict typing. The TypeScript source code in `src/` is the single source of truth, compiling into `dist/` while providing zero-overhead compatibility bridges for existing JavaScript callers.

---

## 1. Migrated Components & File Map

| Original File (Transitional Bridge) | TypeScript Source of Truth | Purpose |
| :--- | :--- | :--- |
| `utils/storeIdGenerator.js` | `src/utils/storeIdGenerator.ts` | Sequential store ID generator (`STORE0001`, `STORE0002`) querying PostgreSQL |
| `utils/emailService.js` | `src/utils/emailService.ts` | Nodemailer transporter, HTML templates, and email delivery for onboarding & reset |
| `utils/smsService.js` | `src/utils/smsService.ts` | Twilio SMS notification dispatch utility |
| `services/userService.js` | `src/services/userService.ts` | User account CRUD, credential handling, token lookup, and status management |
| `services/organizationService.js` | `src/services/organizationService.ts` | Multi-tenant organization CRUD and tenant isolation |
| `services/storeService.js` | `src/services/storeService.ts` | Store directory, transactional onboarding (`BEGIN...COMMIT`), and pricing overrides |

---

## 2. Required Environment Variables

Ensure the following environment variables are defined in your `.env` file:

```env
# Database Configuration (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_...

# Authentication
JWT_SECRET=your_jwt_secret_key

# Email Service (Nodemailer / Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend URL (For Onboarding & Password Reset Links)
FRONTEND_URL=http://localhost:3000

# SMS Service (Twilio)
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH=your_twilio_auth_token
TWILIO_FROM=+1XXXXXXXXXX
```

---

## 3. Service Usage & API Reference

### A. Store ID Generator (`src/utils/storeIdGenerator.ts`)
```typescript
import { generateNextStoreId } from './utils/storeIdGenerator';

// Returns the next formatted store ID, e.g. "STORE0005"
const nextId = await generateNextStoreId();
```

### B. Email Service (`src/utils/emailService.ts`)
```typescript
import { sendStoreSignupEmail, sendPasswordResetEmail } from './utils/emailService';

// Send store manager onboarding invitation
await sendStoreSignupEmail(
  'manager@store.com',
  'STORE0001',
  'Downtown Branch',
  'John Doe',
  'https://pos.example.com/signup?storeId=STORE0001&token=...'
);

// Send password reset email
await sendPasswordResetEmail('user@example.com', 'Jane Doe', 'https://pos.example.com/reset-password?token=...');
```

### C. SMS Service (`src/utils/smsService.ts`)
```typescript
import { sendInvoiceSMS } from './utils/smsService';

// Dispatches SMS message via Twilio
await sendInvoiceSMS('+919876543210', 'Thank you for your purchase. Invoice #INV-1001 generated.');
```

### D. User Service (`src/services/userService.ts`)
```typescript
import userService, { CreateUserData, UpdateUserData } from './services/userService';

// User lookups
const user = await userService.getById('USER_001');
const userByEmail = await userService.getByEmail('admin@pos.com');
const userByToken = await userService.getByResetToken('reset_token_hex');

// Create user
const newUser = await userService.create({
  name: 'Sales Rep',
  email: 'sales@pos.com',
  password: 'hashed_password',
  role: 'sales',
  userType: 'organization',
  organizationId: 'ORG001'
});

// Update & Delete
await userService.update('USER_001', { name: 'Updated Name' });
await userService.delete('USER_001');
```

### E. Organization Service (`src/services/organizationService.ts`)
```typescript
import organizationService from './services/organizationService';

// List & Lookup
const orgs = await organizationService.getAll();
const org = await organizationService.getById('ORG001');

// Create & Update
const newOrg = await organizationService.create({
  organizationName: 'Acme Enterprises',
  email: 'contact@acme.com',
  contactPersonName: 'Alice',
  contactNumber: '9876543210',
  address: { city: 'Bhubaneswar', state: 'Odisha' }
});
await organizationService.update('ORG001', { organizationName: 'Acme Corp' });
```

### F. Store Service (`src/services/storeService.ts`)
```typescript
import storeService from './services/storeService';

// Query stores with filter
const stores = await storeService.getAll({ organizationId: 'ORG001' });
const searchResults = await storeService.searchAndFilter({ search: 'Downtown', status: 'active' });

// Transactional Store Creation + Manager User Setup
const result = await storeService.createStore({
  storeName: 'Central Outlet',
  storeLocation: 'City Center',
  email: 'manager@central.com',
  contactPersonName: 'Bob Smith',
  organizationId: 'ORG001'
});
// Returns: { success: true, store, user, signupLink, emailSent }

// Pricing Overrides
await storeService.upsertStorePrice('STORE0001', 'SKU001', {
  marginType: 'percent',
  marginValue: 15
});
const effectivePrice = await storeService.getEffectivePrice('STORE0001', 'SKU001');
```

---

## 4. Verification & Testing

To verify the TypeScript compilation, database connectivity, and operational suites:

```bash
# 1. Type Check (Strict mode, zero errors)
npm run type-check

# 2. Compile to dist/
npm run build

# 3. Test PostgreSQL / Neon Connection
npm run db:test

# 4. Run Authentication & User Management Suite (34 tests)
node scripts/test-auth-user-mgmt.js

# 5. Run RBAC Matrix Test Suite (26 tests)
node scripts/test-rbac-matrix.js

# 6. Run Full API Regression Suite (17 tests)
node scripts/test-api-regression.js

# 7. Run CRM, Stock Movement, and Challan Suites (82 tests)
node scripts/test-crm-suite.js
node scripts/test-stock-movement-suite.js
node scripts/test-challan-suite.js
```

---

## 5. Architectural Invariants

1. **Single Source of Truth**: All business logic lives exclusively in `src/`. No logic is duplicated in the root directory.
2. **Zero-Overhead Bridges**: Downstream JavaScript callers require root files (e.g. `require('../services/userService')`), which automatically forward to the compiled TypeScript modules in `dist/`.
3. **Dual Identity Parity**: All mapped entities continue exposing both `id` and `_id` for backward and forward compatibility.
4. **Credential Security**: Passwords, tokens, and secrets are strictly managed via environment variables and never checked into source control.
