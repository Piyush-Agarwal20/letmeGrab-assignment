# E-Commerce API

A complete Node.js e-commerce API built with Express.js, Prisma ORM, and PostgreSQL (Supabase). This API supports user and seller authentication, product management, cart operations, order processing with coupons and wallet points, and payment status handling.

## Database Schema

### Entity Relationship Overview

```
┌──────────┐         ┌──────────┐
│   User   │────────▶│   Cart   │
│          │  1:N    │          │
└────┬─────┘         └────┬─────┘
     │                    │
     │ 1:N                │ N:1
     │                    │
     ▼                    ▼
┌──────────┐         ┌──────────┐
│  Order   │────────▶│ Product  │
│          │         │          │
└────┬─────┘         └────┬─────┘
     │                    │
     │ 1:1                │ N:1
     │                    │
     ▼                    ▼
┌──────────┐         ┌──────────┐
│Transaction│        │  Seller  │
│          │         │          │
└──────────┘         └──────────┘

┌──────────┐         ┌──────────┐
│  Coupon  │────────▶│UserCoupon│
│          │  1:N    │          │
└────┬─────┘         └──────────┘
     │
     │ 1:N
     │
     ▼
┌──────────┐
│  Order   │
│          │
└──────────┘
```

### Database Tables

#### 1. User
```
- id (uuid, PK)
- email (string, unique)
- password (string, hashed)
- name (string)
- walletPoints (decimal)
- createdAt (datetime)
- updatedAt (datetime)

Relations:
  → Cart (1:N)
  → Order (1:N)
  → UserCoupon (1:N)
```

#### 2. Seller
```
- id (uuid, PK)
- email (string, unique)
- password (string, hashed)
- name (string)
- shopName (string)
- createdAt (datetime)
- updatedAt (datetime)

Relations:
  → Product (1:N)
```

#### 3. Product
```
- id (uuid, PK)
- sellerId (uuid, FK → Seller)
- name (string, normalized)
- description (string, optional)
- price (decimal)
- stock (int)
- isActive (boolean)
- createdAt (datetime)
- updatedAt (datetime)

Relations:
  ← Seller (N:1)
  → Cart (1:N)
  → OrderItem (1:N)
```

#### 4. Cart
```
- id (uuid, PK)
- userId (uuid, FK → User)
- productId (uuid, FK → Product)
- quantity (int)
- createdAt (datetime)
- updatedAt (datetime)

Unique: (userId, productId)

Relations:
  ← User (N:1)
  ← Product (N:1)
```

#### 5. Coupon
```
- id (uuid, PK)
- code (string, unique)
- discountType (enum: PERCENTAGE|FIXED)
- discountValue (decimal)
- minPurchase (decimal, optional)
- maxDiscount (decimal, optional)
- usageLimitPerUser (int, optional)
- totalUsageLimit (int, optional)
- currentUsageCount (int)
- validFrom (datetime)
- validTo (datetime)
- isActive (boolean)
- createdAt (datetime)
- updatedAt (datetime)

Relations:
  → UserCoupon (1:N)
  → Order (1:N)
```

#### 6. UserCoupon
```
- id (uuid, PK)
- userId (uuid, FK → User)
- couponId (uuid, FK → Coupon)
- usageCount (int)
- lastUsedAt (datetime, optional)
- createdAt (datetime)

Unique: (userId, couponId)

Relations:
  ← User (N:1)
  ← Coupon (N:1)
```

#### 7. Order
```
- id (uuid, PK)
- userId (uuid, FK → User)
- couponId (uuid, FK → Coupon, optional)
- totalAmount (decimal)
- couponDiscount (decimal)
- walletPointsUsed (decimal)
- finalAmount (decimal)
- paymentStatus (enum: PENDING|SUCCESS|FAILED|REFUNDED)
- orderStatus (enum: PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED)
- createdAt (datetime)
- updatedAt (datetime)

Relations:
  ← User (N:1)
  ← Coupon (N:1, optional)
  → OrderItem (1:N)
  → Transaction (1:1)
```

#### 8. OrderItem
```
- id (uuid, PK)
- orderId (uuid, FK → Order)
- productId (uuid, FK → Product)
- quantity (int)
- price (decimal, snapshot)
- createdAt (datetime)

Relations:
  ← Order (N:1)
  ← Product (N:1)
```

#### 9. Transaction
```
- id (uuid, PK)
- orderId (uuid, FK → Order, unique)
- paymentStatus (enum: PENDING|SUCCESS|FAILED|REFUNDED)
- paymentMethod (string, optional)
- transactionId (string, unique, optional)
- createdAt (datetime)
- updatedAt (datetime)

Relations:
  ← Order (1:1)
```

