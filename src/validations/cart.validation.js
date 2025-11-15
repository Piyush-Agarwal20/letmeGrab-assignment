const Joi = require('joi');

/**
 * Add to Cart Validation Schema
 * - productId: Required, must be valid UUID
 * - quantity: Required, must be positive integer
 */
const addToCartSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Product ID must be a valid UUID',
      'string.empty': 'Product ID is required',
      'any.required': 'Product ID is required',
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a valid number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
});

/**
 * Update Cart Quantity Validation Schema
 * - quantity: Required, must be positive integer
 */
const updateCartQuantitySchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a valid number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
});

module.exports = {
  addToCartSchema,
  updateCartQuantitySchema,
};