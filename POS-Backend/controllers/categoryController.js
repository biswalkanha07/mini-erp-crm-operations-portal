const categoryService = require('../services/categoryService');

exports.searchAndFilterCategories = async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    const categories = await categoryService.searchAndFilter({ search, status, sortBy, sortOrder });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateCategoryId = async (req, res) => {
  try {
    const categoryId = await categoryService.generateNextCategoryId();
    res.json({ categoryId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate categoryId' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };
    if (req.user && req.user.organizationId) {
      categoryData.organizationId = categoryData.organizationId || req.user.organizationId;
    }
    const category = await categoryService.create(categoryData);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAll(req.query.search);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoryById = async (req, res) => {
  try {
    const categoryData = { ...req.body };
    if (!categoryData.organizationId && req.user && req.user.organizationId) {
      categoryData.organizationId = req.user.organizationId;
    }
    const category = await categoryService.update(req.params.id, categoryData);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCategoryById = async (req, res) => {
  try {
    const category = await categoryService.delete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
