const Joi = require('joi');

/**
 * Calculate Order Validation Schema
 * - couponCode: Optional, string
 * - useWalletPoints: Optional, boolean (default: false)
 * - walletPointsToUse: Optional, number (if useWalletPoints is true)
 */
const calculateOrderSchema = Joi.object({
  couponCode: Joi.string()
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'Coupon code must be a string',
    }),

  useWalletPoints: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'useWalletPoints must be a boolean',
    }),

  walletPointsToUse: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Wallet points must be a valid number',
      'number.min': 'Wallet points cannot be negative',
    }),
});

/**
 * Place Order Validation Schema
 * - couponCode: Optional, string
 * - useWalletPoints: Optional, boolean (default: false)
 * - walletPointsToUse: Optional, number (if useWalletPoints is true)
 */
const placeOrderSchema = Joi.object({
  couponCode: Joi.string()
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'Coupon code must be a string',
    }),

  useWalletPoints: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'useWalletPoints must be a boolean',
    }),

  walletPointsToUse: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Wallet points must be a valid number',
      'number.min': 'Wallet points cannot be negative',
    }),
});

module.exports = {
  calculateOrderSchema,
  placeOrderSchema,
};