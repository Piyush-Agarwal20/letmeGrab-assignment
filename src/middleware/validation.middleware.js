const { sendError } = require('../utils/response.util');
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      const firstError = error.details[0];
      const errorMessage = firstError.message;

      return sendError(res, 400, errorMessage);
    }
    req.body = value;
    next();
  };
};

module.exports = validate;