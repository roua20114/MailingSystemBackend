const settingsService = require('./settings.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

// ── Mail Types ──────────────────────────────────────────────────────────────

const getAllMailTypes = async (req, res, next) => {
  try {
    const types = await settingsService.getAllMailTypes();
    sendSuccess(res, { types }, 'Mail types retrieved');
  } catch (e) { next(e); }
};

const getMailTypeById = async (req, res, next) => {
  try {
    const type = await settingsService.getMailTypeById(req.params.id);
    sendSuccess(res, { type }, 'Mail type retrieved');
  } catch (e) { next(e); }
};

const createMailType = async (req, res, next) => {
  try {
    const type = await settingsService.createMailType(req.body, req);
    sendSuccess(res, { type }, 'Mail type created', 201);
  } catch (e) { next(e); }
};

const updateMailType = async (req, res, next) => {
  try {
    const type = await settingsService.updateMailType(req.params.id, req.body, req);
    sendSuccess(res, { type }, 'Mail type updated');
  } catch (e) { next(e); }
};

const deleteMailType = async (req, res, next) => {
  try {
    await settingsService.deleteMailType(req.params.id, req);
    sendSuccess(res, null, 'Mail type deleted');
  } catch (e) { next(e); }
};

// ── Mail Categories ──────────────────────────────────────────────────────────

const getAllMailCategories = async (req, res, next) => {
  try {
    const categories = await settingsService.getAllMailCategories();
    sendSuccess(res, { mailCategories: categories }, 'Mail categories retrieved');

  } catch (e) { next(e); }
};

const getMailCategoryById = async (req, res, next) => {
  try {
    const category = await settingsService.getMailCategoryById(req.params.id);
    sendSuccess(res, { category }, 'Mail category retrieved');
  } catch (e) { next(e); }
};

const createMailCategory = async (req, res, next) => {
  try {
    const category = await settingsService.createMailCategory(req.body, req);
    sendSuccess(res, { category }, 'Mail category created', 201);
  } catch (e) { next(e); }
};

const updateMailCategory = async (req, res, next) => {
  try {
    const category = await settingsService.updateMailCategory(req.params.id, req.body, req);
    sendSuccess(res, { category }, 'Mail category updated');
  } catch (e) { next(e); }
};

const deleteMailCategory = async (req, res, next) => {
  try {
    await settingsService.deleteMailCategory(req.params.id, req);
    sendSuccess(res, null, 'Mail category deleted');
  } catch (e) { next(e); }
};

// ── System Config ────────────────────────────────────────────────────────────

const getSystemConfig = async (req, res, next) => {
  try {
    const config = await settingsService.getSystemConfig();
    sendSuccess(res, { config }, 'System config retrieved');
  } catch (e) { next(e); }
};

const updateSystemConfig = async (req, res, next) => {
  try {
    const config = await settingsService.updateSystemConfig(req.body, req);
    sendSuccess(res, { config }, 'System config updated');
  } catch (e) { next(e); }
};

// ── Audit Logs ───────────────────────────────────────────────────────────────

const getAuditLogs = async (req, res, next) => {
  try {
    const { logs, total } = await settingsService.getAuditLogs(req.query);
    const { page = 1, limit = 20 } = req.query;
    sendPaginated(res, logs, total, page, limit, 'Audit logs retrieved');
  } catch (e) { next(e); }
};

module.exports = {
  getAllMailTypes, getMailTypeById, createMailType, updateMailType, deleteMailType,
  getAllMailCategories, getMailCategoryById, createMailCategory, updateMailCategory, deleteMailCategory,
  getSystemConfig, updateSystemConfig,
  getAuditLogs,
};
