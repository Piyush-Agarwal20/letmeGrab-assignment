const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response.util');


const calculateOrder = async (req, res, next) => {
  try {
    const { couponCode, useWalletPoints, walletPointsToUse } = req.body;
    const userId = req.user.id;

    // Get user's cart
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return sendError(res, 400, 'Cart is empty');
    }

    // Check if all products are active and have enough stock
    for (const item of cartItems) {
      if (!item.product.isActive) {
        return sendError(
          res,
          400,
          `Product "${item.product.name}" is no longer available`
        );
      }
      if (item.product.stock < item.quantity) {
        return sendError(
          res,
          400,
          `Only ${item.product.stock} units of "${item.product.name}" available in stock`
        );
      }
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );

    let couponDiscount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        return sendError(res, 404, 'Invalid coupon code');
      }

      if (!coupon.isActive) {
        return sendError(res, 400, 'This coupon is no longer active');
      }

      // Check if coupon is valid (date range)
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validTo) {
        return sendError(res, 400, 'This coupon has expired or is not yet valid');
      }

      // Check minimum purchase
      if (coupon.minPurchase && subtotal < parseFloat(coupon.minPurchase)) {
        return sendError(
          res,
          400,
          `Minimum purchase of ₹${coupon.minPurchase} required to use this coupon`
        );
      }

      // Check total usage limit
      if (
        coupon.totalUsageLimit &&
        coupon.currentUsageCount >= coupon.totalUsageLimit
      ) {
        return sendError(res, 400, 'This coupon has reached its usage limit');
      }

      // Check user-specific usage limit
      const userCoupon = await prisma.userCoupon.findUnique({
        where: {
          userId_couponId: {
            userId,
            couponId: coupon.id,
          },
        },
      });

      if (userCoupon) {
        if (
          coupon.usageLimitPerUser &&
          userCoupon.usageCount >= coupon.usageLimitPerUser
        ) {
          return sendError(
            res,
            400,
            'You have reached the usage limit for this coupon'
          );
        }
      }

      // Calculate coupon discount
      if (coupon.discountType === 'PERCENTAGE') {
        couponDiscount = (subtotal * parseFloat(coupon.discountValue)) / 100;
        if (coupon.maxDiscount && couponDiscount > parseFloat(coupon.maxDiscount)) {
          couponDiscount = parseFloat(coupon.maxDiscount);
        }
      } else {
        // FIXED discount
        couponDiscount = parseFloat(coupon.discountValue);
      }

      couponDiscount = Math.min(couponDiscount, subtotal);
    }

    // Get user's wallet points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletPoints: true },
    });

    const availableWalletPoints = parseFloat(user.walletPoints);
    const amountAfterCoupon = subtotal - couponDiscount;

    // Calculate wallet points discount
    let walletPointsUsed = 0;
    if (useWalletPoints) {
      if (walletPointsToUse !== undefined && walletPointsToUse !== null) {
        // User specified exact amount of wallet points to use
        if (walletPointsToUse > availableWalletPoints) {
          return sendError(res, 400, `Insufficient wallet points. You have ₹${availableWalletPoints.toFixed(2)} available`);
        }
        if (walletPointsToUse > amountAfterCoupon) {
          return sendError(
            res,
            400,
            `Cannot use more than ₹${amountAfterCoupon.toFixed(2)} wallet points for this order`
          );
        }
        walletPointsUsed = walletPointsToUse;
      } else if (availableWalletPoints > 0) {
        // Use maximum available wallet points (up to remaining amount)
        walletPointsUsed = Math.min(availableWalletPoints, amountAfterCoupon);
      }
    }

    const finalAmount = Math.max(0, amountAfterCoupon - walletPointsUsed);

    return sendSuccess(res, 200, 'Order calculation successful', {
      breakdown: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        couponDiscount: parseFloat(couponDiscount.toFixed(2)),
        couponCode: couponCode || null,
        walletPointsAvailable: parseFloat(availableWalletPoints.toFixed(2)),
        walletPointsUsed: parseFloat(walletPointsUsed.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
      },
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: parseFloat(item.product.price),
        quantity: item.quantity,
        subtotal: parseFloat(item.product.price) * item.quantity,
      })),
    });
  } catch (error) {
    next(error);
  }
};


