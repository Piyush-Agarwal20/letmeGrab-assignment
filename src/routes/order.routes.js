const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validate } = require('../middleware/validation.middleware');
const { calculateOrderSchema, placeOrderSchema } = require('../validations/order.validation');
const { authenticateUser } = require('../middleware/auth.middleware');


router.post('/calculate', authenticateUser, validate(calculateOrderSchema), orderController.calculateOrder);

router.post('/', authenticateUser, validate(placeOrderSchema), orderController.placeOrder);

module.exports = router;