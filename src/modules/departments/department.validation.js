const Joi = require('joi');

const createDepartmentSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional().allow('', null),
    parentId: Joi.string().hex().length(24).optional().allow(null, ''),
    headUserId: Joi.string().hex().length(24).optional().allow(null, ''),
  }),
};

const updateDepartmentSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(500).allow('', null),
    parentId: Joi.string().hex().length(24).allow(null, ''),
    headUserId: Joi.string().hex().length(24).allow(null, ''),
    isActive: Joi.boolean(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const deptIdParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = { createDepartmentSchema, updateDepartmentSchema, deptIdParamSchema };
