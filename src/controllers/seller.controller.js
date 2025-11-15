const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt.util');
const { sendSuccess, sendError } = require('../utils/response.util');


const register = async (req, res, next) => {
  try {
    const { email, password, name, shopName } = req.body;

    // Check if seller already exists
    const existingSeller = await prisma.seller.findUnique({
      where: { email },
    });

    if (existingSeller) {
      return sendError(res, 409, 'Seller with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create seller
    const seller = await prisma.seller.create({
      data: {
        email,
        password: hashedPassword,
        name,
        shopName,
      },
      select: {
        id: true,
        email: true,
        name: true,
        shopName: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      id: seller.id,
      email: seller.email,
      type: 'seller',
    });

    return sendSuccess(res, 201, 'Seller registered successfully', {
      seller,
      token,
    });
  } catch (error) {
    next(error);
  }
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find seller
    const seller = await prisma.seller.findUnique({
      where: { email },
    });

    if (!seller) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, seller.password);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      id: seller.id,
      email: seller.email,
      type: 'seller',
    });

    return sendSuccess(res, 200, 'Login successful', {
      seller: {
        id: seller.id,
        email: seller.email,
        name: seller.name,
        shopName: seller.shopName,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
};