# Multi-Tenant E-Commerce Platform (SaaS)

A full-stack SaaS e-commerce platform where multiple vendors can open and manage their own online stores under a single platform, with a unified shopping experience for customers and complete oversight for the super admin.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 5, Redux Toolkit, React Router DOM v7, Tailwind CSS v3, Recharts |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Authentication | JWT (JSON Web Tokens), bcryptjs |
| Payments | Stripe (card), Cash on Delivery (COD) |
| Image Upload | Cloudinary + Multer |
| Email | Nodemailer |
| Testing | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
| Security | Helmet, CORS, role-based access control |

---

## User Roles

| Role | Description |
|---|---|
| **Customer** | Browses stores, adds products to cart, places orders, tracks orders, manages wishlist |
| **Vendor** | Creates and manages their store, products, stock, coupons, and orders |
| **Super Admin** | Full platform oversight — manages all users, stores, products, orders, and analytics |

---

## Features

### Customer
- Browse all stores and products
- Product detail page with images, price, stock status
- Shopping cart (localStorage-persisted, single-store enforcement)
- 3-step checkout: Address → Payment → Confirmation
- Payment via COD or Stripe card payment
- Coupon code support at checkout
- Order history with real-time status tracking
- Wishlist management
- User profile with saved addresses

### Vendor
- Vendor dashboard with revenue, order stats, and recent activity
- Create and manage store (name, logo, category, contact info)
- Add, edit, and delete products with images, variants, and SKU
- Stock management with low-stock alerts and inline editing
- Order management (pending → confirmed → shipped → delivered / cancelled)
- Vendor analytics: revenue chart (30 days), orders by status, top products
- Coupon management (create, toggle, delete discount codes)
- Detailed order view per order

### Super Admin
- Admin dashboard with platform-wide KPIs
- Manage all users (activate/deactivate, change roles)
- Manage all stores (activate/deactivate)
- Manage all products across the platform
- Manage all orders with status control
- Platform analytics: revenue, top stores, orders by status

---

## Database Models

| Model | Key Fields |
|---|---|
| **User** | name, email, password (hashed), role, isActive, wishlist[], addresses[] |
| **Store** | name, description, logo, owner (ref: User), category, isActive |
| **Product** | name, price, comparePrice, images[], category, stock, store, vendor, variants[] |
| **Order** | customer, store, vendor, items[], subtotal, tax, shippingCost, totalAmount, status, paymentMethod, paymentStatus |
| **Payment** | order, customer, stripePaymentIntentId, amount, status |
| **Coupon** | code, discountType, discountValue, store, minOrderAmount, usageLimit, expiresAt |

---

## API Endpoints

| Route Prefix | Description |
|---|---|
| `POST /api/auth/register` | Register customer or vendor |
| `POST /api/auth/login` | Login (all roles) |
| `GET /api/stores` | List all active stores |
| `GET /api/products` | List products (with filters) |
| `POST /api/orders` | Place an order |
| `GET /api/orders/my-orders` | Customer order history |
| `PATCH /api/orders/:id/status` | Vendor updates order status |
| `POST /api/payments/create-intent` | Create Stripe payment intent |
| `POST /api/payments/webhook` | Stripe webhook handler |
| `GET /api/wishlist` | Get customer wishlist |
| `POST /api/coupons/validate` | Validate a coupon code |
| `GET /api/admin/users` | Admin: all users |
| `GET /api/admin/analytics` | Admin: platform analytics |

---

## Project Structure

```
├── backend/
│   ├── config/          # DB and Cloudinary config
│   ├── controllers/     # Business logic
│   ├── middleware/       # Auth, role, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── utils/           # JWT generator
│   ├── __tests__/       # Jest test suites
│   ├── app.js           # Express app setup
│   └── server.js        # Entry point (port 5000)
│
└── frontend/
    └── src/
        ├── app/             # Redux store
        ├── api/             # Axios instance with JWT interceptor
        ├── features/        # Redux slices (auth, store, product, cart, order, etc.)
        ├── components/      # Navbar, Sidebar, Spinner, ProtectedRoute, Skeletons
        └── pages/
            ├── admin/       # AdminDashboard, Analytics, Users, Stores, Products, Orders
            ├── vendor/      # VendorDashboard, ManageStore, ManageProducts, Analytics, Stock, Orders, Coupons
            └── customer/    # HomePage, StorePage, ProductDetail, Cart, Checkout, Orders, Wishlist, Profile
```

---

## Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/multi_tenant_ecommerce
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional
CLOUDINARY_CLOUD_NAME=...
STRIPE_SECRET_KEY=sk_test_...
EMAIL_USER=...
```

### 3. Seed demo data

```bash
cd backend
node seedData.js
```

### 4. Run the application

```bash
# Backend (Terminal 1)
cd backend
npm run dev        # Runs on http://localhost:5000

# Frontend (Terminal 2)
cd frontend
npm run dev        # Runs on http://localhost:5173
```

### 5. Run tests

```bash
cd backend && npm test
cd frontend && npm test
```

---

## Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@platform.com | admin123 |
| Vendor | vendor@store.com | vendor123 |
| Customer | customer@test.com | customer123 |

> Check `backend/seedData.js` for exact credentials used.

---

## Key Technical Decisions

- **Multi-tenancy via Store model**: Each vendor owns one store; all products and orders are scoped to a store
- **Single-store cart enforcement**: Customers cannot mix products from different stores in one cart
- **JWT-based auth**: Stateless authentication with role claims embedded in the token
- **Stripe webhook**: Raw body parsed before `express.json()` to pass Stripe signature verification
- **Stock auto-restore**: When a vendor cancels an order, stock quantities are automatically restored

---

## Developed By

Sanika — Internship Project, Zaalima Development Pvt. Ltd., 2026
