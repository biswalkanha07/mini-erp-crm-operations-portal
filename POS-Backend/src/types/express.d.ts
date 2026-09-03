/**
 * Express Request Type Augmentation
 * Phase 2 - Mini ERP + CRM Operations Portal
 *
 * Extends Express.Request with strongly-typed user and userObj attached by auth middleware.
 */

import { AuthenticatedUser, MappedUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userObj?: MappedUser;
    }
  }
}

export {};
