/**
 * Mini ERP + CRM Operations Portal - TypeScript Foundation Types
 * Established in Phase 1 to verify compiler configuration and type definitions.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Server } from 'http';
import type { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * Baseline environment configuration interface
 */
export interface AppEnvironment {
  port: number;
  nodeEnv: string;
  databaseUrl?: string;
  jwtSecret?: string;
}

/**
 * Standard API health response contract
 */
export interface HealthStatusResponse {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  databases: {
    mongodb: {
      status: string;
    };
    postgres: {
      status: string;
      database?: string;
      version?: string;
    };
  };
}

/**
 * Canonical ERP User Roles
 */
export type ErpRole = 'admin' | 'sales' | 'warehouse' | 'accounts' | 'manager' | 'cashier';

/**
 * Foundation Express handler type reference
 */
export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Foundation Database query helper reference
 */
export type DatabaseQueryFunction = <T extends QueryResultRow = any>(text: string, params?: unknown[]) => Promise<QueryResult<T>>;
