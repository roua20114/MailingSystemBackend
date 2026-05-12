const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, and one number',
      }),
    role: Joi.string()
      .valid('Admin', 'Director', 'Secretary', 'Professor', 'Service Lead')
      .required(),
    departmentId: Joi.string().hex().length(24).optional().allow(null),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = { registerSchema, loginSchema, refreshSchema };
