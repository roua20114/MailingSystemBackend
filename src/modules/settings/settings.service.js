const repo = require('./settings.repository');
const AppError = require('../../utils/AppError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { AUDIT_ACTIONS } = require('../../utils/constants');

// ── Mail Types ──────────────────────────────────────────────────────────────

const getAllMailTypes = () => repo.findAllMailTypes();

const getMailTypeById = async (id) => {
  const type = await repo.findMailTypeById(id);
  if (!type) throw new AppError('Mail type not found', 404);
  return type;
};

const createMailType = async (data, req) => {
  const existing = await repo.findMailTypeByName(data.name);
  if (existing) throw new AppError('Mail type with this name already exists', 409);
  const type = await repo.createMailType(data);
  await createAuditLog({
    userId: req.user._id, userEmail: req.user.email,
    action: AUDIT_ACTIONS.CREATE, entity: 'MailType', entityId: type._id,
    changes: { name: type.name }, req,
  });
  return type;
};

const updateMailType = async (id, data, req) => {
  const type = await repo.findMailTypeById(id);
  if (!type) throw new AppError('Mail type not found', 404);
  if (data.name && data.name !== type.name) {
    const existing = await repo.findMailTypeByName(data.name);
    if (existing) throw new AppError('Mail type name already in use', 409);
  }
  const updated = await repo.updateMailType(id, data);
  await createAuditLog({
    userId: req.user._id, userEmail: req.user.email,
    action: AUDIT_ACTIONS.UPDATE, entity: 'MailType', entityId: id, changes: data, req,
  });
  return updated;
};

const deleteMailType = async (id, req) => {
  const type = await repo.findMailTypeById(id);
  if (!type) throw new AppError('Mail type not found', 404);
  await repo.deleteMailType(id);
  await createAuditLog({
    userId: req.user._id, userEmail: req.user.email,
    action: AUDIT_ACTIONS.DELETE, entity: 'MailType', entityId: id,
    changes: { name: type.name }, req,
  });
};

// ── Mail Categories ──────────────────────────────────────────────────────────

const getAllMailCategories = () => repo.findAllMailCategories();

const getMailCategoryById = async (id) => {
  const cat = await repo.findMailCategoryById(id);
  if (!cat) throw new AppError('Mail category not found', 404);
  return cat;
};

const createMailCategory = async (data, req) => {
  const existing = await repo.findMailCategoryByName(data.name);
  if (existing) throw new AppError('Mail category with this name already exists', 409);
  const cat = await repo.createMailCategory(data);
  await createAuditLog({
    userId: req.user._id, userEmail: req.user.email,
    action: AUDIT_ACTIONS.CREATE, entity: 'MailCategory', entityId: cat._id,
    changes: { name: cat.name, maxProcessingTime: cat.maxProcessingTime }, req,
  });
  return cat;
};

const updateMailCategory = async (id, data, req) => {
  const cat = await repo.findMailCategoryById(id);
  if (!cat) throw new AppError('Mail category not found', 404);
  if (data.name && data.name !== cat.name) {
    const existing = await repo.findMailCategoryByName(data.name);
    if (existing) throw new AppError('Mail category name already in use', 409);
  }
  const updated = await repo.updateMailCategory(id, data);
  await createAuditLog({
    userId: req.user._id, userEmail: req.user.email,
    action: AUDIT_ACTIONS.UPDATE, entity: 'MailCategory', entityId: id, changes: data, req,
  });
  return updated;
};

const deleteMailCategory = async (id, req) => {
  const cat = await repo.findMailCategoryById(id);
  if (!cat) throw new AppError('Mail category not found', 404);
  await repo.deleteMailCategory(id);
  await createAuditLog({
    userId: req.user._id, userEmail: req.user.email,
    action: AUDIT_ACTIONS.DELETE, entity: 'MailCategory', entityId: id,
    changes: { name: cat.name }, req,
  });
};

// ── System Config ────────────────────────────────────────────────────────────

const getSystemConfig = () => repo.getSystemConfig();

const updateSystemConfig = async (data, req) => {
  const updated = await repo.updateSystemConfig(data);
  await createAuditLog({
    userId: req.user._id, userEmail: req.user.email,
    action: AUDIT_ACTIONS.UPDATE, entity: 'SystemConfig', entityId: null, changes: data, req,
  });
  return updated;
};

// ── Audit Logs ───────────────────────────────────────────────────────────────

const getAuditLogs = async (query) => {
  const { page = 1, limit = 20, action, entity, userId, from, to } = query;
  const filter = {};
  if (action) filter.action = action;
  if (entity) filter.entity = entity;
  if (userId) filter.userId = userId;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }
  return repo.findAuditLogs({ filter, page: parseInt(page), limit: parseInt(limit) });
};

module.exports = {
  getAllMailTypes, getMailTypeById, createMailType, updateMailType, deleteMailType,
  getAllMailCategories, getMailCategoryById, createMailCategory, updateMailCategory, deleteMailCategory,
  getSystemConfig, updateSystemConfig,
  getAuditLogs,
};
