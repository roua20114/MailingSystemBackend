const express = require('express');
const router = express.Router();
const ctrl = require('./settings.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createMailTypeSchema,
  updateMailTypeSchema,
  createMailCategorySchema,
  updateMailCategorySchema,
  updateSystemConfigSchema,
  idParamSchema,
  auditLogQuerySchema,
} = require('./settings.validation');
const { ROLES } = require('../../utils/constants');

// ── Mail Types ──────────────────────────────────────────────────────────────
router.get('/mail-types', ctrl.getAllMailTypes);
router.get('/mail-types/:id', validate(idParamSchema), ctrl.getMailTypeById);
router.post('/mail-types', authMiddleware, roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR), validate(createMailTypeSchema), ctrl.createMailType);
router.put('/mail-types/:id', authMiddleware, roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR), validate(updateMailTypeSchema), ctrl.updateMailType);
router.delete('/mail-types/:id', authMiddleware, roleMiddleware(ROLES.ADMIN , ROLES.DIRECTOR), validate(idParamSchema), ctrl.deleteMailType);

// ── Mail Categories — GET is public, writes require auth ────────────────────
router.get('/mail-categories', ctrl.getAllMailCategories);
router.get('/mail-categories/:id', validate(idParamSchema), ctrl.getMailCategoryById);
router.post('/mail-categories', authMiddleware, roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR), validate(createMailCategorySchema), ctrl.createMailCategory);
router.put('/mail-categories/:id', authMiddleware, roleMiddleware(ROLES.ADMIN , ROLES.DIRECTOR), validate(updateMailCategorySchema), ctrl.updateMailCategory);
router.delete('/mail-categories/:id', authMiddleware, roleMiddleware(ROLES.ADMIN , ROLES.DIRECTOR), validate(idParamSchema), ctrl.deleteMailCategory);

// ── System Config ────────────────────────────────────────────────────────────
router.get('/config', authMiddleware, ctrl.getSystemConfig);
router.put('/config', authMiddleware, roleMiddleware(ROLES.ADMIN , ROLES.DIRECTOR), validate(updateSystemConfigSchema), ctrl.updateSystemConfig);

// ── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', authMiddleware, roleMiddleware(ROLES.ADMIN , ROLES.DIRECTOR), validate(auditLogQuerySchema), ctrl.getAuditLogs);

module.exports = router;