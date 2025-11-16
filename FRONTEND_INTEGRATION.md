# Frontend Integration Guide

Complete guide for integrating the E-Commerce API with your frontend application (React/Next.js/Vue).

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [Authentication Flow](#authentication-flow)
3. [User Features](#user-features)
4. [Seller Features](#seller-features)
5. [Shopping Flow](#shopping-flow)
6. [Payment Integration](#payment-integration)
7. [Error Handling](#error-handling)

---

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install axios
# For Razorpay payment integration
npm install react-razorpay
```

### 2. Create API Client

**`src/utils/api.js`**
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Environment Variables

**`.env`**
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_RAZORPAY_KEY=rzp_test_YOUR_KEY
```

---

## Authentication Flow

### 1. User Registration

**Component: `Register.jsx`**
```javascript
import { useState } from 'react';
import api from '../utils/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users/register', formData);

      // Save token and user data
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      // Show welcome bonus
      alert(`Welcome! You received ${response.data.data.welcomeBonus.walletPoints} wallet points and coupon: ${response.data.data.welcomeBonus.couponCode}`);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

export default Register;
```

### 2. User Login

**Component: `Login.jsx`**
```javascript
import { useState } from 'react';
import api from '../utils/api';

function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users/login', credentials);

      // Save token and user data
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default Login;
```

### 3. Seller Login

**Component: `SellerLogin.jsx`**
```javascript
import { useState } from 'react';
import api from '../utils/api';

function SellerLogin() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/sellers/login', credentials);

      // Save seller token
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('seller', JSON.stringify(response.data.data.seller));

      // Redirect to seller dashboard
      window.location.href = '/seller/dashboard';
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  // ... similar form implementation
}
```

---

## User Features

### 1. Get User Profile

**Component: `UserProfile.jsx`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data.data.user);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="profile">
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Wallet Points: ₹{user.walletPoints}</p>
      <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
}

export default UserProfile;
```

### 2. Get Wallet Points

**Hook: `useWallet.js`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useWallet() {
  const [walletPoints, setWalletPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchWalletPoints = async () => {
    try {
      const response = await api.get('/users/wallet');
      setWalletPoints(response.data.data.walletPoints);
    } catch (err) {
      console.error('Failed to fetch wallet points', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletPoints();
  }, []);

  return { walletPoints, loading, refresh: fetchWalletPoints };
}
```

**Usage in Component:**
```javascript
function WalletDisplay() {
  const { walletPoints, loading, refresh } = useWallet();

  if (loading) return <p>Loading wallet...</p>;

  return (
    <div className="wallet">
      <h3>Wallet Balance</h3>
      <p>₹{walletPoints}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

---

## Seller Features

### 1. Add Product

**Component: `AddProduct.jsx`**
```javascript
import { useState } from 'react';
import api from '../utils/api';

function AddProduct() {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/products', {
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        stock: parseInt(product.stock)
      });

      alert('Product added successfully!');
      // Reset form
      setProduct({ name: '', description: '', price: '', stock: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add product');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Product Name"
        value={product.name}
        onChange={(e) => setProduct({ ...product, name: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        value={product.description}
        onChange={(e) => setProduct({ ...product, description: e.target.value })}
      />
      <input
        type="number"
        placeholder="Price"
        step="0.01"
        value={product.price}
        onChange={(e) => setProduct({ ...product, price: e.target.value })}
        required
      />
      <input
        type="number"
        placeholder="Stock"
        value={product.stock}
        onChange={(e) => setProduct({ ...product, stock: e.target.value })}
        required
      />
      <button type="submit">Add Product</button>
    </form>
  );
}

export default AddProduct;
```

### 2. Get Seller Products

**Component: `SellerProducts.jsx`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data.products);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, newStock) => {
    try {
      await api.patch(`/products/${productId}/stock`, {
        stock: parseInt(newStock)
      });
      alert('Stock updated!');
      fetchProducts(); // Refresh list
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure?')) return;

    try {
      await api.delete(`/products/${productId}`);
      alert('Product deleted!');
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="products-list">
      <h2>My Products</h2>
      {products.map((product) => (
        <div key={product.id} className="product-item">
          <h3>{product.name}</h3>
          <p>Price: ₹{product.price}</p>
          <p>Stock: {product.stock}</p>
          <p>Status: {product.isActive ? 'Active' : 'Inactive'}</p>

          <input
            type="number"
            defaultValue={product.stock}
            onBlur={(e) => updateStock(product.id, e.target.value)}
          />

          <button onClick={() => deleteProduct(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default SellerProducts;
```

---

## Shopping Flow

### 1. Browse Products (Public)

**Component: `ProductList.jsx`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/all', {
        params: { search, page, limit: 12 }
      });
      setProducts(response.data.data.products);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-list">
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const addToCart = async () => {
    try {
      await api.post('/cart', {
        productId: product.id,
        quantity: 1
      });
      alert('Added to cart!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p className="price">₹{product.price}</p>
      <p>Stock: {product.stock}</p>
      <button onClick={addToCart} disabled={product.stock === 0}>
        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
}

export default ProductList;
```

### 2. Shopping Cart

**Component: `Cart.jsx`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      setCart(response.data.data.cart);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      await api.patch(`/cart/${cartItemId}`, {
        quantity: parseInt(newQuantity)
      });
      fetchCart(); // Refresh cart
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      fetchCart();
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  const clearCart = async () => {
    if (!confirm('Clear entire cart?')) return;

    try {
      await api.delete('/cart');
      setCart([]);
    } catch (err) {
      alert('Failed to clear cart');
    }
  };

  const total = cart.reduce((sum, item) =>
    sum + (item.product.price * item.quantity), 0
  );

  if (loading) return <p>Loading cart...</p>;

  if (cart.length === 0) {
    return <p>Your cart is empty</p>;
  }

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>

      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <h3>{item.product.name}</h3>
          <p>Price: ₹{item.product.price}</p>

          <select
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, e.target.value)}
          >
            {[...Array(Math.min(item.product.stock, 10))].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>

          <p>Subtotal: ₹{item.product.price * item.quantity}</p>

          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}

      <div className="cart-summary">
        <h3>Total: ₹{total.toFixed(2)}</h3>
        <button onClick={clearCart}>Clear Cart</button>
        <button onClick={() => window.location.href = '/checkout'}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default Cart;
```

### 3. Available Coupons

**Component: `Coupons.jsx`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

function Coupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      // Get user-specific available coupons
      const response = await api.get('/coupons/user/available');
      setCoupons(response.data.data.coupons);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    }
  };

  return (
    <div className="coupons">
      <h2>Available Coupons</h2>
      {coupons.map((coupon) => (
        <div key={coupon.id} className="coupon-card">
          <h3>{coupon.code}</h3>
          <p>
            {coupon.discountType === 'PERCENTAGE'
              ? `${coupon.discountValue}% OFF`
              : `₹${coupon.discountValue} OFF`}
          </p>
          {coupon.minPurchase && (
            <p>Min purchase: ₹{coupon.minPurchase}</p>
          )}
          {coupon.maxDiscount && (
            <p>Max discount: ₹{coupon.maxDiscount}</p>
          )}
          <p>
            Valid until: {new Date(coupon.validTo).toLocaleDateString()}
          </p>
          {coupon.usageLimitPerUser && (
            <p>
              Remaining uses: {coupon.remainingUsesForUser}
            </p>
          )}
          <button onClick={() => navigator.clipboard.writeText(coupon.code)}>
            Copy Code
          </button>
        </div>
      ))}
    </div>
  );
}

export default Coupons;
```

---

## Payment Integration

### 1. Checkout Flow

**Component: `Checkout.jsx`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';
import useRazorpay from 'react-razorpay';

function Checkout() {
  const [Razorpay] = useRazorpay();
  const [couponCode, setCouponCode] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [walletPoints, setWalletPoints] = useState(0);
  const [orderPreview, setOrderPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWalletPoints();
  }, []);

  const fetchWalletPoints = async () => {
    try {
      const response = await api.get('/users/wallet');
      setWalletPoints(response.data.data.walletPoints);
    } catch (err) {
      console.error('Failed to fetch wallet points');
    }
  };

  // Calculate order with discounts
  const calculateOrder = async () => {
    setLoading(true);
    try {
      const response = await api.post('/orders/calculate', {
        couponCode: couponCode || undefined,
        useWalletPoints: useWallet,
        walletPointsToUse: useWallet ? walletPoints : 0
      });
      setOrderPreview(response.data.data.breakdown);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to calculate order');
    } finally {
      setLoading(false);
    }
  };

  // Place order and initiate payment
  const handleCheckout = async () => {
    setLoading(true);

    try {
      // Step 1: Place order (creates PENDING order, stock deducted)
      const orderResponse = await api.post('/orders', {
        couponCode: couponCode || undefined,
        useWalletPoints: useWallet,
        walletPointsToUse: useWallet ? walletPoints : 0
      });

      const { orderId, finalAmount } = orderResponse.data.data.order;

      // Step 2: Initiate Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: finalAmount * 100, // Convert to paise
        currency: 'INR',
        name: 'My E-Commerce Store',
        description: `Order #${orderId}`,
        order_id: orderId,

        // Payment success callback
        handler: async function (response) {
          try {
            // Update payment status to SUCCESS
            await api.patch(`/orders/${orderId}/payment`, {
              paymentStatus: 'SUCCESS'
            });

            alert('Payment successful! Order confirmed.');
            window.location.href = '/orders';
          } catch (err) {
            alert('Payment succeeded but failed to update order status');
          }
        },

        // Payment modal dismissed/cancelled
        modal: {
          ondismiss: async function () {
            try {
              // Update payment status to FAILED (triggers rollback)
              await api.patch(`/orders/${orderId}/payment`, {
                paymentStatus: 'FAILED'
              });

              alert('Payment cancelled. Stock and wallet points restored.');
            } catch (err) {
              console.error('Failed to update payment status');
            }
          }
        },

        theme: {
          color: '#3399cc'
        }
      };

      const razorpay = new Razorpay(options);
      razorpay.open();

    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>

      {/* Coupon Input */}
      <div className="coupon-section">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        />
      </div>

      {/* Wallet Points */}
      <div className="wallet-section">
        <label>
          <input
            type="checkbox"
            checked={useWallet}
            onChange={(e) => setUseWallet(e.target.checked)}
          />
          Use wallet points (₹{walletPoints} available)
        </label>
      </div>

      {/* Calculate Button */}
      <button onClick={calculateOrder} disabled={loading}>
        Calculate Total
      </button>

      {/* Order Preview */}
      {orderPreview && (
        <div className="order-preview">
          <h3>Order Summary</h3>
          <p>Subtotal: ₹{orderPreview.subtotal}</p>
          {orderPreview.couponDiscount > 0 && (
            <p className="discount">
              Coupon Discount: -₹{orderPreview.couponDiscount}
            </p>
          )}
          {orderPreview.walletPointsUsed > 0 && (
            <p className="discount">
              Wallet Points Used: -₹{orderPreview.walletPointsUsed}
            </p>
          )}
          <h3>Final Amount: ₹{orderPreview.finalAmount}</h3>

          <button onClick={handleCheckout} disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Checkout;
```

### 2. Order History

**Component: `Orders.jsx`**
```javascript
import { useState, useEffect } from 'react';
import api from '../utils/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState(''); // PENDING, CONFIRMED, etc.

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/orders', { params });
      setOrders(response.data.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  const getOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      console.log('Order details:', response.data.data.order);
      // Show in modal or navigate to details page
    } catch (err) {
      alert('Failed to fetch order details');
    }
  };

  return (
    <div className="orders">
      <h2>My Orders</h2>

      {/* Filter */}
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All Orders</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      {/* Orders List */}
      {orders.map((order) => (
        <div key={order.id} className="order-item">
          <h3>Order #{order.id.slice(0, 8)}</h3>
          <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          <p>Total: ₹{order.totalAmount}</p>
          {order.couponDiscount > 0 && (
            <p>Discount: -₹{order.couponDiscount}</p>
          )}
          <p>Final Amount: ₹{order.finalAmount}</p>
          <p>Payment: {order.paymentStatus}</p>
          <p>Status: {order.orderStatus}</p>

          <button onClick={() => getOrderDetails(order.id)}>
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}

export default Orders;
```

---

## Error Handling

### Global Error Handler

**Component: `ErrorBoundary.jsx`**
```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### API Error Handler Utility

**`utils/errorHandler.js`**
```javascript
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || 'An error occurred';
    const status = error.response.status;

    switch (status) {
      case 400:
        return { message: `Bad Request: ${message}`, type: 'warning' };
      case 401:
        localStorage.removeItem('token');
        window.location.href = '/login';
        return { message: 'Session expired. Please login again.', type: 'error' };
      case 403:
        return { message: 'You do not have permission to perform this action.', type: 'error' };
      case 404:
        return { message: 'Resource not found.', type: 'warning' };
      case 409:
        return { message: message, type: 'warning' };
      case 500:
        return { message: 'Server error. Please try again later.', type: 'error' };
      default:
        return { message: message, type: 'error' };
    }
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'Network error. Please check your connection.',
      type: 'error'
    };
  } else {
    // Something else happened
    return { message: error.message, type: 'error' };
  }
};
```

**Usage:**
```javascript
import { handleApiError } from '../utils/errorHandler';

try {
  await api.post('/cart', { productId, quantity });
} catch (err) {
  const { message, type } = handleApiError(err);
  showNotification(message, type); // Your notification system
}
```

---

## Complete Flow Example

### User Shopping Journey

```javascript
// 1. User browses products
<ProductList />
  ↓
// 2. Adds items to cart
POST /api/cart { productId, quantity }
  ↓
// 3. Views cart
GET /api/cart
  ↓
// 4. Views available coupons
GET /api/coupons/user/available
  ↓
// 5. Goes to checkout, applies coupon
POST /api/orders/calculate { couponCode, useWalletPoints }
  ↓
// 6. Places order (stock deducted, status: PENDING)
POST /api/orders { couponCode, useWalletPoints }
  ↓
// 7. Razorpay payment modal opens
  ↓
// 8a. Payment SUCCESS
PATCH /api/orders/:id/payment { paymentStatus: "SUCCESS" }
// Order confirmed, redirect to /orders
  ↓
// 8b. Payment FAILED
PATCH /api/orders/:id/payment { paymentStatus: "FAILED" }
// Stock restored, wallet restored, coupon restored
  ↓
// 9. View order history
GET /api/orders
GET /api/orders/:id (for details)
```

---

## Testing

### Sample Test Data

```javascript
// User credentials
{
  email: "test@example.com",
  password: "password123",
  name: "Test User"
}

// Seller credentials
{
  email: "seller@example.com",
  password: "password123",
  name: "Test Seller",
  shopName: "My Shop"
}

// Product data
{
  name: "iPhone 15 Pro",
  description: "Latest Apple smartphone",
  price: 999.99,
  stock: 50
}

// Coupon code (auto-created on first user registration)
"WELCOME10"
```

---

## Summary

**Key Points:**
1. Use axios interceptors for automatic token injection
2. Handle 401 errors globally to redirect to login
3. Store JWT token in localStorage
4. Frontend handles Razorpay integration, backend updates status
5. Always show loading states and error messages
6. Use try-catch for all API calls
7. Validate user input before sending to API
8. Clear cart after successful order
9. Refresh data after mutations (add, update, delete)

Your API is ready for integration! All endpoints follow RESTful conventions and return consistent JSON responses.
