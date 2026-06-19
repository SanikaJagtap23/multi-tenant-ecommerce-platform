# Project Report
## Multi-Tenant E-Commerce Platform (SaaS)

**Developer:** Prajval
**Organization:** Zaalima Development Pvt. Ltd.
**Date:** June 2026
**Duration:** 4 Weeks

---

## 1. Introduction

This project is a **Software-as-a-Service (SaaS) E-Commerce Platform** that allows multiple vendors to create and run their own online stores on a shared platform. Customers can browse all stores, add products to their cart, and place orders with real-time tracking. A super admin has complete oversight of the entire platform.

The platform follows a **multi-tenant architecture** where each vendor (tenant) operates independently within the same system — their store, products, orders, and analytics are isolated from other vendors.

---

## 2. Objectives

- Build a production-ready multi-tenant e-commerce platform using the MERN stack
- Implement role-based access control for three distinct user types: Customer, Vendor, and Super Admin
- Provide vendors with a complete business dashboard including analytics, stock management, and coupon tools
- Implement two payment methods: Cash on Delivery and Stripe online payment
- Follow software engineering best practices including modular code structure, JWT authentication, error handling middleware, and automated testing

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│         React 19 + Redux Toolkit + Tailwind CSS       │
│                   Port: 5173 (Vite)                  │
└─────────────────────┬───────────────────────────────┘
                      │  HTTP / Axios (JWT in header)
┌─────────────────────▼───────────────────────────────┐
│                 REST API SERVER                      │
│         Node.js + Express 5 + Helmet + CORS          │
│                   Port: 5000                         │
│                                                      │
│  Routes: /api/auth  /api/stores  /api/products       │
│          /api/orders  /api/payments  /api/admin      │
│          /api/wishlist  /api/coupons                 │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
┌──────────▼──────┐    ┌──────────▼──────────────────┐
│    MongoDB       │    │   External Services          │
│  (Mongoose ORM)  │    │  - Stripe (payments)         │
│  Port: 27017     │    │  - Cloudinary (images)       │
│                  │    │  - Nodemailer (email)        │
└──────────────────┘    └─────────────────────────────┘
```

### Request Flow
1. User interacts with React frontend
2. Redux action dispatches API call via Axios (with JWT token in Authorization header)
3. Express middleware validates JWT and checks user role
4. Controller processes business logic and queries MongoDB
5. Response sent back; Redux updates state; UI re-renders

---

## 4. Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | v20.17 | Runtime environment |
| Express | v5.2 | Web framework |
| MongoDB | Latest | NoSQL database |
| Mongoose | v8.24 | ODM (Object Document Mapper) |
| jsonwebtoken | v9 | JWT authentication |
| bcryptjs | v3 | Password hashing |
| Stripe | v22 | Online payment processing |
| Cloudinary | v2 | Cloud image storage |
| Multer | v1.4 | File upload handling |
| Nodemailer | v8 | Email sending |
| Helmet | v8 | HTTP security headers |
| Jest + Supertest | v29 / v7 | Backend testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | v19.2 | UI library |
| Vite | v5.4 | Build tool and dev server |
| Redux Toolkit | v2.12 | State management |
| React Router DOM | v7.16 | Client-side routing |
| Tailwind CSS | v3.4 | Utility-first CSS framework |
| Axios | v1.16 | HTTP client |
| Recharts | v3.8 | Data visualization / charts |
| @stripe/react-stripe-js | v6.6 | Stripe payment UI |
| react-hot-toast | v2.6 | Toast notifications |
| react-icons | v5.6 | Icon library |
| Vitest + Testing Library | v4 / v16 | Frontend testing |

---

## 5. Database Design

### User Schema
```
User {
  name, email, password (bcrypt hashed),
  role: [customer | vendor | superadmin],
  isActive, avatar, phone,
  wishlist: [Product refs],
  addresses: [{ label, fullName, street, city, state, postalCode, country }]
}
```

### Store Schema
```
Store {
  name, description, logo (Cloudinary URL),
  owner: User ref,
  category, isActive,
  address, contactEmail, contactPhone
}
```

### Product Schema
```
Product {
  name, description,
  price, comparePrice,
  images: [Cloudinary URLs],
  category, stock, sku,
  store: Store ref,
  vendor: User ref,
  isActive,
  variants: [{ name, options[] }]
}
```

### Order Schema
```
Order {
  customer: User ref,
  store: Store ref,
  vendor: User ref,
  items: [{ product, name, quantity, price, image }],
  subtotal, shippingCost, tax, totalAmount,
  status: [payment_pending | pending | confirmed | shipped | delivered | cancelled],
  paymentStatus: [unpaid | paid | failed | refunded],
  paymentMethod: [cod | card],
  shippingAddress: { fullName, phone, street, city, state, postalCode },
  couponCode, couponDiscount,
  stripePaymentId
}
```

### Coupon Schema
```
Coupon {
  code, store: Store ref,
  discountType: [percentage | fixed],
  discountValue, minOrderAmount,
  usageLimit, usageCount,
  isActive, expiresAt
}
```

### Payment Schema
```
Payment {
  order: Order ref,
  customer: User ref,
  stripePaymentIntentId, amount, currency,
  status: [pending | paid | failed | refunded]
}
```

---

## 6. API Design

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /register | Public | Register as customer or vendor |
| POST | /login | Public | Login, receive JWT |
| GET | /profile | Protected | Get current user profile |
| PUT | /profile | Protected | Update profile |

### Stores (`/api/stores`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Public | List all active stores |
| GET | /:id | Public | Get store details |
| POST | / | Vendor | Create store |
| PUT | /:id | Vendor (owner) | Update store |
| GET | /my-store | Vendor | Get own store |

### Products (`/api/products`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Public | List products (filterable) |
| GET | /:id | Public | Product detail |
| POST | / | Vendor | Create product with images |
| PUT | /:id | Vendor (owner) | Edit product |
| DELETE | /:id | Vendor (owner) | Delete product |
| PATCH | /:id/stock | Vendor | Update stock only |

### Orders (`/api/orders`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | / | Customer | Place an order |
| GET | /my-orders | Customer | Own order history |
| GET | /vendor-orders | Vendor | Orders for vendor's store |
| PATCH | /:id/status | Vendor | Update order status |
| GET | /admin/all | Admin | All orders on platform |

### Payments (`/api/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /create-intent | Customer | Create Stripe PaymentIntent |
| POST | /webhook | Stripe | Handle Stripe events |

