const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bulkUploadController = require('../controllers/bulkUploadController');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `bulk-upload-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Bulk upload stores
router.post('/stores/bulk-upload', auth, upload.single('csvFile'), bulkUploadController.bulkUploadStores);

// Download template
router.get('/stores/template', auth, bulkUploadController.downloadTemplate);

module.exports = router;
