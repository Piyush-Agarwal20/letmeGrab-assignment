const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/user.controller');
const {validate} = require('../middleware/validation.middleware');
const { registerSchema, loginSchema } = require('../validations/user.validation');


router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

module.exports = router;