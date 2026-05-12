const AppError = require('../utils/AppError');

const validate = (schema) => {
  return (req, res, next) => {
    const options = { abortEarly: false, stripUnknown: true };
    const errors = [];

    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, options);
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      } else {
        req.body = value;
      }
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, options);
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      } else {
        req.query = value;
      }
    }

    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
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