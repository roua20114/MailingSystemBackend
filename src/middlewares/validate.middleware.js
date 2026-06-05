'use strict';

const AppError = require('../utils/AppError');

/**
 * Middleware de validation Joi.
 *
 * Règles appliquées :
 *  - body   : validation stricte (stripUnknown)
 *  - query  : validation souple (allowUnknown + stripUnknown)
 *             → un champ inconnu dans la query NE cause PAS de 400
 *  - params : validation stricte
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // ── Body ── validation stricte
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly:  false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map(d => ({
          field:   d.path.join('.'),
          message: d.message,
        })));
      } else {
        req.body = value;
      }
    }

    // ── Query ── validation souple : champs inconnus ignorés silencieusement
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly:   false,
        allowUnknown: true,   // ← clé : ne pas rejeter les champs non déclarés
        stripUnknown: true,   // ← supprime les champs inconnus du req.query propre
      });
      if (error) {
        errors.push(...error.details.map(d => ({
          field:   d.path.join('.'),
          message: d.message,
        })));
      } else {
        req.query = value;
      }
    }

    // ── Params ── validation stricte
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        errors.push(...error.details.map(d => ({
          field:   d.path.join('.'),
          message: d.message,
        })));
      } else {
        req.params = value;
      }
    }

    if (errors.length > 0) {
      return next(new AppError('Validation failed', 422, errors));
    }

    next();
  };
};

module.exports = validate;