### Admin (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /users | Admin | All users |
| PATCH | /users/:id | Admin | Update user (role/status) |
| GET | /stores | Admin | All stores |
| GET | /orders | Admin | All orders |
| GET | /analytics | Admin | Platform KPIs and charts |

---

## 7. Key Features — Implementation Details

### Multi-Tenancy
Each vendor can have only one store. All products and orders are associated with both a `store` and a `vendor`. This ensures data isolation — vendors only see their own data.

### Role-Based Access Control
Three middleware functions are used:
- `protect` — validates the JWT token and attaches the user to `req.user`
- `authorize(...roles)` — checks that `req.user.role` is in the allowed roles list
- Applied at route level: `router.get('/vendor-orders', protect, authorize('vendor'), ...)`

### Cart (Frontend)
- Stored in `localStorage` for persistence across sessions
- Enforces single-store rule: adding a product from a different store prompts the user to clear the cart
- Calculates subtotal, 10% tax, and free shipping over ₹500

### Checkout Flow (3 Steps)
1. **Address** — select saved address or enter new one
2. **Payment** — choose COD or Card (Stripe Elements)
3. **Confirmation** — order placed, cart cleared, order ID shown

### Stripe Integration
- Frontend uses `@stripe/react-stripe-js` to render a secure card input
- Backend creates a `PaymentIntent` via Stripe API
- Stripe webhook at `/api/payments/webhook` handles `payment_intent.succeeded` and `payment_intent.payment_failed` events
- Webhook requires raw body (mounted before `express.json()`)

### Vendor Analytics
Charts built with Recharts:
- **Revenue Line Chart** — daily revenue over last 30 days
- **Orders Pie Chart** — orders grouped by status
- **Top Products Bar Chart** — products by revenue

### Stock Management
- Vendors can view all product stock levels in a bar chart
- Low-stock alerts shown for products with stock ≤ 10
- Inline stock editing without leaving the page
- Stock auto-decrements when an order is placed
- Stock auto-restores when an order is cancelled

