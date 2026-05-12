const Joi = require('joi');

const createUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
      }),
    role: Joi.string().valid('Admin', 'Director', 'Secretary', 'Professor', 'Service Lead').required(),
    departmentId: Joi.string().hex().length(24).optional().allow(null, ''),
  }),
};

const updateUserSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    role: Joi.string().valid('Admin', 'Director', 'Secretary', 'Professor', 'Service Lead'),
    departmentId: Joi.string().hex().length(24).allow(null, ''),
    isActive: Joi.boolean(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .optional(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const userIdParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const listUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(10),
    role: Joi.string().valid('Admin', 'Director', 'Secretary', 'Professor', 'Service Lead'),
    departmentId: Joi.string().hex().length(24),
    search: Joi.string(),
    isActive: Joi.boolean(),
  }),
};

module.exports = { createUserSchema, updateUserSchema, userIdParamSchema, listUsersSchema };
