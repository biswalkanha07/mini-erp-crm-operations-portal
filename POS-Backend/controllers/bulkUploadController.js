const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Store = require('../models/Store');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateStoreId } = require('../utils/storeIdGenerator');
const { sendEmail } = require('../utils/emailService');

// Bulk upload stores from CSV
exports.bulkUploadStores = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CSV file uploaded',
        errors: ['Please upload a CSV file']
      });
    }

    const csvPath = req.file.path;
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
      return res.status(400).json({
        success: false,
        message: 'CSV file is missing required fields',
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      });
    }

    // Get organization ID from the authenticated user
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID not found',
        errors: ['User must be associated with an organization']
      });
    }

    // Process each store
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header

      try {
        // Validate required fields
        if (!row.storeName || !row.storeLocation || !row.contactPersonName || !row.contactNumber || !row.email) {
          errors.push(`Row ${rowNumber}: Missing required fields`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push(`Row ${rowNumber}: Invalid email format for ${row.email}`);
          continue;
        }

        // Validate phone number (basic validation)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(row.contactNumber.replace(/\D/g, ''))) {
          errors.push(`Row ${rowNumber}: Invalid phone number format for ${row.contactNumber}`);
          continue;
        }

        // Check if store with same email already exists
        const existingStore = await Store.findOne({ email: row.email });
        if (existingStore) {
          errors.push(`Row ${rowNumber}: Store with email ${row.email} already exists`);
          continue;
        }

        // Generate store ID
        const storeId = await generateStoreId();

        // Create store
        const storeData = {
          storeId,
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

        const store = new Store(storeData);
        await store.save();

        // Create store user
        const userData = {
          name: row.contactPersonName.trim(),
          email: row.email.trim().toLowerCase(),
          password: 'TempPassword123!', // Temporary password
          userType: 'store',
          role: 'store_manager',
          storeId: store._id,
          organizationId,
          status: 'pending' // User needs to set their password
        };

        const user = new User(userData);
        await user.save();

        // Generate signup token
        const signupToken = require('crypto').randomBytes(32).toString('hex');
        user.signupToken = signupToken;
        user.signupTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();

        // Send signup email
        try {
          const signupLink = `${process.env.FRONTEND_URL || 'https://pos.hutechsolutions.in'}/signup?token=${signupToken}&email=${encodeURIComponent(user.email)}&storeId=${store.storeId}`;
          
          await sendEmail({
            to: user.email,
            subject: 'Welcome to POS System - Complete Your Registration',
            html: `
              <h2>Welcome to POS System</h2>
              <p>Hello ${user.name},</p>
              <p>Your store "${store.storeName}" has been created successfully!</p>
              <p>Please complete your registration by clicking the link below:</p>
              <a href="${signupLink}" style="background: #7c4dff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Registration</a>
              <p>This link will expire in 24 hours.</p>
              <p>If you have any questions, please contact support.</p>
            `
          });
        } catch (emailError) {
          console.error('Failed to send signup email:', emailError);
          // Don't fail the store creation if email fails
        }

        createdStores.push({
          storeId: store.storeId,
          storeName: store.storeName,
          storeLocation: store.storeLocation,
          contactPersonName: store.contactPersonName,
          email: store.email,
          status: store.status
        });

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(csvPath);

    // Return response
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
    console.error('Bulk upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Bulk upload failed',
      errors: ['Internal server error occurred']
    });
  }
};

// Download CSV template
exports.downloadTemplate = (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../../public/store-template.csv');
    
    res.download(templatePath, 'store-template.csv', (err) => {
      if (err) {
        console.error('Error downloading template:', err);
        res.status(404).json({ 
          success: false, 
          message: 'Template file not found' 
        });
      }
    });
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download template' 
    });
  }
};
