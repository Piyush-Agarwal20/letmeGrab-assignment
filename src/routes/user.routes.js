const express = require('express');
const router = express.Router();
const { register, login, getProfile, getWalletPoints } = require('../controllers/user.controller');
const { validate } = require('../middleware/validation.middleware');
const { registerSchema, loginSchema } = require('../validations/user.validation');
const { authenticateUser } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/profile', authenticateUser, getProfile);
router.get('/wallet', authenticateUser, getWalletPoints);

module.exports = router;