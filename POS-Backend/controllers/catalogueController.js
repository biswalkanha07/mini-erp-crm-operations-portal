// GET /api/catalogues/search - filter and sort catalogues
exports.searchAndFilterCatalogues = async (req, res) => {
  try {
  const { search, status, minVolume, maxVolume, minPrice, maxPrice, minStock, maxStock, categoryId, sortBy = 'createdAt', sortOrder = -1 } = req.query;
  const query = {};
  if (categoryId) query.categoryId = categoryId;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { sku: { $regex: regex } },
        { itemName: { $regex: regex } }
      ];
    }
    if (status) query.status = status;
    if (minVolume || maxVolume) {
      query.volumeOfMeasurement = {};
      if (minVolume) query.volumeOfMeasurement.$gte = minVolume;
      if (maxVolume) query.volumeOfMeasurement.$lte = maxVolume;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minStock || maxStock) {
      query.stock = {};
      if (minStock) query.stock.$gte = Number(minStock);
      if (maxStock) query.stock.$lte = Number(maxStock);
    }
    // Only allow sorting by whitelisted fields
    const allowedSort = ['createdAt', 'itemName', 'sku', 'status', 'price', 'stock', 'volumeOfMeasurement'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortObj = {};
    sortObj[sortField] = Number(sortOrder) || -1;
    const catalogues = await Catalogue.find(query).sort(sortObj);
    res.json({ success: true, count: catalogues.length, data: catalogues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Endpoint to generate itemId and sku
exports.generateIds = (req, res) => {
  const sku = `SKU${Math.floor(100000 + Math.random() * 900000)}`;
  const itemId = `ITEM${Math.floor(100000 + Math.random() * 900000)}`;
  res.json({ sku, itemId });
};
const Catalogue = require('../models/Catalogue');
const path = require('path');

exports.createCatalogue = async (req, res) => {
  try {
    const catalogueData = { ...req.body };
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }
    // Normalize legacy/alias fields
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }
    // Attach organization from logged-in user if available
    if (req.user && req.user.organizationId) {
      catalogueData.organizationId = catalogueData.organizationId || req.user.organizationId;
    }

    // Autogenerate SKU and Item ID if not provided
    const skuArr = await Catalogue.find({}, 'sku').sort({ sku: -1 }).limit(1);
    const itemArr = await Catalogue.find({}, 'itemId').sort({ itemId: -1 }).limit(1);
    let nextSkuNum = 1;
    let nextItemNum = 1;
    if (skuArr.length > 0) {
      const lastSku = skuArr[0].sku;
      const match = lastSku.match(/SKU(\d+)/);
      if (match) nextSkuNum = parseInt(match[1], 10) + 1;
    }
    if (itemArr.length > 0) {
      const lastItem = itemArr[0].itemId;
      const match = lastItem.match(/ITEM(\d+)/);
      if (match) nextItemNum = parseInt(match[1], 10) + 1;
    }
    catalogueData.sku = `SKU${nextSkuNum.toString().padStart(3, '0')}`;
    catalogueData.itemId = `ITEM${nextItemNum.toString().padStart(3, '0')}`;
    catalogueData._id = catalogueData.itemId;
    
    // Parse nested fields sent as strings (e.g., from forms)
    if (typeof catalogueData.nutritionValue === 'string') {
      try { catalogueData.nutritionValue = JSON.parse(catalogueData.nutritionValue); } catch (_) {}
    }

    // Normalize images array from JSON (base64 or URLs)
    if (catalogueData.images && typeof catalogueData.images === 'string') {
      try { catalogueData.images = JSON.parse(catalogueData.images); } catch (_) {}
    }
    if (catalogueData.images && !Array.isArray(catalogueData.images)) {
      catalogueData.images = [catalogueData.images];
    }
    // Accept base64 images directly via JSON for legacy single fields
    if (catalogueData.image && typeof catalogueData.image === 'string') {
      // keep as-is (base64 data URL or path)
    }
    if (catalogueData.thumbnail && typeof catalogueData.thumbnail === 'string') {
      // keep as-is (base64 data URL or path)
    }
    // Accept certificationImage base64 or URL as string
    if (catalogueData.certificationImage && typeof catalogueData.certificationImage === 'string') {
      // keep as-is
    }

    // console.log('Creating catalogue with data (pre-files):', { ...catalogueData, image: !!catalogueData.image, thumbnail: !!catalogueData.thumbnail });
    // console.log('Files received:', req.files);
    
    // Handle image uploads if files are present
    if (req.files) {
      if (req.files.image) {
        catalogueData.image = `/uploads/${req.files.image[0].filename}`;
        // console.log('Image path set:', catalogueData.image);
      }
      if (req.files.thumbnail) {
        catalogueData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
        // console.log('Thumbnail path set:', catalogueData.thumbnail);
      }
      if (req.files.images) {
        const paths = req.files.images.map(f => `/uploads/${f.filename}`);
        catalogueData.images = Array.isArray(catalogueData.images) ? [...catalogueData.images, ...paths] : paths;
        // console.log('Images array set:', catalogueData.images);
      }
      // Note: certificationImage upload via multer is optional; prefer base64 payload
    }

    // Backward compatibility: if only single image provided, set images array
    if ((!catalogueData.images || catalogueData.images.length === 0) && catalogueData.image) {
      catalogueData.images = [catalogueData.image];
    }
    // Default thumbnail to first image if not provided
    if (!catalogueData.thumbnail && Array.isArray(catalogueData.images) && catalogueData.images.length > 0) {
      catalogueData.thumbnail = catalogueData.images[0];
    }
    
    // Use itemId as the _id
    catalogueData._id = catalogueData.itemId;
    // If expiry is a number, convert to string with unit (default to hours)
    if (typeof catalogueData.expiry === 'number') {
      catalogueData.expiry = `${catalogueData.expiry} hours`;
    }
    // Normalize date format dd-mm-yyyy if client sent yyyy-mm-dd accidentally
    if (typeof catalogueData.expiry === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(catalogueData.expiry)) {
      const [, y, m, d] = catalogueData.expiry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      catalogueData.expiry = `${d}-${m}-${y}`;
    }
    // Normalize gstRate if provided
    if (catalogueData.gstRate !== undefined && catalogueData.gstRate !== null && catalogueData.gstRate !== '') {
      const parsedGst = Number(catalogueData.gstRate);
      if (!Number.isNaN(parsedGst)) {
        catalogueData.gstRate = parsedGst;
      } else {
        delete catalogueData.gstRate;
      }
    }
    if (typeof catalogueData.gstRate === 'number') {
      if (catalogueData.gstRate < 0 || catalogueData.gstRate > 100) {
        return res.status(400).json({ error: 'gstRate must be between 0 and 100' });
      }
    }
    if (typeof catalogueData.gstRate === 'number') {
      if (catalogueData.gstRate < 0 || catalogueData.gstRate > 100) {
        return res.status(400).json({ error: 'gstRate must be between 0 and 100' });
      }
    }
    // console.log('Final catalogue data:', catalogueData);
    const catalogue = new Catalogue(catalogueData);
    await catalogue.save();
    // Include organizationId explicitly in response
    res.status(201).json(catalogue);
  } catch (err) {
    // console.error('Error creating catalogue:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getAllCatalogues = async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      const search = req.query.search.trim();
      // Search by SKU id or Item Name (case-insensitive)
      query = {
        $or: [
          { sku: { $regex: search, $options: 'i' } },
          { itemName: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const catalogues = await Catalogue.find(query);
    // console.log('Retrieved catalogues:', catalogues.length, 'items');
    catalogues.forEach(cat => {
      // console.log(`- ${cat.itemName}: image=${cat.image}, thumbnail=${cat.thumbnail}`);
    });
    res.json(catalogues);
  } catch (err) {
    console.error('Error fetching catalogues:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCatalogueById = async (req, res) => {
  try {
    const catalogue = await Catalogue.findById(req.params.id);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json(catalogue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCatalogueById = async (req, res) => {
  try {
    const catalogueData = { ...req.body };
    // Normalize alias
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }
    // Preserve/attach organizationId from token if not provided
    if (!catalogueData.organizationId && req.user && req.user.organizationId) {
      catalogueData.organizationId = req.user.organizationId;
    }
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }
    
    // Normalize images array
    if (catalogueData.images && typeof catalogueData.images === 'string') {
      try { catalogueData.images = JSON.parse(catalogueData.images); } catch (_) {}
    }
    if (catalogueData.images && !Array.isArray(catalogueData.images)) {
      catalogueData.images = [catalogueData.images];
    }

    // Handle image uploads if files are present
    if (req.files) {
      if (req.files.image) {
        catalogueData.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.thumbnail) {
        catalogueData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.images) {
        const paths = req.files.images.map(f => `/uploads/${f.filename}`);
        catalogueData.images = Array.isArray(catalogueData.images) ? [...catalogueData.images, ...paths] : paths;
      }
    }
    
    // Accept base64 images directly via JSON for legacy single fields
    if (catalogueData.image && typeof catalogueData.image === 'string') {
      // keep as-is
    }
    if (catalogueData.thumbnail && typeof catalogueData.thumbnail === 'string') {
      // keep as-is
    }

    // Parse nested fields sent as strings
    if (typeof catalogueData.nutritionValue === 'string') {
      try { catalogueData.nutritionValue = JSON.parse(catalogueData.nutritionValue); } catch (_) {}
    }

    // Use itemId as the _id if provided
    if (catalogueData.itemId) {
      catalogueData._id = catalogueData.itemId;
    }
    // If expiry is a number, convert to string with unit (default to hours)
    if (typeof catalogueData.expiry === 'number') {
      catalogueData.expiry = `${catalogueData.expiry} hours`;
    }
    // Normalize date format dd-mm-yyyy if client sent yyyy-mm-dd accidentally
    if (typeof catalogueData.expiry === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(catalogueData.expiry)) {
      const [, y, m, d] = catalogueData.expiry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      catalogueData.expiry = `${d}-${m}-${y}`;
    }
    // Normalize gstRate if provided
    if (catalogueData.gstRate !== undefined && catalogueData.gstRate !== null && catalogueData.gstRate !== '') {
      const parsedGst = Number(catalogueData.gstRate);
      if (!Number.isNaN(parsedGst)) {
        catalogueData.gstRate = parsedGst;
      } else {
        delete catalogueData.gstRate;
      }
    }

    // Backward compatibility: if only single image provided, set images array
    if ((!catalogueData.images || catalogueData.images.length === 0) && catalogueData.image) {
      catalogueData.images = [catalogueData.image];
    }
    // Default thumbnail to first image if not provided
    if (!catalogueData.thumbnail && Array.isArray(catalogueData.images) && catalogueData.images.length > 0) {
      catalogueData.thumbnail = catalogueData.images[0];
    }

    const catalogue = await Catalogue.findByIdAndUpdate(req.params.id, catalogueData, { new: true });
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json(catalogue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCatalogueById = async (req, res) => {
  try {
    const catalogue = await Catalogue.findByIdAndDelete(req.params.id);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