### Coupon System
- Vendors create coupons (percentage or fixed discount) scoped to their store
- Customers enter coupon code at checkout; validated against store, expiry, and usage limit
- Usage count increments on successful order placement

---

## 8. Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs with salt rounds = 10 |
| JWT authentication | Signed token, 7-day expiry, verified on every protected route |
| Role enforcement | Middleware-level role checks on every sensitive route |
| HTTP security headers | Helmet middleware (XSS protection, content-type sniffing, etc.) |
| CORS | Restricted to `CLIENT_URL` only |
| Stripe webhook verification | Signature verified with `stripe.webhooks.constructEvent` |
| Self-registration as admin | Blocked at API level in authController |
| Password not returned | Mongoose `select: false` on password field |

---

## 9. Testing

### Backend Tests (`backend/__tests__/`)
| Test File | Coverage |
|---|---|
| `auth.test.js` | Register, login, profile endpoints |
| `middleware.test.js` | JWT protect, role authorization |
| `store.test.js` | Create store, vendor ownership |
| `product.test.js` | CRUD operations, stock updates |
| `order.test.js` | Place order, status transitions |

- Uses `mongodb-memory-server` for an in-memory MongoDB — no real database needed for tests
- Run with: `npm test`

### Frontend Tests
- Redux slice tests for `authSlice` and `cartSlice`
- Uses Vitest + Testing Library
- Run with: `npm test`

---

## 10. Challenges and Learnings

### Challenge 1: Stripe Webhook Raw Body
**Problem:** Stripe signature verification failed because `express.json()` parses the body before the webhook can read the raw bytes.
**Solution:** Mounted the Stripe webhook route with `express.raw()` before `express.json()` in `app.js`.

### Challenge 2: Single-Store Cart Enforcement
**Problem:** Allowing products from multiple stores in one cart breaks the order model (orders are per-store).
**Solution:** Cart slice checks the `storeId` on every `addToCart` action; if it differs from the current cart's store, it prompts the user to clear and start fresh.

### Challenge 3: Redux State and Page Refresh
**Problem:** User login state was lost on page refresh.
**Solution:** JWT token stored in `localStorage`; Redux auth slice initializes from `localStorage` on app load.

### Challenge 4: Vite and Node Version Compatibility
**Problem:** Vite 8 uses Rolldown and is incompatible with Node.js v20.
**Solution:** Pinned to Vite 5.x which supports Node.js v20 without issues.

### Challenge 5: Image Upload with Cloudinary
**Problem:** Multer handles file buffering but Cloudinary upload is async.
**Solution:** Used a custom multer storage engine with Cloudinary's upload stream, converting the buffer to a stream with `stream.PassThrough()`.

---

## 11. Project Timeline

| Week | Deliverables |
|---|---|
| Week 1 | Project setup, MongoDB models (User, Store, Product, Order), JWT authentication, role-based middleware |
| Week 2 | Backend APIs for stores, products, orders. Frontend: React + Redux setup, auth pages, vendor dashboard, product management |
| Week 3 | Customer shopping flow (Browse → Cart → Checkout → Order Confirmation), Stripe payment integration, order tracking |
| Week 4 | Vendor analytics (Recharts), stock management, coupon system, wishlist, admin dashboard and analytics, frontend tests |

---

## 12. Future Scope

| Feature | Description |
|---|---|
| Deployment | Frontend on Vercel, Backend on Render or AWS EC2, MongoDB Atlas |
| Email notifications | Order confirmation and status update emails via Nodemailer |
| Product reviews & ratings | Customer review system per product |
| Advanced search | Elasticsearch or MongoDB Atlas Search for full-text product search |
| Real-time notifications | WebSockets or Server-Sent Events for order status updates |
| Mobile app | React Native app using the same REST API |
| Subscription billing | SaaS billing for vendors (monthly plans via Stripe Subscriptions) |

---

## 13. Conclusion

This project successfully demonstrates a complete multi-tenant SaaS e-commerce system built with the MERN stack. All planned features across 4 weeks were implemented: authentication, multi-tenant store isolation, the complete customer shopping flow, vendor business tools (analytics, stock, coupons), Stripe payment integration, and platform-wide admin management. The project follows industry practices including JWT-based stateless auth, role-based access control, environment-based configuration, and automated testing.

---
