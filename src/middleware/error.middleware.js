const { sendError } = require('../utils/response.util');

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return sendError(res, 409, 'A record with this information already exists');
  }

  if (err.code === 'P2025') {
    return sendError(res, 404, 'Record not found');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token has expired');
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, statusCode, message);
};

module.exports = errorMiddleware;