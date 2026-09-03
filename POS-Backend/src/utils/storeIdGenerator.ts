/**
 * Store ID Generator Utility
 * Phase 3 - Mini ERP + CRM Operations Portal
 *
 * Generates the next storeId in the format STORE0001, STORE0002, etc.
 * Queries PostgreSQL stores table.
 */

import { query } from '../db/index';

export const generateNextStoreId = async (): Promise<string> => {
  try {
    const res = await query<{ store_id: string }>(
      "SELECT store_id FROM stores WHERE store_id ~ '^STORE[0-9]{4}$' ORDER BY store_id DESC LIMIT 1"
    );

    let nextNumber = 1;
    if (res.rows.length > 0) {
      const lastId = res.rows[0].store_id;
      const match = lastId.match(/STORE(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `STORE${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating next storeId:', error);
    throw new Error('Failed to generate storeId');
  }
};

export default {
  generateNextStoreId
};
