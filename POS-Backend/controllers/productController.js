const catalogueService = require('../services/catalogueService');

exports.getAllProducts = async (req, res) => {
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

    const products = await catalogueService.getAll({
      categoryId,
      search,
      lowStock,
      warehouseLocation,
      status,
      organizationId,
      page,
      limit
    });
    res.json(products);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await catalogueService.getById(req.params.id, req.user?.organizationId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await catalogueService.create(req.body, req.user?.organizationId);
    res.status(201).json(product);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await catalogueService.update(req.params.id, req.body, req.user?.organizationId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await catalogueService.delete(req.params.id, req.user?.organizationId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};
