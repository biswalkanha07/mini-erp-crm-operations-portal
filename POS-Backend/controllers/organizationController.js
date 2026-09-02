const organizationService = require('../services/organizationService');

exports.createOrganization = async (req, res) => {
  try {
    const org = await organizationService.create(req.body);
    res.status(201).json(org);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllOrganizations = async (req, res) => {
  try {
    const orgs = await organizationService.getAll();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const org = await organizationService.getById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrganizationById = async (req, res) => {
  try {
    const org = await organizationService.update(req.params.id, req.body);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json(org);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteOrganizationById = async (req, res) => {
  try {
    const org = await organizationService.delete(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
