const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const storeService = require('../services/storeService');

// Bulk upload stores from CSV
exports.bulkUploadStores = async (req, res) => {
  let csvPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded',
        errors: ['Please upload a CSV file']
      });
    }

    csvPath = req.file.path;
    const results = [];
    const errors = [];
    const createdStores = [];

    // Read and parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Validate CSV structure
    if (results.length === 0) {
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty',
        errors: ['The uploaded CSV file contains no data']
      });
    }

    const requiredFields = ['storeName', 'storeLocation', 'contactPersonName', 'contactNumber', 'email'];
    const firstRow = results[0];
    const missingFields = requiredFields.filter(field => !firstRow[field]);

    if (missingFields.length > 0) {
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
      return res.status(400).json({
        success: false,
        message: 'CSV file is missing required fields',
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      });
    }

    const organizationId = req.user ? req.user.organizationId : null;
    if (!organizationId) {
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found',
        errors: ['User must be associated with an organization']
      });
    }

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2;

      try {
        if (!row.storeName || !row.storeLocation || !row.contactPersonName || !row.contactNumber || !row.email) {
          errors.push(`Row ${rowNumber}: Missing required fields`);
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email.trim())) {
          errors.push(`Row ${rowNumber}: Invalid email format for ${row.email}`);
          continue;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(row.contactNumber.replace(/\D/g, ''))) {
          errors.push(`Row ${rowNumber}: Invalid phone number format for ${row.contactNumber}`);
          continue;
        }

        const storeData = {
          storeName: row.storeName.trim(),
          storeLocation: row.storeLocation.trim(),
          storeAddress: row.storeAddress ? row.storeAddress.trim() : '',
          contactPersonName: row.contactPersonName.trim(),
          contactNumber: row.contactNumber.trim(),
          email: row.email.trim().toLowerCase(),
          status: 'active',
          organizationId,
          discountRate: row.discountRate ? parseFloat(row.discountRate) : 0,
          theme: row.theme && ['light', 'dark'].includes(row.theme.toLowerCase()) ? row.theme.toLowerCase() : 'light'
        };

        const result = await storeService.createStore(storeData);
        createdStores.push(result.store);

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

    if (createdStores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No stores were created',
        errors: errors
      });
    }

    res.json({
      success: true,
      message: `Successfully created ${createdStores.length} stores`,
      createdStores,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    if (csvPath && fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file',
      error: error.message
    });
  }
};

// Download CSV template
exports.downloadTemplate = (req, res) => {
  try {
    const headers = ['storeName', 'storeLocation', 'storeAddress', 'contactPersonName', 'contactNumber', 'email', 'discountRate', 'theme'];
    const sampleData = [
      'Downtown Branch,Downtown,123 Main St City,John Doe,9876543210,john@example.com,5,light',
      'Uptown Branch,Uptown,456 Oak Ave City,Jane Smith,9876543211,jane@example.com,10,dark'
    ];
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=stores_template.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate template', error: error.message });
  }
};
