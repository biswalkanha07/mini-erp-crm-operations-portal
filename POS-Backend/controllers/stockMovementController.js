const stockMovementService = require('../services/stockMovementService');

exports.createStockMovement = async (req, res) => {
  try {
    const { productId, quantity, movementType, reason, referenceId } = req.body;

    // Strict security: derive createdBy and organizationId from authenticated session
    const createdBy = req.user?.id || req.user?.userId;
    const organizationId = req.user?.organizationId;

    const result = await stockMovementService.createMovement({
      productId,
      quantity: Number(quantity),
      movementType,
      reason,
      referenceId,
      createdBy,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: result.movement,
      currentStock: result.currentStock
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getAllStockMovements = async (req, res) => {
  try {
    const {
      page,
      limit,
      productId,
      movementType,
      reason,
      search
    } = req.query;

    const organizationId = req.user?.organizationId || req.query.organizationId || null;

    const result = await stockMovementService.getAll({
      page,
      limit,
      productId,
      movementType,
      reason,
      search,
      organizationId
    });

    if (result && result.pagination) {
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      res.json({
        success: true,
        count: Array.isArray(result) ? result.length : 0,
        data: result
      });
    }
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getStockMovementById = async (req, res) => {
  try {
    const organizationId = req.user?.role?.toLowerCase() === 'admin'
      ? undefined
      : req.user?.organizationId;

    const movement = await stockMovementService.getById(req.params.id, organizationId);
    if (!movement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }

    res.json({
      success: true,
      data: movement
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
