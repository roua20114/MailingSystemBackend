const Joi = require('joi');

const createMailSchema = {
  body: Joi.object({
    subject:         Joi.string().min(3).max(300).required(),
    sender:          Joi.string().hex().length(24).required(),
    type:            Joi.string().valid('Incoming', 'Outgoing', 'Internal').required(),
    category:        Joi.string().hex().length(24).optional().allow(null, ''),
    priority:        Joi.string().valid('Low', 'Medium', 'High', 'Urgent').default('Medium'),
    description:     Joi.string().max(2000).optional().allow('', null),
    pdfUrl:          Joi.string().optional().allow('', null),
    inboxMailId:     Joi.string().hex().length(24).optional().allow(null, ''),
    manualReference: Joi.string().max(100).optional().allow('', null),
  }),
};

const updateStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid('Registered', 'Under Review', 'Assigned', 'In Progress', 'Processed')
      .required(),
    note: Joi.string().max(500).optional().allow('', null),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

/**
 * dispatchMailSchema — Validation du dispatching multi-département.
 *
 * `dispatchedTo` est un tableau d'ObjectIds (min 1 entrée, max 20).
 * Chaque élément est une chaîne hexadécimale de 24 caractères (ObjectId MongoDB).
 */
const dispatchMailSchema = {
  body: Joi.object({
    dispatchedTo: Joi.array()
      .items(Joi.string().hex().length(24).required())
      .min(1)
      .max(20)
      .required()
      .messages({
        'array.base':    'dispatchedTo doit être un tableau',
        'array.min':     'Sélectionnez au moins un département',
        'array.max':     'Maximum 20 départements par dispatching',
        'any.required':  'dispatchedTo est obligatoire',
      }),
      assignedTo: Joi.array()
        .items(Joi.string().hex().length(24).required())
        .optional()
        .allow(null),
    instructions: Joi.string().max(2000).optional().allow('', null),
    priority:     Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const assignMailSchema = {
  body: Joi.object({
    assignedTo:   Joi.string().hex().length(24).required(),
    instructions: Joi.string().max(2000).optional().allow('', null),
    // Permet de passer des départements en complément d'un assignee unique
    dispatchedTo: Joi.array()
      .items(Joi.string().hex().length(24))
      .optional(),
    priority:     Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const listMailSchema = {
  query: Joi.object({
    page:       Joi.number().integer().min(1).default(1),
    limit:      Joi.number().integer().min(1).max(500).default(10),
    status:     Joi.string().valid('Registered', 'Under Review', 'Assigned', 'In Progress', 'Processed'),
    type:       Joi.string().valid('Incoming', 'Outgoing', 'Internal'),
    priority:   Joi.string().valid('Low', 'Medium', 'High', 'Urgent'),
    assignedTo: Joi.string().hex().length(24),
    createdBy:  Joi.string().hex().length(24),
    category:   Joi.string().hex().length(24),
    isOverdue:  Joi.boolean(),
    search:     Joi.string().allow(''),
    from:       Joi.date().iso(),
    to:         Joi.date().iso(),
    sortBy:     Joi.string().valid('createdAt', 'updatedAt', 'priority', 'slaDeadline').default('createdAt'),
    sortOrder:  Joi.string().valid('asc', 'desc').default('desc'),
    sender:     Joi.string().hex().length(24),
  }),
};

const mailIdParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const addCommentSchema = {
  body: Joi.object({
    message:    Joi.string().min(1).max(1000).required(),
    isInternal: Joi.boolean().default(false),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  createMailSchema,
  updateStatusSchema,
  dispatchMailSchema,
  assignMailSchema,
  listMailSchema,
  mailIdParamSchema,
  addCommentSchema,
};