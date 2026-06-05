const Joi = require('joi');

const createSenderSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    type: Joi.string()
      .valid('Administration', 'Professeur', 'Étudiant', 'Entreprise', 'Autre')
      .default('Autre'),
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().max(50).optional().allow('', null),
  }),
};

module.exports = {
  createSenderSchema,
};
