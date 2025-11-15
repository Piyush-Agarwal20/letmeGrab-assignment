require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const userRoutes = require('./routes/user.routes');
const sellerRoutes = require('./routes/seller.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const couponRoutes = require('./routes/coupon.routes');

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Detailed logging for development
} else {
  app.use(morgan('combined')); // Apache combined format for production
}

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API is running',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;