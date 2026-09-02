const challanService = require('../services/challanService');

/**
 * Creates a new Sales Challan (DRAFT)
 */
exports.createChallan = async (req, res) => {
  try {
    const { customerId, items, notes } = req.body;
    const organizationId = req.user?.organizationId || req.user?.organization_id || null;
    const createdBy = req.user?.id || req.user?.userId;

    const challan = await challanService.createChallan({
      customerId,
      items,
      notes,
      organizationId,
      createdBy
    });

    return res.status(201).json({
      success: true,
      message: 'Sales Challan created successfully in DRAFT status',
      data: challan
    });
  } catch (error) {
    console.error('Error in createChallan controller:', error);
    const status = error.statusCode || (error.message.includes('not found') ? 404 : 400);
    return res.status(status).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lists Sales Challans with search, filtering & pagination
 */
exports.getAllChallans = async (req, res) => {
  try {
    const { page, limit, status, customerId, search } = req.query;
    const organizationId = req.user?.organizationId || req.user?.organization_id;

    const result = await challanService.getAllChallans({
      page,
      limit,
      status,
      customerId,
      search,
      organizationId
    });

    return res.status(200).json({
      success: true,
      data: result.challans,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllChallans controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sales challans'
    });
  }
};

/**
 * Gets a single Sales Challan by ID with item snapshots
 */
exports.getChallanById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || req.user?.organization_id;

    const challan = await challanService.getChallanById(id, organizationId);
    return res.status(200).json({
      success: true,
      data: challan
    });
  } catch (error) {
    console.error('Error in getChallanById controller:', error);
    const status = error.statusCode || (error.message.includes('not found') ? 404 : 500);
    return res.status(status).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Updates a DRAFT Sales Challan
 */
exports.updateDraftChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, items, notes } = req.body;
    const organizationId = req.user?.organizationId || req.user?.organization_id;
    const userId = req.user?.id || req.user?.userId;

    const updated = await challanService.updateDraftChallan(id, {
      customerId,
      items,
      notes,
      organizationId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: 'Sales Challan updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error in updateDraftChallan controller:', error);
    const status = error.statusCode || (error.message.includes('not found') ? 404 : 400);
    return res.status(status).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Confirms a Sales Challan and atomically deducts stock
 */
exports.confirmChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || req.user?.organization_id;
    const userId = req.user?.id || req.user?.userId;

    const confirmed = await challanService.confirmChallan(id, {
      organizationId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: 'Sales Challan confirmed successfully and stock deducted',
      data: confirmed
    });
  } catch (error) {
    console.error('Error in confirmChallan controller:', error);
    const status = error.statusCode || 400;
    return res.status(status).json({
      success: false,
      error: error.message,
      insufficientItems: error.insufficientItems
    });
  }
};

/**
 * Cancels a DRAFT Sales Challan
 */
exports.cancelChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || req.user?.organization_id;
    const userId = req.user?.id || req.user?.userId;

    const cancelled = await challanService.cancelChallan(id, {
      organizationId,
      userId
    });

    return res.status(200).json({
      success: true,
      message: 'Sales Challan cancelled successfully',
      data: cancelled
    });
  } catch (error) {
    console.error('Error in cancelChallan controller:', error);
    const status = error.statusCode || 400;
    return res.status(status).json({
      success: false,
      error: error.message
    });
  }
};
