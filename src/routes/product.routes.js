const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { validate } = require('../middleware/validation.middleware');
const { addProductSchema, updateProductSchema, updateStockSchema } = require('../validations/product.validation');
const { authenticateSeller } = require('../middleware/auth.middleware');

// Public routes (for users/customers) - must come before parameterized routes
router.get('/all', productController.getAllProducts);
router.get('/public/:productId', productController.getProductById);

// Seller routes (authenticated)
router.post('/', authenticateSeller, validate(addProductSchema), productController.addProduct);

router.get('/', authenticateSeller, productController.getMyProducts);

router.get('/:productId', authenticateSeller, productController.getProduct);

router.put('/:productId', authenticateSeller, validate(updateProductSchema), productController.updateProduct);

router.patch('/:productId/stock', authenticateSeller, validate(updateStockSchema), productController.updateStock);

router.delete('/:productId', authenticateSeller, productController.deleteProduct);

module.exports = router;