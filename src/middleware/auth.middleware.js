const { verifyToken } = require('../utils/jwt.util');
const { sendError } = require('../utils/response.util');

/**
 * Authenticate User
 * - Verify JWT token
 * - Check if user type is 'user'
 * - Attach user data to req.user
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided. Please login to continue');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Check if token is for user
    if (decoded.type !== 'user') {
      return sendError(res, 403, 'Access denied. User authentication required');
    }

    // Attach user data to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type,
    };

    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return sendError(res, 401, 'Invalid or expired token. Please login again');
    }
    return sendError(res, 401, 'Authentication failed');
  }
};

/**
 * Authenticate Seller
 * - Verify JWT token
 * - Check if user type is 'seller'
 * - Attach seller data to req.seller
 */
const authenticateSeller = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided. Please login to continue');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Check if token is for seller
    if (decoded.type !== 'seller') {
      return sendError(res, 403, 'Access denied. Seller authentication required');
    }

    // Attach seller data to request
    req.seller = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type,
    };

    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return sendError(res, 401, 'Invalid or expired token. Please login again');
    }
    return sendError(res, 401, 'Authentication failed');
  }
};

module.exports = {
  authenticateUser,
  authenticateSeller,
};