### Relationship Summary

**One-to-Many (1:N)**
- User → Cart
- User → Order
- User → UserCoupon
- Seller → Product
- Product → Cart
- Product → OrderItem
- Coupon → UserCoupon
- Coupon → Order
- Order → OrderItem

**One-to-One (1:1)**
- Order → Transaction

**Many-to-One (N:1)**
- Cart → User
- Cart → Product
- Order → User
- Order → Coupon (optional)
- OrderItem → Order
- OrderItem → Product
- UserCoupon → User
- UserCoupon → Coupon
- Product → Seller
- Transaction → Order

## Features

### User Side
- User registration and login with JWT authentication
- User profile and wallet points management
- Browse products with search and pagination
- Shopping cart management
- Order placement with coupon and wallet point discounts
- Order history and tracking
- Payment status updates

### Seller Side
- Seller registration and login with JWT authentication
- Product CRUD operations
- Stock management
- Product name normalization (stored lowercase, displayed Title Case)
- Multiple sellers can have products with the same name

### Coupon System
- Public coupon listing
- User-specific available coupons
- Global and per-user usage limits
- Automatic usage tracking
- Coupon validation (date range, usage limits, minimum purchase)

### Order & Payment Flow
- Calculate order preview with discounts
- Place order (creates PENDING order with stock deduction)
- Payment gateway integration ready (Razorpay/Stripe)
- Automatic rollback on payment failure (restores stock, wallet, coupon usage)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Password Hashing**: bcrypt
- **Logging**: Morgan
- **Connection Pooling**: pgBouncer

## API Endpoints

### User Endpoints

#### Authentication
```
POST   /api/users/register          - Register new user
POST   /api/users/login             - User login
GET    /api/users/profile           - Get user profile (authenticated)
GET    /api/users/wallet            - Get wallet points (authenticated)
```

#### Products (Public)
```
GET    /api/products/all            - Get all products with search & pagination
GET    /api/products/public/:id     - Get single product details
```

#### Cart
```
POST   /api/cart                    - Add item to cart
GET    /api/cart                    - Get user's cart
PATCH  /api/cart/:cartItemId        - Update cart item quantity
DELETE /api/cart/:cartItemId        - Remove item from cart
DELETE /api/cart                    - Clear entire cart
```

#### Coupons
```
GET    /api/coupons/all             - Get all active coupons (public)
GET    /api/coupons/:code           - Get coupon details by code (public)
GET    /api/coupons/user/available  - Get user's available coupons (authenticated)
```

#### Orders
```
POST   /api/orders/calculate        - Calculate order preview with discounts
POST   /api/orders                  - Place order
GET    /api/orders                  - Get user's orders (filter by ?status=PENDING)
GET    /api/orders/:orderId         - Get single order details
PATCH  /api/orders/:orderId/payment - Update payment status (SUCCESS/FAILED)
```

### Seller Endpoints

#### Authentication
```
POST   /api/sellers/register        - Register new seller
POST   /api/sellers/login           - Seller login
```

#### Products (Seller)
```
POST   /api/products                - Add new product
GET    /api/products                - Get seller's products
GET    /api/products/:productId     - Get single product details
PUT    /api/products/:productId     - Update product
PATCH  /api/products/:productId/stock - Update product stock
DELETE /api/products/:productId     - Delete product (soft delete)
```

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd letmegrab-assignment
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="your_supabase_database_url?pgbouncer=true"
DIRECT_URL="your_supabase_direct_url"
JWT_SECRET="your_jwt_secret_key"
PORT=3000
NODE_ENV=development
```

4. Generate Prisma client
```bash
npx prisma generate --schema=./src/prisma/schema.prisma
```

5. Run database migrations
```bash
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
```

6. Start the server
```bash
npm run dev
```

## Request & Response Examples

### 1. User Registration
```bash
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "walletPoints": 0
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Add Product (Seller)
```bash
POST /api/products
Authorization: Bearer <seller_token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Latest Apple smartphone",
  "price": 999.99,
  "stock": 50
}
```

### 3. Calculate Order
```bash
POST /api/orders/calculate
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "couponCode": "SUMMER20",
  "useWalletPoints": true,
  "walletPointsToUse": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order calculation successful",
  "data": {
    "breakdown": {
      "subtotal": 1000,
      "couponDiscount": 200,
      "walletPointsUsed": 50,
      "finalAmount": 750,
      "items": [...]
    }
  }
}
```

### 4. Place Order
```bash
POST /api/orders
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "couponCode": "SUMMER20",
  "useWalletPoints": true,
  "walletPointsToUse": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "orderId": "uuid",
      "finalAmount": 750,
      "paymentStatus": "PENDING",
      "orderStatus": "PENDING"
    }
  }
}
```

