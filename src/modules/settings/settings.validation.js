const Joi = require('joi');

const createMailTypeSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional().allow('', null),
  }),
};

const updateMailTypeSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(500).allow('', null),
    isActive: Joi.boolean(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const createMailCategorySchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    maxProcessingTime: Joi.number().integer().min(1).max(365).required(),
    description: Joi.string().max(500).optional().allow('', null),
  }),
};

const updateMailCategorySchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    maxProcessingTime: Joi.number().integer().min(1).max(365),
    description: Joi.string().max(500).allow('', null),
    isActive: Joi.boolean(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const updateSystemConfigSchema = {
  body: Joi.object({
    institutionName: Joi.string().min(2).max(200),
    logoUrl: Joi.string().uri().allow('', null),
    globalTimeout: Joi.number().integer().min(1).max(365),
    allowSelfRegistration: Joi.boolean(),
    maintenanceMode: Joi.boolean(),
  }),
};

const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const auditLogQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    action: Joi.string(),
    entity: Joi.string(),
    userId: Joi.string().hex().length(24),
    from: Joi.date().iso(),
    to: Joi.date().iso(),
  }),
};

module.exports = {
  createMailTypeSchema,
  updateMailTypeSchema,
  createMailCategorySchema,
  updateMailCategorySchema,
  updateSystemConfigSchema,
  idParamSchema,
  auditLogQuerySchema,
};
