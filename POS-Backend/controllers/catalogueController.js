const catalogueService = require('../services/catalogueService');

// GET /api/catalogues/search - filter and sort catalogues
exports.searchAndFilterCatalogues = async (req, res) => {
  try {
    const {
      search,
      status,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      categoryId,
      lowStock,
      warehouseLocation,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query;

    const organizationId = req.user?.organizationId;

    const catalogues = await catalogueService.searchAndFilter({
      search,
      status,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      categoryId,
      lowStock,
      warehouseLocation,
      organizationId,
      sortBy,
      sortOrder
    });
    res.json({ success: true, count: catalogues.length, data: catalogues });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Endpoint to generate itemId and sku
exports.generateIds = async (req, res) => {
  try {
    const ids = await catalogueService.generateNextIds();
    res.json(ids);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.createCatalogue = async (req, res) => {
  try {
    const catalogueData = { ...req.body };
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }

    // Attach organization from logged-in user if available
    if (req.user && req.user.organizationId) {
      catalogueData.organizationId = catalogueData.organizationId || req.user.organizationId;
    }

    // Parse nested fields sent as strings
    if (typeof catalogueData.nutritionValue === 'string') {
      try { catalogueData.nutritionValue = JSON.parse(catalogueData.nutritionValue); } catch (_) {}
    }

    // Normalize images array from JSON
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

    // Backward compatibility: if only single image provided, set images array
    if ((!catalogueData.images || catalogueData.images.length === 0) && catalogueData.image) {
      catalogueData.images = [catalogueData.image];
    }
    // Default thumbnail to first image if not provided
    if (!catalogueData.thumbnail && Array.isArray(catalogueData.images) && catalogueData.images.length > 0) {
      catalogueData.thumbnail = catalogueData.images[0];
    }

    // If expiry is a number, convert to string with unit
    if (typeof catalogueData.expiry === 'number') {
      catalogueData.expiry = `${catalogueData.expiry} hours`;
    }
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

    const catalogue = await catalogueService.create(catalogueData, req.user?.organizationId);
    res.status(201).json(catalogue);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

exports.getAllCatalogues = async (req, res) => {
  try {
    const {
      categoryId,
      search,
      lowStock,
      warehouseLocation,
      status,
      page,
      limit
    } = req.query;

    const organizationId = req.user?.organizationId;

    const result = await catalogueService.getAll({
      categoryId,
      search,
      lowStock,
      warehouseLocation,
      status,
      organizationId,
      page,
      limit
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getCatalogueById = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const catalogue = await catalogueService.getById(req.params.id, organizationId);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json(catalogue);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.updateCatalogueById = async (req, res) => {
  try {
    const catalogueData = { ...req.body };
    if (!catalogueData.cutType && catalogueData.certificationType) {
      catalogueData.cutType = catalogueData.certificationType;
      delete catalogueData.certificationType;
    }

    if (!catalogueData.organizationId && req.user && req.user.organizationId) {
      catalogueData.organizationId = req.user.organizationId;
    }

    if (catalogueData.images && typeof catalogueData.images === 'string') {
      try { catalogueData.images = JSON.parse(catalogueData.images); } catch (_) {}
    }
    if (catalogueData.images && !Array.isArray(catalogueData.images)) {
      catalogueData.images = [catalogueData.images];
    }

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

    if ((!catalogueData.images || catalogueData.images.length === 0) && catalogueData.image) {
      catalogueData.images = [catalogueData.image];
    }
    if (!catalogueData.thumbnail && Array.isArray(catalogueData.images) && catalogueData.images.length > 0) {
      catalogueData.thumbnail = catalogueData.images[0];
    }

    if (typeof catalogueData.nutritionValue === 'string') {
      try { catalogueData.nutritionValue = JSON.parse(catalogueData.nutritionValue); } catch (_) {}
    }

    if (typeof catalogueData.expiry === 'number') {
      catalogueData.expiry = `${catalogueData.expiry} hours`;
    }
    if (typeof catalogueData.expiry === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.test(catalogueData.expiry)) {
      const [, y, m, d] = catalogueData.expiry.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      catalogueData.expiry = `${d}-${m}-${y}`;
    }

    if (catalogueData.gstRate !== undefined && catalogueData.gstRate !== null && catalogueData.gstRate !== '') {
      const parsedGst = Number(catalogueData.gstRate);
      if (!Number.isNaN(parsedGst)) {
        catalogueData.gstRate = parsedGst;
      } else {
        delete catalogueData.gstRate;
      }
    }

    const catalogue = await catalogueService.update(req.params.id, catalogueData, req.user?.organizationId);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json(catalogue);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

exports.deleteCatalogueById = async (req, res) => {
  try {
    const catalogue = await catalogueService.delete(req.params.id, req.user?.organizationId);
    if (!catalogue) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
