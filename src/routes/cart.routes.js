const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validate } = require('../middleware/validation.middleware');
const { addToCartSchema, updateCartQuantitySchema } = require('../validations/cart.validation');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/', authenticateUser, validate(addToCartSchema), cartController.addToCart);

router.get('/', authenticateUser, cartController.getCart);

router.put('/:cartId', authenticateUser, validate(updateCartQuantitySchema), cartController.updateCartQuantity);

router.delete('/:cartId', authenticateUser, cartController.removeFromCart);

router.delete('/', authenticateUser, cartController.clearCart);

module.exports = router;