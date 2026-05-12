const MailType = require('./mailType.model');
const MailCategory = require('./mailCategory.model');
const SystemConfig = require('./systemConfig.model');
const AuditLog = require('./auditLog.model');

// --- Mail Types ---
const findAllMailTypes = () => MailType.find().sort({ name: 1 });
const findMailTypeById = (id) => MailType.findById(id);
const findMailTypeByName = (name) => MailType.findOne({ name });
const createMailType = (data) => MailType.create(data);
const updateMailType = (id, data) =>
  MailType.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteMailType = (id) => MailType.findByIdAndDelete(id);

// --- Mail Categories ---
const findAllMailCategories = () => MailCategory.find().sort({ name: 1 });
const findMailCategoryById = (id) => MailCategory.findById(id);
const findMailCategoryByName = (name) => MailCategory.findOne({ name });
const createMailCategory = (data) => MailCategory.create(data);
const updateMailCategory = (id, data) =>
  MailCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteMailCategory = (id) => MailCategory.findByIdAndDelete(id);

// --- System Config ---
const getSystemConfig = () => SystemConfig.getConfig();
const updateSystemConfig = async (data) => {
  let config = await SystemConfig.findOne();
  if (!config) config = new SystemConfig();
  Object.assign(config, data);
  return config.save();
};

// --- Audit Logs ---
const findAuditLogs = async ({ filter = {}, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  return { logs, total };
};

module.exports = {
  findAllMailTypes,
  findMailTypeById,
  findMailTypeByName,
  createMailType,
  updateMailType,
  deleteMailType,
  findAllMailCategories,
  findMailCategoryById,
  findMailCategoryByName,
  createMailCategory,
  updateMailCategory,
  deleteMailCategory,
  getSystemConfig,
  updateSystemConfig,
  findAuditLogs,
};
