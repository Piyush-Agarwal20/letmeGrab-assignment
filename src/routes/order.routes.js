const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validate } = require('../middleware/validation.middleware');
const { calculateOrderSchema, placeOrderSchema, updatePaymentStatusSchema } = require('../validations/order.validation');
const { authenticateUser } = require('../middleware/auth.middleware');

// Calculate order total (before placing order)
router.post('/calculate', authenticateUser, validate(calculateOrderSchema), orderController.calculateOrder);

// Place order
router.post('/', authenticateUser, validate(placeOrderSchema), orderController.placeOrder);

// Get all user orders (with optional status filter)
router.get('/', authenticateUser, orderController.getUserOrders);

// Get single order details
router.get('/:orderId', authenticateUser, orderController.getOrderById);

// Update payment status (SUCCESS/FAILED)
router.patch('/:orderId/payment', authenticateUser, validate(updatePaymentStatusSchema), orderController.updatePaymentStatus);

module.exports = router;