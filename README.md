# E-Commerce API - Node.js Practical Assignment

## Project Overview
A comprehensive Node.js REST API for an e-commerce system with separate user and seller functionalities, built with Express.js and PostgreSQL (Supabase).

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Validation**: Joi (all fields validated)
- **Authentication**: JWT
- **Password Hashing**: bcrypt

## Features

### Users Side
1. **Authentication**
   - User registration (auto-assigns wallet points and welcome coupon)
   - User login with JWT tokens
   - Joi validation on all input fields

2. **Shopping Cart**
   - Add items to cart
   - Update cart quantities
   - Remove items from cart
   - View cart

3. **Order Processing**
   - Calculate total with discount coupons
   - Apply wallet points to reduce total
   - Place orders (automatic stock deduction)
   - Save order details to database

4. **Payment Handling**
   - Process payment status (success/failure)
   - Update order status based on payment
   - Handle stock rollback on payment failure

### Seller Side
1. **Authentication**
   - Seller registration
   - Seller login with JWT tokens
   - Joi validation on all input fields

2. **Product Management**
   - Add new products
   - Update product details
   - Manage product stock
   - Update stock quantities
   - View all seller products

## Database Schema

### Tables
1. **users**
   - id, email, password, name, wallet_points, created_at, updated_at

2. **sellers**
   - id, email, password, name, shop_name, created_at, updated_at

3. **products**
   - id, seller_id, name, description, price, stock, created_at, updated_at

4. **coupons**
   - id, code, discount_type (percentage/fixed), discount_value, min_purchase, max_discount, valid_from, valid_to, is_active

5. **user_coupons**
   - id, user_id, coupon_id, is_used, used_at

6. **cart**
   - id, user_id, product_id, quantity, created_at, updated_at

7. **orders**
   - id, user_id, total_amount, coupon_discount, wallet_points_used, final_amount, payment_status, order_status, created_at, updated_at

8. **order_items**
   - id, order_id, product_id, quantity, price, created_at

9. **transactions**
   - id, order_id, payment_status, payment_method, transaction_id, created_at

## API Endpoints

### User Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

### User Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart

### User Orders
- `POST /api/orders/calculate` - Calculate order total with discounts
- `POST /api/orders` - Place an order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### User Payments
- `POST /api/payments/process` - Process payment
- `POST /api/payments/webhook` - Handle payment webhook

### Seller Authentication
- `POST /api/sellers/register` - Register new seller
- `POST /api/sellers/login` - Seller login

### Seller Products
- `POST /api/sellers/products` - Add new product
- `GET /api/sellers/products` - Get all seller products
- `PUT /api/sellers/products/:id` - Update product
- `PATCH /api/sellers/products/:id/stock` - Update product stock
- `DELETE /api/sellers/products/:id` - Delete product

### Products (Public)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Supabase account
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd letmegrab-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development

   # Supabase Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   DATABASE_URL=your_supabase_postgres_connection_string

   # JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d

   # Welcome Bonus
   WELCOME_WALLET_POINTS=100
   WELCOME_COUPON_CODE=WELCOME10
   ```

4. **Database Setup**
   ```bash
   npm run setup-db
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Project Structure
```
letmegrab-assignment/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── seller.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   └── product.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── seller.model.js
│   │   ├── product.model.js
│   │   ├── cart.model.js
│   │   ├── order.model.js
│   │   └── coupon.model.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── seller.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   └── product.routes.js
│   ├── services/
│   │   ├── user.service.js
│   │   ├── seller.service.js
│   │   ├── cart.service.js
│   │   ├── order.service.js
│   │   ├── payment.service.js
│   │   └── product.service.js
│   ├── utils/
│   │   ├── jwt.util.js
│   │   ├── response.util.js
│   │   └── error.util.js
│   ├── validations/
│   │   ├── user.validation.js
│   │   ├── seller.validation.js
│   │   ├── cart.validation.js
│   │   ├── order.validation.js
│   │   └── product.validation.js
│   ├── app.js
│   └── server.js
├── scripts/
│   └── setup-database.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Validation Rules (Joi)

All API endpoints include comprehensive Joi validation for:
- Email format validation
- Password strength requirements (min 8 chars, alphanumeric)
- Required fields
- Data type validation
- Min/max value constraints
- Custom business logic validation

## Business Logic

### New User Registration Flow
1. Validate user input with Joi
2. Hash password with bcrypt
3. Create user account
4. Assign welcome wallet points (100 points)
5. Assign welcome coupon (WELCOME10)
6. Return JWT token

### Order Placement Flow
1. Validate cart items
2. Calculate subtotal
3. Apply coupon discount (if valid)
4. Apply wallet points
5. Calculate final amount
6. Check product stock availability
7. Create order
8. Deduct stock from products
9. Process payment
10. Update order status based on payment result
11. Rollback stock if payment fails

### Stock Management
- Automatic stock deduction on successful order
- Stock rollback on payment failure
- Seller can update stock quantities
- Prevent orders when stock is insufficient

## Error Handling
- Centralized error handling middleware
- Custom error classes
- Proper HTTP status codes
- Detailed error messages in development
- Generic messages in production

## Security Features
- JWT authentication
- Password hashing with bcrypt
- Input validation with Joi
- SQL injection prevention (parameterized queries)
- CORS configuration
- Rate limiting (recommended)
- Helmet.js for security headers (recommended)

## Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## API Documentation
Once the server is running, API documentation will be available at:
- Postman Collection: `/docs/postman-collection.json`
- Swagger UI: `http://localhost:3000/api-docs` (if implemented)

## Environment Variables
See `.env.example` for all required environment variables.

## Contributing
This is a practical assignment project.

## License
Private - For assignment purposes only

## Contact
For questions regarding this assignment, please contact the project maintainer.
