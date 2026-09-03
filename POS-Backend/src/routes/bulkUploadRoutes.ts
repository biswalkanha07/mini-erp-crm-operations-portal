/**
 * Bulk Upload Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import multer from 'multer';
import * as bulkUploadController from '../controllers/bulkUploadController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    cb(null, `bulk-upload-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Bulk upload stores - restricted to Admin
router.post('/stores/bulk-upload', auth, requireRole('Admin'), upload.single('csvFile'), bulkUploadController.bulkUploadStores);

// Download template - restricted to Admin
router.get('/stores/template', auth, requireRole('Admin'), bulkUploadController.downloadTemplate);

export default router;
