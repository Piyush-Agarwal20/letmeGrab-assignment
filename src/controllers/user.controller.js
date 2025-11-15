const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt.util');
const { sendSuccess, sendError } = require('../utils/response.util');

/**
 * Register a new user
 * - Hash password
 * - Create user account
 * - Assign welcome wallet points
 * - Assign welcome coupon
 * - Return JWT token
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError(res, 409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get welcome coupon from database (or create if doesn't exist)
    const welcomeCouponCode = process.env.WELCOME_COUPON_CODE || 'WELCOME10';
    let welcomeCoupon = await prisma.coupon.findUnique({
      where: { code: welcomeCouponCode },
    });

    // If welcome coupon doesn't exist, create it with usage limits
    if (!welcomeCoupon) {
      welcomeCoupon = await prisma.coupon.create({
        data: {
          code: welcomeCouponCode,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minPurchase: 0,
          maxDiscount: 100,
          usageLimitPerUser: 1, // Each user can use only once
          totalUsageLimit: null, // No global limit - all users can get it
          currentUsageCount: 0,
          validFrom: new Date(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: true,
        },
      });
    }

    // Create user with wallet points
    const welcomeWalletPoints = parseFloat(process.env.WELCOME_WALLET_POINTS || 100);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        walletPoints: welcomeWalletPoints,
        userCoupons: {
          create: {
            couponId: welcomeCoupon.id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        walletPoints: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      type: 'user',
    });

    return sendSuccess(res, 201, 'User registered successfully', {
      user,
      token,
      welcomeBonus: {
        walletPoints: welcomeWalletPoints,
        couponCode: welcomeCouponCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * - Verify credentials
 * - Return JWT token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      type: 'user',
    });

    return sendSuccess(res, 200, 'Login successful', {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletPoints: user.walletPoints,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 * - Returns authenticated user's profile details
 * - Requires authentication
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        walletPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'Profile retrieved successfully', {
      user: {
        ...user,
        walletPoints: parseFloat(user.walletPoints),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user wallet points
 * - Returns wallet balance and transaction history
 * - Requires authentication
 */
const getWalletPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletPoints: true,
      },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'Wallet points retrieved successfully', {
      walletPoints: parseFloat(user.walletPoints),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getWalletPoints,
};