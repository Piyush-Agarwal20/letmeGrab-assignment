const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response.util');
const { formatProductName } = require('../utils/string.util');

/**
 * Add product to cart
 * - Check if product exists and is active
 * - Check if enough stock available
 * - If product already in cart, update quantity
 * - Otherwise, add new cart item
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
      },
    });

    if (!product) {
      return sendError(res, 404, 'Product not found or is no longer available');
    }

    // Check if enough stock available
    if (product.stock < quantity) {
      return sendError(res, 400, `Only ${product.stock} units available in stock`);
    }

    // Check if product already in cart
    const existingCartItem = await prisma.cart.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;

      // Check if new quantity exceeds stock
      if (newQuantity > product.stock) {
        return sendError(
          res,
          400,
          `Cannot add ${quantity} more units. Only ${product.stock - existingCartItem.quantity} units available`
        );
      }

      const updatedCart = await prisma.cart.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          quantity: newQuantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
            },
          },
        },
      });

      return sendSuccess(res, 200, 'Cart updated successfully', {
        cart: {
          ...updatedCart,
          product: {
            ...updatedCart.product,
            name: formatProductName(updatedCart.product.name),
          },
        },
      });
    }

    // Add new item to cart
    const cartItem = await prisma.cart.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
          },
        },
      },
    });

    return sendSuccess(res, 201, 'Product added to cart successfully', {
      cart: {
        ...cartItem,
        product: {
          ...cartItem.product,
          name: formatProductName(cartItem.product.name),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's cart
 * - Returns all cart items with product details
 * - Calculates subtotal for each item
 * - Calculates total cart value
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate subtotal for each item and total
    const formattedCart = cartItems.map(item => ({
      id: item.id,
      productId: item.product.id,
      name: formatProductName(item.product.name),
      price: item.product.price,
      quantity: item.quantity,
      stock: item.product.stock,
      isActive: item.product.isActive,
      subtotal: parseFloat(item.product.price) * item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const total = formattedCart.reduce((sum, item) => sum + item.subtotal, 0);

    return sendSuccess(res, 200, 'Cart retrieved successfully', {
      cart: formattedCart,
      total,
      itemCount: formattedCart.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * - Check if enough stock available
 * - Update quantity
 */
const updateCartQuantity = async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cart.findFirst({
      where: {
        id: cartId,
        userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
          },
        },
      },
    });

    if (!cartItem) {
      return sendError(res, 404, 'Cart item not found');
    }

    // Check if enough stock available
    if (cartItem.product.stock < quantity) {
      return sendError(
        res,
        400,
        `Only ${cartItem.product.stock} units available in stock`
      );
    }

    // Update quantity
    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
          },
        },
      },
    });

    return sendSuccess(res, 200, 'Cart quantity updated successfully', {
      cart: {
        ...updatedCart,
        product: {
          ...updatedCart.product,
          name: formatProductName(updatedCart.product.name),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const userId = req.user.id;

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cart.findFirst({
      where: {
        id: cartId,
        userId,
      },
    });

    if (!cartItem) {
      return sendError(res, 404, 'Cart item not found');
    }

    // Remove item
    await prisma.cart.delete({
      where: { id: cartId },
    });

    return sendSuccess(res, 200, 'Item removed from cart successfully', null);
  } catch (error) {
    next(error);
  }
};

/**
 * Clear entire cart
 */
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.cart.deleteMany({
      where: { userId },
    });

    return sendSuccess(res, 200, 'Cart cleared successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};