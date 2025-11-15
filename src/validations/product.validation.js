const Joi = require('joi');

/**
 * Add Product Validation Schema
 * - name: Required, min 2 characters
 * - description: Required, min 10 characters
 * - price: Required, must be positive number
 * - stock: Required, must be non-negative integer
 */
const addProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Product name must be at least 2 characters long',
      'string.max': 'Product name cannot exceed 200 characters',
      'string.empty': 'Product name is required',
      'any.required': 'Product name is required',
    }),

  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Product description must be at least 10 characters long',
      'string.max': 'Product description cannot exceed 1000 characters',
      'string.empty': 'Product description is required',
      'any.required': 'Product description is required',
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a valid number',
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required',
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Stock must be a valid number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock is required',
    }),
});

/**
 * Update Product Validation Schema
 * - All fields are optional (at least one must be provided)
 * - name: Optional, min 2 characters
 * - description: Optional, min 10 characters
 * - price: Optional, must be positive number
 * - stock: Optional, must be non-negative integer
 * - isActive: Optional, boolean
 */
const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Product name must be at least 2 characters long',
      'string.max': 'Product name cannot exceed 200 characters',
    }),

  description: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Product description must be at least 10 characters long',
      'string.max': 'Product description cannot exceed 1000 characters',
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Price must be a valid number',
      'number.positive': 'Price must be a positive number',
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Stock must be a valid number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock cannot be negative',
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Update Stock Validation Schema
 * - stock: Required, must be non-negative integer
 */
const updateStockSchema = Joi.object({
  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Stock must be a valid number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock is required',
    }),
});

module.exports = {
  addProductSchema,
  updateProductSchema,
  updateStockSchema,
};