const Organization = require('../models/Organization');

exports.createOrganization = async (req, res) => {
  try {
    const orgData = { ...req.body };
    // Use organizationId as the _id
    orgData._id = orgData.organizationId;
    const org = new Organization(orgData);
    await org.save();
    res.status(201).json(org);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrganizationById = async (req, res) => {
  try {
    // console.log('updateOrganizationById called with:', { id: req.params.id, body: req.body });
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!org) {
      // console.log('Organization not found with id:', req.params.id);
      return res.status(404).json({ error: 'Not found' });
    }
    // console.log('Organization updated successfully:', org);
    res.json(org);
  } catch (err) {
    // console.error('Error updating organization:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
