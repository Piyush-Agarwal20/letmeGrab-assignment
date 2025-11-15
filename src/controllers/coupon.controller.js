const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response.util');


const getAllCoupons = async (req, res, next) => {
  try {
    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: {
          lte: now,
        },
        validTo: {
          gte: now,
        },
      },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        maxDiscount: true,
        minPurchase: true,
        validFrom: true,
        validTo: true,
        totalUsageLimit: true,
        currentUsageCount: true,
        usageLimitPerUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format coupons
    const formattedCoupons = coupons.map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: parseFloat(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : null,
      minPurchase: coupon.minPurchase ? parseFloat(coupon.minPurchase) : null,
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      usageLimitPerUser: coupon.usageLimitPerUser,
      totalUsageLimit: coupon.totalUsageLimit,
      remainingGlobalUses: coupon.totalUsageLimit
        ? coupon.totalUsageLimit - coupon.currentUsageCount
        : null,
    }));

    return sendSuccess(res, 200, 'Coupons retrieved successfully', {
      coupons: formattedCoupons,
      count: formattedCoupons.length,
    });
  } catch (error) {
    next(error);
  }
};


const getUserCoupons = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Get all active and valid coupons
    const allCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: {
          lte: now,
        },
        validTo: {
          gte: now,
        },
      },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        maxDiscount: true,
        minPurchase: true,
        validFrom: true,
        validTo: true,
        totalUsageLimit: true,
        currentUsageCount: true,
        usageLimitPerUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get user's coupon usage
    const userCouponUsage = await prisma.userCoupon.findMany({
      where: { userId },
      select: {
        couponId: true,
        usageCount: true,
        lastUsedAt: true,
      },
    });

    // Create a map of user's coupon usage
    const usageMap = new Map(
      userCouponUsage.map(uc => [uc.couponId, { usageCount: uc.usageCount, lastUsedAt: uc.lastUsedAt }])
    );

    // Filter and format coupons
    const availableCoupons = allCoupons
      .map(coupon => {
        const userUsage = usageMap.get(coupon.id);
        const userUsageCount = userUsage?.usageCount || 0;
        const isAvailable =
          // Check global usage limit
          (!coupon.totalUsageLimit || coupon.currentUsageCount < coupon.totalUsageLimit) &&
          // Check per-user usage limit
          (!coupon.usageLimitPerUser || userUsageCount < coupon.usageLimitPerUser);

        return {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: parseFloat(coupon.discountValue),
          maxDiscount: coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : null,
          minPurchase: coupon.minPurchase ? parseFloat(coupon.minPurchase) : null,
          validFrom: coupon.validFrom,
          validTo: coupon.validTo,
          usageLimitPerUser: coupon.usageLimitPerUser,
          userUsageCount,
          remainingUsesForUser: coupon.usageLimitPerUser
            ? coupon.usageLimitPerUser - userUsageCount
            : null,
          isAvailable,
          lastUsedAt: userUsage?.lastUsedAt || null,
        };
      })
      .filter(coupon => coupon.isAvailable); // Only return available coupons

    return sendSuccess(res, 200, 'User coupons retrieved successfully', {
      coupons: availableCoupons,
      count: availableCoupons.length,
    });
  } catch (error) {
    next(error);
  }
};


const getCouponByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const now = new Date();

    const coupon = await prisma.coupon.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        maxDiscount: true,
        minPurchase: true,
        validFrom: true,
        validTo: true,
        totalUsageLimit: true,
        currentUsageCount: true,
        usageLimitPerUser: true,
        isActive: true,
      },
    });

    if (!coupon) {
      return sendError(res, 404, 'Coupon not found');
    }

    if (!coupon.isActive) {
      return sendError(res, 400, 'This coupon is no longer active');
    }

    if (now < coupon.validFrom || now > coupon.validTo) {
      return sendError(res, 400, 'This coupon has expired or is not yet valid');
    }

    const formattedCoupon = {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: parseFloat(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : null,
      minPurchase: coupon.minPurchase ? parseFloat(coupon.minPurchase) : null,
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      usageLimitPerUser: coupon.usageLimitPerUser,
      totalUsageLimit: coupon.totalUsageLimit,
      remainingGlobalUses: coupon.totalUsageLimit
        ? coupon.totalUsageLimit - coupon.currentUsageCount
        : null,
    };

    return sendSuccess(res, 200, 'Coupon retrieved successfully', { coupon: formattedCoupon });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCoupons,
  getUserCoupons,
  getCouponByCode,
};