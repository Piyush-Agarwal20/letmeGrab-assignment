const Joi = require('joi');

/**
 * Seller Registration Validation Schema
 * - email: Required, must be valid email format
 * - password: Required, min 6 characters, must contain uppercase, lowercase, number, and special character
 * - name: Required, min 2 characters
 * - shopName: Required, min 2 characters
 */
const sellerRegisterSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),

  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),

  shopName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Shop name must be at least 2 characters long',
      'string.max': 'Shop name cannot exceed 100 characters',
      'string.empty': 'Shop name is required',
      'any.required': 'Shop name is required',
    }),
});

/**
 * Seller Login Validation Schema
 * - email: Required, must be valid email format
 * - password: Required
 */
const sellerLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
});

module.exports = {
  sellerRegisterSchema,
  sellerLoginSchema,
};