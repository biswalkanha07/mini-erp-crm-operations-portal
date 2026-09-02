const customerService = require('../services/customerService');

exports.listCustomers = async (req, res) => {
  try {
    const { page, limit, search, status, type, followUpDate } = req.query;
    const organizationId = req.user?.organizationId;

    const result = await customerService.listCustomers({
      page,
      limit,
      search,
      status,
      type,
      followUpDate,
      organizationId
    });

    res.json({
      success: true,
      data: result.customers,
      pagination: result.pagination
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const customer = await customerService.getCustomerById(req.params.id, organizationId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const customer = await customerService.createCustomer(req.body, userId, organizationId);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const customer = await customerService.updateCustomer(req.params.id, req.body, organizationId);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const result = await customerService.deleteOrDeactivateCustomer(req.params.id, organizationId);

    res.json({
      success: true,
      message: 'Customer deactivated successfully',
      data: result
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

exports.listFollowups = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const followups = await customerService.listFollowups(req.params.id, organizationId);

    res.json({
      success: true,
      data: followups
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};

exports.addFollowup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const followup = await customerService.addFollowup(
      req.params.id,
      {
        ...req.body,
        createdByName: req.user?.name
      },
      userId,
      organizationId
    );

    res.status(201).json({
      success: true,
      message: 'Follow-up added successfully',
      data: followup
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
};
