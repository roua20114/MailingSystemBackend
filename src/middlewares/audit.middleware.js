const AuditLog = require('../modules/settings/auditLog.model');
const { AUDIT_ACTIONS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Creates an audit log entry
 */
const createAuditLog = async ({ userId, userEmail, action, entity, entityId, changes, req }) => {
  try {
    await AuditLog.create({
      userId,
      userEmail,
      action,
      entity,
      entityId,
      changes,
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    logger.error(`Failed to create audit log: ${err.message}`);
  }
};

module.exports = { createAuditLog };
