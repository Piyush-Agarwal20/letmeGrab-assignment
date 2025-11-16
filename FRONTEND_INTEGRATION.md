# Frontend Integration Guide

Complete conceptual guide for integrating the E-Commerce API with your frontend application.

## Table of Contents
1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [User Journey](#user-journey)
4. [Seller Journey](#seller-journey)
5. [Payment Integration](#payment-integration)
6. [API Integration Patterns](#api-integration-patterns)
7. [Error Handling Strategy](#error-handling-strategy)

---

## Overview

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Store the token in:
- **localStorage** - Simple, accessible across tabs
- **sessionStorage** - More secure, cleared on tab close
- **httpOnly cookie** - Most secure (requires backend changes)

---

## Authentication Flow

### 1. User Registration

**Endpoint:** `POST /api/users/register`

**What to send:**
- User's name
- Email address
- Password

**What you'll receive:**
- User profile (id, email, name, walletPoints)
- JWT token
- Welcome bonus info (100 wallet points + WELCOME10 coupon)

**Frontend actions:**
1. Show registration form
2. Send data to API
3. Save token to localStorage
4. Show welcome message with bonus info
5. Redirect to dashboard/home

---

### 2. User Login

**Endpoint:** `POST /api/users/login`

**What to send:**
- Email address
- Password

**What you'll receive:**
- User profile
- JWT token

**Frontend actions:**
1. Show login form
2. Send credentials to API
3. Save token to localStorage
4. Redirect to dashboard

---

### 3. Seller Registration & Login

**Endpoints:**
- `POST /api/sellers/register`
- `POST /api/sellers/login`

**What to send:**
- Name, email, password
- Shop name (for registration)

**What you'll receive:**
- Seller profile
- JWT token

**Frontend actions:**
1. Use separate seller login/register pages
2. Save token with identifier (e.g., userType: 'seller')
3. Redirect to seller dashboard

---

## User Journey

### Step 1: Browse Products

**Endpoint:** `GET /api/products/all?search=iphone&page=1&limit=12`

**What you'll receive:**
- List of products with:
  - Product ID, name, description
  - Price, stock availability
  - Seller information

**Frontend pages:**
- Home page / Product listing page
- Show products in grid/list
- Add search bar
- Add pagination controls

**No authentication required** - Public endpoint

---

### Step 2: View Product Details

**Endpoint:** `GET /api/products/public/:productId`

**What you'll receive:**
- Detailed product information
- Stock status
- Seller details

**Frontend pages:**
- Product detail page
- Show all product info
- "Add to Cart" button

**No authentication required** - Public endpoint

---

### Step 3: Add to Cart

**Endpoint:** `POST /api/cart`

**What to send:**
- Product ID
- Quantity

**What you'll receive:**
- Success confirmation
- Updated cart item

**Frontend actions:**
1. User clicks "Add to Cart"
2. Send product ID and quantity
3. Show success notification
4. Update cart icon badge count

**Authentication required** - User must be logged in

---

### Step 4: View Cart

**Endpoint:** `GET /api/cart`

**What you'll receive:**
- List of cart items with:
  - Product details
  - Quantity
  - Price per item
  - Subtotal

**Frontend pages:**
- Cart page
- Show all items
- Allow quantity updates
- Allow item removal
- Show total amount
- "Proceed to Checkout" button

---

### Step 5: Update Cart

**Update quantity:** `PATCH /api/cart/:cartItemId`
**Remove item:** `DELETE /api/cart/:cartItemId`
**Clear cart:** `DELETE /api/cart`

**Frontend actions:**
- Update quantity: Dropdown or +/- buttons
- Remove: "Remove" button per item
- Clear: "Clear Cart" button

---

### Step 6: View Available Coupons

**Endpoints:**
- `GET /api/coupons/all` - Public, all active coupons
- `GET /api/coupons/user/available` - User-specific available coupons
- `GET /api/coupons/:code` - Validate specific coupon

**What you'll receive:**
- Coupon code
- Discount type (PERCENTAGE or FIXED)
- Discount value
- Minimum purchase requirement
- Maximum discount cap
- Usage limits
- Validity dates
- Remaining uses

**Frontend pages:**
- Coupons page
- Show all available coupons
- "Copy Code" button
- Filter by discount type
- Show expiry dates

---

### Step 7: Calculate Order (Preview)

**Endpoint:** `POST /api/orders/calculate`

**What to send:**
- Coupon code (optional)
- Whether to use wallet points
- Amount of wallet points to use

**What you'll receive:**
- Subtotal
- Coupon discount applied
- Wallet points deducted
- Final amount to pay
- List of items

**Frontend pages:**
- Checkout page
- Show order breakdown
- Coupon input field
- Wallet points checkbox
- Preview before final order

**Purpose:**
- Let user see final price BEFORE placing order
- Validate coupon
- Check wallet points balance
- No stock deduction yet

---

### Step 8: Place Order

**Endpoint:** `POST /api/orders`

**What to send:**
- Same as calculate: coupon code, wallet points

**What you'll receive:**
- Order ID
- Final amount to pay
- Payment status: PENDING
- Order status: PENDING

**What happens in backend:**
- Stock is DEDUCTED
- Wallet points DEDUCTED
- Coupon usage COUNTED
- Order created with PENDING status

**Frontend actions:**
1. User clicks "Place Order"
2. Create order on backend
3. Immediately open payment gateway
4. Don't redirect yet - payment pending

---

### Step 9: Payment (Razorpay/Stripe)

**Payment Success Flow:**
1. User completes payment on Razorpay
2. Razorpay returns success response
3. **Frontend calls:** `PATCH /api/orders/:orderId/payment` with `paymentStatus: "SUCCESS"`
4. Backend updates order to CONFIRMED
5. Frontend redirects to "Order Confirmed" page

**Payment Failure Flow:**
1. User cancels or payment fails
2. **Frontend calls:** `PATCH /api/orders/:orderId/payment` with `paymentStatus: "FAILED"`
3. Backend automatically:
   - Restores stock
   - Restores wallet points
   - Restores coupon usage
   - Sets order status to CANCELLED
4. Frontend shows "Payment Failed" message

**Important:**
- Backend trusts frontend's payment status
- Frontend MUST call the update API in both cases
- Never leave order in PENDING state

---

### Step 10: View Orders

**Endpoints:**
- `GET /api/orders` - All user's orders
- `GET /api/orders?status=PENDING` - Filter by status
- `GET /api/orders/:orderId` - Single order details

**What you'll receive:**
- Order ID
- Order date
- Total amount
- Discounts applied
- Final amount paid
- Payment status
- Order status (PENDING, CONFIRMED, DELIVERED, etc.)
- List of items

**Frontend pages:**
- Orders page / Order history
- Show all orders
- Filter by status
- Click to view details
- Track order status

---

### Step 11: View Profile & Wallet

**Endpoints:**
- `GET /api/users/profile` - User details
- `GET /api/users/wallet` - Wallet points

**What you'll receive:**
- Profile: name, email, wallet points, join date
- Wallet: current points balance

**Frontend pages:**
- Profile page
- Wallet page
- Show wallet balance in header/navbar

---

## Seller Journey

### Step 1: Seller Dashboard

**Endpoint:** `GET /api/products`

**What you'll receive:**
- All products created by this seller
- Product details, stock, status

**Frontend pages:**
- Seller dashboard
- List all products
- Show stock levels
- Edit/Delete buttons

---

### Step 2: Add Product

**Endpoint:** `POST /api/products`

**What to send:**
- Product name
- Description
- Price
- Stock quantity

**What happens:**
- Product stored in lowercase
- Displayed in Title Case
- Multiple sellers can have same product name

**Frontend pages:**
- "Add Product" form
- Fields: name, description, price, stock
- Submit button

---

### Step 3: Update Product

**Endpoint:** `PUT /api/products/:productId`

**What to send:**
- Updated name, description, price, stock

**Frontend pages:**
- Edit product page
- Pre-filled form with current values

---

### Step 4: Update Stock Only

**Endpoint:** `PATCH /api/products/:productId/stock`

**What to send:**
- New stock quantity

**Frontend actions:**
- Quick stock update input on product list
- No need to open full edit form

---

### Step 5: Delete Product (Soft Delete)

**Endpoint:** `DELETE /api/products/:productId`

**What happens:**
- Product not deleted from database
- `isActive` set to false
- Product hidden from public listings
- Order history preserved

**Frontend actions:**
- Confirmation dialog
- Remove from seller's product list
- Can add "Restore" feature later

---

## Payment Integration

### Razorpay Integration Flow

**1. Order Placement**
- User places order
- Backend creates PENDING order
- Frontend receives orderId and finalAmount

**2. Initialize Razorpay**
- Frontend loads Razorpay SDK
- Create Razorpay instance with:
  - API key
  - Amount (in paise: finalAmount × 100)
  - Order ID
  - Success handler
  - Failure handler

**3. Payment Success Handler**
- Razorpay calls your success callback
- Frontend calls: `PATCH /api/orders/:orderId/payment { paymentStatus: "SUCCESS" }`
- Show success message
- Redirect to orders page

**4. Payment Failure Handler**
- User cancels or payment fails
- Frontend calls: `PATCH /api/orders/:orderId/payment { paymentStatus: "FAILED" }`
- Backend restores everything
- Show failure message

**5. Important Notes**
- Frontend controls payment gateway
- Backend trusts frontend's status update
- Backend handles all rollback logic
- For production: Add signature verification

---

## API Integration Patterns

### 1. Making API Calls

**Setup:**
- Create axios instance with base URL
- Add interceptor to inject JWT token automatically
- Add interceptor to handle 401 errors globally

**Pattern:**
```
1. User action (click button)
2. Show loading state
3. Call API
4. Handle success → Update UI
5. Handle error → Show error message
6. Hide loading state
```

---

### 2. State Management

**User State:**
- Store: token, user profile, cart count
- Update on: login, logout, cart changes

**Product State:**
- Store: products list, filters, pagination
- Update on: search, filter change, page change

**Cart State:**
- Store: cart items, total
- Update on: add, remove, update quantity

**Order State:**
- Store: orders list, current order
- Update on: place order, payment status change

---

### 3. Route Protection

**Public Routes:**
- Home, Product List, Product Details
- Login, Register
- Public coupons

**User-Only Routes:**
- Cart, Checkout, Orders
- Profile, Wallet
- User coupons

**Seller-Only Routes:**
- Seller Dashboard
- Add/Edit Product
- Manage Products

**Implementation:**
- Check for token in localStorage
- Redirect to login if not found
- Check user type for seller routes

---

### 4. Automatic Token Refresh

**Pattern:**
- Intercept 401 responses
- Clear token
- Redirect to login
- Show "Session expired" message

---

### 5. Loading States

**Show loading for:**
- Login/Register
- Fetching products
- Adding to cart
- Placing order
- Payment processing
- Fetching orders

**UI Elements:**
- Spinners
- Skeleton screens
- Disabled buttons
- Progress bars

---

### 6. Error Handling

**Types of Errors:**

**400 - Bad Request**
- Invalid input
- Validation failed
- Show specific error message

**401 - Unauthorized**
- Token expired/invalid
- Redirect to login

**403 - Forbidden**
- Wrong user type (user accessing seller routes)
- Show "Access denied"

**404 - Not Found**
- Product not found
- Order not found
- Show "Not found" page

**409 - Conflict**
- Email already exists
- Show specific error

**500 - Server Error**
- Something went wrong
- Show generic error
- Log for debugging

---

### 7. Notifications/Toasts

**Show for:**
- Login success
- Product added to cart
- Order placed
- Payment success/failure
- Product created/updated
- Errors

---

## Error Handling Strategy

### 1. Global Error Handler

**Setup:**
- Axios response interceptor
- Catch all API errors
- Show user-friendly messages
- Log errors to console/service

---

### 2. Network Errors

**When API is down:**
- Show "Network error" message
- Provide retry button
- Show cached data if available

---

### 3. Validation Errors

**Before API call:**
- Validate on frontend (email format, required fields)
- Show inline errors

**From API (400):**
- Show backend error messages
- Highlight specific fields

---

### 4. Session Management

**Token expiry:**
- Detect 401 errors
- Clear local storage
- Redirect to login
- Show "Please login again"

---

## Complete User Shopping Flow

```
1. Browse Products
   ↓ GET /api/products/all

2. View Product Details
   ↓ GET /api/products/public/:id

3. Add to Cart (Login required)
   ↓ POST /api/cart

4. View Cart
   ↓ GET /api/cart

5. View Available Coupons
   ↓ GET /api/coupons/user/available

6. Go to Checkout
   ↓ Enter coupon, select wallet points

7. Calculate Order Preview
   ↓ POST /api/orders/calculate
   (Shows final amount, no changes to DB)

8. Place Order
   ↓ POST /api/orders
   (Stock deducted, order status: PENDING)

9. Payment Gateway Opens
   ↓ User pays via Razorpay/Stripe

10a. Payment Success
   ↓ PATCH /api/orders/:id/payment {status: "SUCCESS"}
   → Order confirmed
   → Redirect to orders page

10b. Payment Failure
   ↓ PATCH /api/orders/:id/payment {status: "FAILED"}
   → Stock restored
   → Wallet restored
   → Coupon restored
   → Show error message

11. View Order History
   ↓ GET /api/orders
```

---

## Complete Seller Flow

```
1. Register/Login as Seller
   ↓ POST /api/sellers/register or /login

2. View Dashboard
   ↓ GET /api/products
   (Shows all seller's products)

3. Add New Product
   ↓ POST /api/products

4. Update Product
   ↓ PUT /api/products/:id

5. Update Stock
   ↓ PATCH /api/products/:id/stock

6. Delete Product (Soft)
   ↓ DELETE /api/products/:id
   (Sets isActive = false)
```

---

## Pages You Need to Build

### Public Pages
1. **Home** - Featured products
2. **Product List** - All products with search/filter
3. **Product Details** - Single product view
4. **Login** - User/Seller login
5. **Register** - User/Seller registration

### User Pages (Authenticated)
6. **Cart** - Shopping cart
7. **Checkout** - Order summary with coupon/wallet
8. **Orders** - Order history
9. **Order Details** - Single order view
10. **Profile** - User profile
11. **Wallet** - Wallet points
12. **Coupons** - Available coupons

### Seller Pages (Authenticated)
13. **Seller Dashboard** - Product list
14. **Add Product** - Create product form
15. **Edit Product** - Update product form

---

## Key Points to Remember

1. **Authentication**
   - Store JWT token after login
   - Send token in Authorization header
   - Handle 401 errors globally

2. **Cart Management**
   - Update cart count in navbar
   - Refresh cart after operations
   - Clear cart after successful order

3. **Payment Flow**
   - Order created BEFORE payment
   - Stock deducted on order creation
   - Frontend updates payment status
   - Backend handles rollback on failure

4. **Error Handling**
   - Show user-friendly messages
   - Validate before API calls
   - Handle network errors
   - Log errors for debugging

5. **Loading States**
   - Show spinners/loaders
   - Disable buttons during API calls
   - Improve user experience

6. **User Experience**
   - Show success notifications
   - Confirm destructive actions
   - Provide clear feedback
   - Handle edge cases

7. **Security**
   - Never store sensitive data
   - Use HTTPS in production
   - Validate user input
   - Protect routes based on user type

8. **Performance**
   - Paginate product lists
   - Cache user data
   - Debounce search input
   - Lazy load images

---

## Testing Checklist

### User Flow
- [ ] Register new user
- [ ] Receive welcome bonus
- [ ] Login
- [ ] Browse products
- [ ] Add to cart
- [ ] Update cart quantity
- [ ] Remove from cart
- [ ] Apply coupon
- [ ] Use wallet points
- [ ] Place order
- [ ] Complete payment
- [ ] View order history
- [ ] Logout

### Seller Flow
- [ ] Register seller
- [ ] Login
- [ ] Add product
- [ ] Update product
- [ ] Update stock
- [ ] Delete product
- [ ] View product list

### Error Cases
- [ ] Invalid login
- [ ] Expired token
- [ ] Out of stock
- [ ] Invalid coupon
- [ ] Insufficient wallet
- [ ] Payment failure
- [ ] Network error

---

## API Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

---

## Summary

Your e-commerce API is **fully ready for frontend integration**. The key workflow is:

1. **User authenticates** → Receives JWT token
2. **Browses products** → Public endpoint, no auth
3. **Manages cart** → Authenticated, real-time updates
4. **Applies discounts** → Coupons + wallet points
5. **Places order** → Creates PENDING order, deducts stock
6. **Pays via gateway** → Frontend manages payment UI
7. **Updates status** → Frontend tells backend SUCCESS/FAILED
8. **Backend handles logic** → Confirms or rolls back

All endpoints return consistent JSON, handle errors gracefully, and follow REST conventions. Your frontend team can start integration immediately!
