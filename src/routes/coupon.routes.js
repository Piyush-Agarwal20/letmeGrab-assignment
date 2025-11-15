const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

// Public routes - no authentication required
router.get('/all', couponController.getAllCoupons);

router.get('/:code', couponController.getCouponByCode);

// Protected routes - require user authentication
router.get('/user/available', authenticateUser, couponController.getUserCoupons);

module.exports = router;