const placeOrder = async (req, res, next) => {
  try {
    const { couponCode, useWalletPoints, walletPointsToUse } = req.body;
    const userId = req.user.id;

    // Get user's cart
    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return sendError(res, 400, 'Cart is empty');
    }

    // Validate products and stock
    for (const item of cartItems) {
      if (!item.product.isActive) {
        return sendError(
          res,
          400,
          `Product "${item.product.name}" is no longer available`
        );
      }
      if (item.product.stock < item.quantity) {
        return sendError(
          res,
          400,
          `Only ${item.product.stock} units of "${item.product.name}" available in stock`
        );
      }
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );

    let couponDiscount = 0;
    let coupon = null;

    // Process coupon
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon || !coupon.isActive) {
        return sendError(res, 400, 'Invalid or inactive coupon');
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validTo) {
        return sendError(res, 400, 'Coupon has expired or is not yet valid');
      }

      if (coupon.minPurchase && subtotal < parseFloat(coupon.minPurchase)) {
        return sendError(
          res,
          400,
          `Minimum purchase of ₹${coupon.minPurchase} required`
        );
      }

      if (
        coupon.totalUsageLimit &&
        coupon.currentUsageCount >= coupon.totalUsageLimit
      ) {
        return sendError(res, 400, 'Coupon usage limit reached');
      }

      const userCoupon = await prisma.userCoupon.findUnique({
        where: {
          userId_couponId: {
            userId,
            couponId: coupon.id,
          },
        },
      });

      if (userCoupon) {
        if (
          coupon.usageLimitPerUser &&
          userCoupon.usageCount >= coupon.usageLimitPerUser
        ) {
          return sendError(res, 400, 'You have reached the usage limit for this coupon');
        }
      }

      // Calculate discount
      if (coupon.discountType === 'PERCENTAGE') {
        couponDiscount = (subtotal * parseFloat(coupon.discountValue)) / 100;
        if (coupon.maxDiscount && couponDiscount > parseFloat(coupon.maxDiscount)) {
          couponDiscount = parseFloat(coupon.maxDiscount);
        }
      } else {
        couponDiscount = parseFloat(coupon.discountValue);
      }

      couponDiscount = Math.min(couponDiscount, subtotal);
    }

    // Get user wallet points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletPoints: true },
    });

    const availableWalletPoints = parseFloat(user.walletPoints);
    const amountAfterCoupon = subtotal - couponDiscount;

    let walletPointsUsed = 0;
    if (useWalletPoints) {
      if (walletPointsToUse) {
        if (walletPointsToUse > availableWalletPoints) {
          return sendError(res, 400, 'Insufficient wallet points');
        }
        if (walletPointsToUse > amountAfterCoupon) {
          return sendError(
            res,
            400,
            `Cannot use more than ₹${amountAfterCoupon} wallet points for this order`
          );
        }
        walletPointsUsed = walletPointsToUse;
      } else {
        walletPointsUsed = Math.min(availableWalletPoints, amountAfterCoupon);
      }
    }

    const finalAmount = Math.max(0, amountAfterCoupon - walletPointsUsed);

    // Use transaction to ensure data consistency
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          couponId: coupon?.id || null,
          totalAmount: subtotal,
          couponDiscount,
          walletPointsUsed,
          finalAmount,
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING',
          orderItems: {
            create: cartItems.map(item => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Deduct stock from products
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Deduct wallet points
      if (walletPointsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            walletPoints: {
              decrement: walletPointsUsed,
            },
          },
        });
      }

      // Update coupon usage
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            currentUsageCount: {
              increment: 1,
            },
          },
        });

        // Update or create user coupon usage
        await tx.userCoupon.upsert({
          where: {
            userId_couponId: {
              userId,
              couponId: coupon.id,
            },
          },
          create: {
            userId,
            couponId: coupon.id,
            usageCount: 1,
            lastUsedAt: new Date(),
          },
          update: {
            usageCount: {
              increment: 1,
            },
            lastUsedAt: new Date(),
          },
        });
      }

      // Clear cart
      await tx.cart.deleteMany({
        where: { userId },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          orderId: newOrder.id,
          paymentStatus: 'PENDING',
        },
      });

      return newOrder;
    });

    return sendSuccess(res, 201, 'Order placed successfully', {
      order: {
        orderId: order.id,
        totalAmount: parseFloat(order.totalAmount),
        couponDiscount: parseFloat(order.couponDiscount),
        walletPointsUsed: parseFloat(order.walletPointsUsed),
        finalAmount: parseFloat(order.finalAmount),
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        items: order.orderItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};


const updatePaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;
    const userId = req.user.id;

    // Validate payment status
    if (!['SUCCESS', 'FAILED'].includes(paymentStatus)) {
      return sendError(res, 400, 'Invalid payment status. Must be SUCCESS or FAILED');
    }

    // Find order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check if payment is already completed
    if (order.paymentStatus === 'SUCCESS') {
      return sendError(res, 400, 'Payment has already been completed for this order');
    }

    // Update order and transaction status
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus,
          orderStatus: paymentStatus === 'SUCCESS' ? 'CONFIRMED' : 'CANCELLED',
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update transaction status
      await tx.transaction.updateMany({
        where: { orderId },
        data: { paymentStatus },
      });

      // If payment failed, restore stock and wallet points
      if (paymentStatus === 'FAILED') {
        // Restore product stock
        for (const item of updated.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        // Restore wallet points
        if (updated.walletPointsUsed > 0) {
          await tx.user.update({
            where: { id: userId },
            data: {
              walletPoints: {
                increment: parseFloat(updated.walletPointsUsed),
              },
            },
          });
        }

        // Restore coupon usage if coupon was used
        if (updated.couponId) {
          await tx.coupon.update({
            where: { id: updated.couponId },
            data: {
              currentUsageCount: {
                decrement: 1,
              },
            },
          });

          // Restore user coupon usage
          await tx.userCoupon.updateMany({
            where: {
              userId,
              couponId: updated.couponId,
            },
            data: {
              usageCount: {
                decrement: 1,
              },
            },
          });
        }
      }

      return updated;
    });

    return sendSuccess(res, 200, 'Payment status updated successfully', {
      order: {
        orderId: updatedOrder.id,
        paymentStatus: updatedOrder.paymentStatus,
        orderStatus: updatedOrder.orderStatus,
        totalAmount: parseFloat(updatedOrder.totalAmount),
        finalAmount: parseFloat(updatedOrder.finalAmount),
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };

    // Add status filter if provided
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'DELIVERED'].includes(status)) {
      where.orderStatus = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedOrders = orders.map(order => ({
      orderId: order.id,
      totalAmount: parseFloat(order.totalAmount),
      couponDiscount: parseFloat(order.couponDiscount),
      walletPointsUsed: parseFloat(order.walletPointsUsed),
      finalAmount: parseFloat(order.finalAmount),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      items: order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
    }));

    return sendSuccess(res, 200, 'Orders retrieved successfully', {
      orders: formattedOrders,
      count: formattedOrders.length,
    });
  } catch (error) {
    next(error);
  }
};


const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
    });

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    const formattedOrder = {
      orderId: order.id,
      totalAmount: parseFloat(order.totalAmount),
      couponDiscount: parseFloat(order.couponDiscount),
      walletPointsUsed: parseFloat(order.walletPointsUsed),
      finalAmount: parseFloat(order.finalAmount),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      coupon: order.coupon ? {
        code: order.coupon.code,
        discountType: order.coupon.discountType,
        discountValue: parseFloat(order.coupon.discountValue),
      } : null,
      items: order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.price) * item.quantity,
      })),
    };

    return sendSuccess(res, 200, 'Order retrieved successfully', { order: formattedOrder });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateOrder,
  placeOrder,
  updatePaymentStatus,
  getUserOrders,
  getOrderById,
};