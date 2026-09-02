const Category = require('../models/Category');
// GET /api/categories/search - filter and sort categories
exports.searchAndFilterCategories = async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    const query = {};
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { categoryId: regex },
        { categoryName: regex }
      ];
    }
    if (status) query.status = status;
    // Only allow sorting by whitelisted fields
    const allowedSort = ['createdAt', 'categoryName', 'categoryId', 'status'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortObj = {};
    sortObj[sortField] = Number(sortOrder) || -1;
    const categories = await Category.find(query).sort(sortObj);
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Endpoint to generate categoryId
exports.generateCategoryId = (req, res) => {
  // Find the highest categoryId and increment
  const Category = require('../models/Category');
  Category.find({}, 'categoryId')
    .sort({ categoryId: -1 })
    .limit(1)
    .then(categories => {
      let nextNumber = 1;
      if (categories.length > 0) {
        // Extract number from CATxxx
        const lastId = categories[0].categoryId;
        const match = lastId.match(/CAT(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      // Pad with leading zeros to 3 digits
      const categoryId = `CAT${nextNumber.toString().padStart(3, '0')}`;
      res.json({ categoryId });
    })
    .catch(err => {
      res.status(500).json({ error: 'Failed to generate categoryId' });
    });
};

exports.createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };
    // Attach organization from token if available
    if (req.user && req.user.organizationId) {
      categoryData.organizationId = categoryData.organizationId || req.user.organizationId;
    }
    // Use categoryId as the _id
    categoryData._id = categoryData.categoryId;
    const category = new Category(categoryData);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      const search = req.query.search.trim();
      // Search by SKU id or Item Name (case-insensitive)
      query = {
        $or: [
          { categoryId: { $regex: search, $options: 'i' } },
          { categoryName: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const categories = await Category.find(query);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
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
    // Use categoryId as the _id if provided
    if (categoryData.categoryId) {
      categoryData._id = categoryData.categoryId;
    }
    const category = await Category.findByIdAndUpdate(req.params.id, categoryData, { new: true });
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCategoryById = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
