const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller.controller');
const { validate } = require('../middleware/validation.middleware');
const { sellerRegisterSchema, sellerLoginSchema } = require('../validations/seller.validation');

router.post('/register', validate(sellerRegisterSchema), sellerController.register);

router.post('/login', validate(sellerLoginSchema), sellerController.login);

module.exports = router;