### 5. Update Payment Status
```bash
PATCH /api/orders/:orderId/payment
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "paymentStatus": "SUCCESS"
}
```

## Payment Flow Integration

### Complete Order Flow

```
1. User adds items to cart
   → POST /api/cart

2. User views cart
   → GET /api/cart

3. User applies coupon and sees preview
   → POST /api/orders/calculate

4. User places order (status: PENDING, stock deducted)
   → POST /api/orders

5. Frontend opens payment gateway (Razorpay/Stripe)

6. User completes payment:
   - SUCCESS → PATCH /api/orders/:id/payment {status: "SUCCESS"}
     Order status: CONFIRMED

   - FAILED → PATCH /api/orders/:id/payment {status: "FAILED"}
     Order status: CANCELLED
     Stock restored ✓
     Wallet points restored ✓
     Coupon usage restored ✓
```

### Frontend Integration Example (React + Razorpay)

```javascript
const handleCheckout = async () => {
  // 1. Place order
  const orderRes = await axios.post('/api/orders', {
    couponCode: "SUMMER20",
    useWalletPoints: true,
    walletPointsToUse: 50
  });

  const { orderId, finalAmount } = orderRes.data.data.order;

  // 2. Initiate Razorpay
  const options = {
    key: "rzp_test_YOUR_KEY",
    amount: finalAmount * 100, // paise
    currency: "INR",
    name: "My Store",

    handler: async function(response) {
      // Payment success
      await axios.patch(`/api/orders/${orderId}/payment`, {
        paymentStatus: "SUCCESS"
      });
      alert("Order confirmed!");
    },

    modal: {
      ondismiss: async function() {
        // Payment failed/cancelled
        await axios.patch(`/api/orders/${orderId}/payment`, {
          paymentStatus: "FAILED"
        });
        alert("Payment failed. Stock restored.");
      }
    }
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

## Key Features Explained

### 1. Product Name Normalization
- **Storage**: Products are stored in lowercase and trimmed (`"iphone 15 pro"`)
- **Display**: Products are displayed in Title Case (`"Iphone 15 Pro"`)
- **Duplicate Check**: Different sellers CAN have products with the same name

### 2. Coupon System
- **Discount Types**: PERCENTAGE or FIXED
- **Usage Limits**:
  - Global limit (total uses across all users)
  - Per-user limit (max uses per individual user)
- **Validation**: Minimum purchase amount, maximum discount cap
- **Date Range**: Valid from/to dates

### 3. Wallet Points
- 1 wallet point = ₹1
- Applied AFTER coupon discount
- Cannot exceed remaining order amount
- Automatically restored on payment failure

### 4. Transaction Safety
- All order operations use database transactions
- Stock deduction happens atomically
- Payment failure automatically rolls back all changes

### 5. Soft Deletes
- Products use `isActive` flag instead of hard deletion
- Ensures order history remains intact
- Inactive products don't appear in public listings

## Database Relationships

### User Relationships
- User → Cart (1:N)
- User → Order (1:N)
- User → UserCoupon (1:N) - Tracks usage

### Seller Relationships
- Seller → Product (1:N)

### Product Relationships
- Product → Cart (1:N)
- Product → OrderItem (1:N)

### Order Relationships
- Order → OrderItem (1:N)
- Order → Transaction (1:1)
- User ← Order (N:1)
- Coupon ← Order (N:1, optional)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (with pgBouncer) | `postgresql://user:pass@host/db?pgbouncer=true` |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret key for JWT token generation | `your-super-secret-key` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (development only)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (wrong user type)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **JWT Authentication**: Separate tokens for users and sellers
- **Type-based Access Control**: Users can't access seller routes and vice versa
- **Input Validation**: Joi schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Stock Validation**: Prevents overselling
- **Coupon Validation**: Prevents misuse of expired/invalid coupons

## Scripts

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run migrate      # Run database migrations
npm run generate     # Generate Prisma client
```

## Project Structure

```
letmegrab-assignment/
├── src/
│   ├── config/
│   │   └── database.js         # Prisma client configuration
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── seller.controller.js
│   │   ├── product.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   └── coupon.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── seller.routes.js
│   │   ├── product.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   └── coupon.routes.js
│   ├── validations/
│   │   ├── user.validation.js
│   │   ├── seller.validation.js
│   │   ├── product.validation.js
│   │   ├── cart.validation.js
│   │   └── order.validation.js
│   ├── utils/
│   │   ├── response.util.js
│   │   ├── jwt.util.js
│   │   └── string.util.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── index.js                # Application entry point
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Node.js, Express, Prisma, and PostgreSQL
