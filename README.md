# ServeSync - Restaurant Order Management System

A production-grade backend API for managing restaurant operations, including authentication, menu management, and real-time order processing.

## 📖 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Testing](#testing)
- [Roadmap](#roadmap)

---

## 🎯 Overview

ServeSync is a full-stack restaurant management system designed to streamline operations from order placement to delivery. The backend API handles:
- **User authentication** with JWT and password recovery
- **Restaurant management** with role-based access control (RBAC)
- **Menu management** for dynamic item catalogs
- **Order processing** (upcoming)
- **Real-time updates** via WebSockets (upcoming)
- **Payment integration** with Stripe/PayPal (upcoming)
- **Delivery tracking** with Google Maps (upcoming)

---

## 🏗️ Architecture

### Design Pattern: Layered Architecture
We use a **Controller-Service-Repository** pattern for clean separation of concerns:

```
┌─────────────┐
│   Routes    │ → Define API endpoints
└──────┬──────┘
       │
┌──────▼──────┐
│ Controllers │ → Validate input (Zod), handle HTTP
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │ → Business logic
└──────┬──────┘
       │
┌──────▼──────┐
│   Prisma    │ → Database access (ORM)
└─────────────┘
```

### Why This Architecture?

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Services can be tested independently
3. **Maintainability**: Changes in one layer don't cascade
4. **Scalability**: Easy to add new features or swap components

---

## ✨ Features

### Phase 1: Completed ✅
- [x] JWT-based authentication
- [x] User registration & login
- [x] Password reset flow (token-based)
- [x] Role-based access control (RBAC)
- [x] Restaurant CRUD operations
- [x] Menu item management
- [x] Ownership validation
- [x] Input validation with Zod

### Phase 2: Completed ✅
- [x] Order placement with cart validation
- [x] Server-side price calculation (security)
- [x] Order history for customers
- [x] Kitchen order dashboard
- [x] Order status workflow (PENDING → DELIVERED)
- [x] Status transition validation
- [x] Order cancellation with permissions

### Phase 3: Planned 🔜
- [ ] Order placement & tracking
- [ ] Real-time Kitchen Display System (WebSockets)
- [ ] Payment processing (Stripe)
- [ ] Delivery management
- [ ] Analytics dashboard

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js + TypeScript | Type-safe JavaScript execution |
| **Framework** | Express.js | HTTP server & routing |
| **Database** | PostgreSQL | Relational data storage |
| **ORM** | Prisma 7 | Type-safe database queries |
| **Authentication** | JWT (jsonwebtoken) | Stateless auth tokens |
| **Password** | bcrypt | Secure password hashing |
| **Validation** | Zod | Schema validation |
| **Email** | Stub (future: Nodemailer) | Password reset emails |

---

## 📁 Project Structure

```
ServeSync/
├── prisma/
│   ├── schema.prisma          # Database schema (users, restaurants, menus, orders)
│   └── migrations/            # Database migration history
├── src/
│   ├── config/
│   │   └── prisma.ts         # Singleton Prisma Client with adapter
│   ├── controllers/
│   │   ├── auth.controller.ts      # Auth endpoints (register, login, reset)
│   │   ├── restaurant.controller.ts # Restaurant CRUD
│   │   ├── menu.controller.ts      # Menu CRUD
│   │   └── order.controller.ts     # Order processing
│   ├── middlewares/
│   │   └── auth.middleware.ts      # JWT verification & RBAC
│   ├── routes/
│   │   ├── auth.routes.ts          # /auth/* endpoints
│   │   ├── restaurant.routes.ts    # /restaurants/* endpoints
│   │   └── order.routes.ts         # /orders/* endpoints
│   ├── services/
│   │   ├── auth.service.ts         # Auth business logic
│   │   ├── restaurant.service.ts   # Restaurant business logic
│   │   ├── menu.service.ts         # Menu business logic
│   │   ├── order.service.ts        # Order processing logic
│   │   └── email.service.ts        # Email sending (stub)
│   ├── utils/
│   │   ├── jwt.ts                  # Token generation/verification
│   │   └── password.ts             # Password hashing/comparison
│   └── index.ts                    # Express app entry point
├── scripts/
│   ├── test-auth.ts               # Auth flow verification
│   ├── test-forgot-password.ts    # Password reset verification
│   ├── test-restaurants.ts        # Restaurant CRUD + RBAC verification
│   └── test-orders.ts             # Order processing verification
├── .env                           # Environment variables
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

---

## 🔍 How It Works

### 1. Authentication Flow

#### Registration
```typescript
POST /auth/register
{
  "email": "chef@example.com",
  "password": "secure123",
  "name": "Chef Gordon",
  "role": "KITCHEN"  // Optional: CUSTOMER (default) | KITCHEN
}
```

**What happens:**
1. Controller validates input with Zod schema
2. Service checks if user exists
3. Password is hashed using bcrypt (10 rounds)
4. User is created in database
5. JWT token is generated (contains `userId` and `role`)
6. Token is returned to client

**Why it works this way:**
- **Bcrypt**: Slow hashing prevents brute-force attacks
- **JWT**: Stateless tokens eliminate server-side session storage
- **Role in token**: Enables fast RBAC without DB queries

#### Login
```typescript
POST /auth/login
{
  "email": "chef@example.com",
  "password": "secure123"
}
```

**What happens:**
1. Service finds user by email
2. Password is compared using bcrypt
3. JWT token is generated if valid
4. Token is returned

#### Password Reset
```typescript
// Step 1: Request reset
POST /auth/forgot-password
{ "email": "chef@example.com" }

// Step 2: Reset with token
POST /auth/reset-password
{
  "token": "abc123...",
  "password": "newPassword"
}
```

**What happens:**
1. Service generates random reset token (crypto.randomBytes)
2. Token + expiry (1 hour) saved to user record
3. Email sent with reset link (currently logs to console)
4. Token is verified against DB and expiry checked
5. Password is hashed and updated

**Security note:** The forgot-password endpoint returns success even if email doesn't exist (prevents user enumeration).

---

### 2. Role-Based Access Control (RBAC)

#### Roles
- **CUSTOMER**: Can browse restaurants/menus, place orders
- **KITCHEN**: Can create/manage restaurants, update order status
- **ADMIN**: Full system access (future)

#### How Authorization Works

```typescript
// Route definition
router.post('/restaurants', 
  authenticate,                    // Step 1: Verify JWT
  authorize(['KITCHEN', 'ADMIN']), // Step 2: Check role
  RestaurantController.create      // Step 3: Execute
);
```

**Step 1: `authenticate` middleware**
```typescript
1. Extract token from Authorization: Bearer <token>
2. Verify token signature using JWT_SECRET
3. Decode payload: { userId, role }
4. Attach payload to req.user
5. Call next()
```

**Step 2: `authorize` middleware**
```typescript
1. Check if req.user.role is in allowed roles array
2. If yes: call next()
3. If no: return 403 Forbidden
```

**Why it works this way:**
- **Middleware chain**: Reusable, composable security
- **Token payload**: Role embedded in JWT for fast checks
- **Fail-fast**: Unauthorized users blocked before hitting business logic

---

### 3. Restaurant Management

#### Create Restaurant
```typescript
POST /restaurants
Authorization: Bearer <token>
{
  "name": "Tasty Bytes",
  "address": "123 Main St",
  "phone": "555-0123"
}
```

**What happens:**
1. `authenticate` verifies token
2. `authorize` checks if user is KITCHEN/ADMIN
3. Controller validates input (Zod)
4. Service checks if user already owns a restaurant (1 per user)
5. Restaurant is created, linked to `userId`
6. Restaurant data is returned

**Business rule:** One restaurant per user (enforced by unique `userId` in schema and service check).

#### Update Restaurant
```typescript
PUT /restaurants/:id
Authorization: Bearer <token>
{
  "name": "Tasty Bytes Updated"
}
```

**What happens:**
1. RBAC checks role
2. Service verifies restaurant exists
3. **Ownership check**: Service compares `restaurant.userId` with `req.user.userId`
4. Update is performed if owner matches
5. Updated data is returned

**Why ownership matters:** RBAC checks *role*, services check *ownership*. Both are required for security.

---

### 4. Menu Management

#### Add Menu Item
```typescript
POST /restaurants/:restaurantId/menu
Authorization: Bearer <token>
{
  "name": "Binary Burger",
  "price": 12.99,
  "category": "Mains",
  "description": "A delicious burger..."
}
```

**What happens:**
1. RBAC checks role
2. Service fetches restaurant by ID
3. **Ownership check**: Verifies user owns the restaurant
4. Menu item is created, linked to restaurant
5. Item data is returned

---

### 5. Order Processing

#### Place an Order
```typescript
POST /orders
Authorization: Bearer <token>
{
  "restaurantId": "cm1...",
  "items": [
    { "menuItemId": "cm2...", "quantity": 2 },
    { "menuItemId": "cm3...", "quantity": 1 }
  ],
  "notes": "Extra ketchup please"
}
```

**What happens:**
1. Controller validates input (Zod schema)
2. Service validates restaurant exists
3. Service fetches all menu items from DB
4. **Validates all items belong to the same restaurant**
5. **Validates all items are available**
6. **Calculates total from DB prices** (never trusts client)
7. Creates Order + OrderItems in a transaction
8. Returns order with items and total

**Why server-side calculation matters:**
```typescript
// ❌ BAD: Trusting client
{ total: 9999.99 } // Client could send any value!

// ✅ GOOD: Server calculates
const total = items.reduce((sum, item) => {
  const menuItem = dbItems.find(mi => mi.id === item.menuItemId);
  return sum + (menuItem.price * item.quantity);
}, 0);
```

**Security:** Client cannot manipulate prices. All calculations use DB values.

#### Order Status Workflow

```typescript
PATCH /orders/:id/status
Authorization: Bearer <kitchen_token>
{
  "status": "CONFIRMED"
}
```

**Valid Transitions:**
```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
   ↓           ↓           ↓          ↓            ↓
CANCELLED   CANCELLED   CANCELLED  CANCELLED   CANCELLED
```

**What happens:**
1. Service fetches order with restaurant
2. **Ownership check**: Verifies user owns the restaurant
3. **Transition validation**: Checks if transition is allowed
4. Updates order status if valid
5. Returns updated order

**Why transitions matter:**
- Prevents skipping steps (can't go PENDING → DELIVERED directly)
- Maintains data integrity
- Enables proper tracking and analytics

#### Order Cancellation

```typescript
DELETE /orders/:id
Authorization: Bearer <token>
```

**Permissions:**
- **Customers**: Can cancel PENDING or CONFIRMED orders only
- **Kitchen**: Can cancel orders at any status

**What happens:**
1. Service fetches order
2. Checks if user is customer OR restaurant owner
3. If customer: validates order is PENDING or CONFIRMED
4. If kitchen: allowed to cancel anytime
5. Updates status to CANCELLED

**Business logic:**
```typescript
if (isCustomer && status === "PREPARING") {
  throw new Error("Food is being cooked! Contact restaurant.");
}
// Kitchen can always cancel (handle refunds, etc.)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm/yarn

### Installation

```bash
# Clone repository
git clone <repo-url>
cd ServeSync

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/servesync"
JWT_SECRET="your-super-secret-key-change-in-production"
PORT=3000
NODE_ENV=development
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login user |
| GET | `/auth/me` | JWT | Get current user |
| POST | `/auth/forgot-password` | None | Request password reset |
| POST | `/auth/reset-password` | None | Reset password with token |

### Restaurant Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/restaurants` | JWT + KITCHEN/ADMIN | Create restaurant |
| GET | `/restaurants` | None | List all restaurants |
| GET | `/restaurants/:id` | None | Get restaurant details |
| PUT | `/restaurants/:id` | JWT + Owner | Update restaurant |
| DELETE | `/restaurants/:id` | JWT + Owner | Delete restaurant |

### Menu Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/restaurants/:id/menu` | JWT + Owner | Add menu item |
| GET | `/restaurants/:id/menu` | None | List menu items |
| PUT | `/restaurants/menu/:itemId` | JWT + Owner | Update menu item |
| DELETE | `/restaurants/menu/:itemId` | JWT + Owner | Delete menu item |

### Order Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | JWT | Place new order |
| GET | `/orders` | JWT | Get my orders (customer) |
| GET | `/orders/:id` | JWT | Get order details (owner/customer) |
| GET | `/orders/restaurant/:restaurantId` | JWT + KITCHEN/ADMIN + Owner | Get restaurant orders |
| PATCH | `/orders/:id/status` | JWT + KITCHEN/ADMIN + Owner | Update order status |
| DELETE | `/orders/:id` | JWT | Cancel order (permissions apply) |

**See `ServeSync.postman_collection.json` for full examples.**

---

## 🔐 Security

### Authentication
- **JWT Tokens**: Signed with `JWT_SECRET`, 7-day expiry
- **Password Hashing**: bcrypt with 10 salt rounds
- **Token Storage**: Client-side (localStorage/cookies)

### Authorization
- **RBAC Middleware**: Role-based endpoint protection
- **Ownership Validation**: Services verify user owns resource

### Input Validation
- **Zod Schemas**: All inputs validated before processing
- **Type Safety**: TypeScript + Prisma prevent type errors

### Best Practices
- ✅ Passwords never stored in plain text
- ✅ Reset tokens expire after 1 hour
- ✅ User enumeration prevented (forgot-password)
- ✅ SQL injection prevented (Prisma ORM)
- ⚠️ **TODO**: Hash reset tokens before storing
- ⚠️ **TODO**: Rate limiting for auth endpoints

---

## 🧪 Testing

### Automated Tests
```bash
# Test authentication flow
npx ts-node scripts/test-auth.ts

# Test password reset
npx ts-node scripts/test-forgot-password.ts

# Test restaurant CRUD + RBAC
npx ts-node scripts/test-restaurants.ts

# Test order processing
npx ts-node scripts/test-orders.ts
```

### Manual Testing (Postman)
1. Import `ServeSync.postman_collection.json`
2. Run requests in order (Register → Create Restaurant → Add Menu)
3. Token auto-saved after login

### Test Scenarios Covered
- ✅ User registration (Customer vs Kitchen)
- ✅ Login with invalid credentials
- ✅ Password reset flow
- ✅ RBAC enforcement (Customer blocked from creating restaurant)
- ✅ Ownership validation (User A can't modify User B's restaurant)
- ✅ Menu CRUD operations
- ✅ Order placement with server-side total calculation
- ✅ Order history retrieval
- ✅ Kitchen order dashboard
- ✅ Order status workflow (PENDING → CONFIRMED → PREPARING)
- ✅ Status transition validation (invalid transitions rejected)
- ✅ Order cancellation permissions (Customer vs Kitchen)

---

## 🗺️ Roadmap

### ✅ Phase 1: Authentication & Content Management (Complete)
- User authentication with JWT
- Restaurant management with RBAC
- Menu item CRUD operations

### ✅ Phase 2: Order Processing (Complete)
- Order placement with validation
- Server-side price calculation
- Order status workflow
- Kitchen order dashboard
- Order cancellation with permissions

### Phase 3: Real-Time Features (Next)
- Cart management
- Order placement
- Status tracking (PENDING → CONFIRMED → PREPARING → READY → DELIVERED)
- Customer order history

### Phase 3: Real-Time Features
- WebSocket integration (Socket.io)
- Kitchen Display System (KDS)
- Live order status updates
- Push notifications

### Phase 4: Payments & Delivery
- Stripe payment integration
- Payment webhooks
- Delivery address validation (Google Maps)
- Driver assignment (future)

### Phase 5: Analytics
- Sales reports
- Popular items dashboard
- Peak hours analysis
- Revenue tracking

---

## 📝 Why This Design?

### Prisma Over Raw SQL
- **Type Safety**: Auto-generated types prevent errors
- **Migrations**: Schema changes tracked in version control
- **Productivity**: Less boilerplate, more features

### JWT Over Sessions
- **Scalability**: No server-side storage required
- **Stateless**: Perfect for microservices/load balancers
- **Cross-domain**: Works with mobile apps, SPAs

### Controller-Service Pattern
- **Reusability**: Services can be called from multiple controllers
- **Testing**: Mock services without HTTP layer
- **Business Logic Isolation**: Controllers stay thin

### Zod Validation
- **Type Inference**: Zod schemas auto-generate TypeScript types
- **Runtime Safety**: Catches invalid data before processing
- **Error Messages**: Clear validation errors for debugging

---

## 🤝 Contributing

This is a learning/portfolio project. Contributions welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this project for learning or portfolio purposes.

---

## 🆘 Troubleshooting

### "Unauthorized: No token provided"
- Ensure you're logged in and token is attached
- Postman: Use "Bearer Token" auth type
- Check Authorization header format: `Bearer <token>`

### "Forbidden: Insufficient permissions"
- Register as `KITCHEN` role to create restaurants
- Customers can only browse, not manage

### Database Connection Error
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npx prisma migrate dev`

### Port Already in Use
- Kill existing Node processes: `taskkill /F /IM node.exe` (Windows)
- Change `PORT` in `.env` or `src/index.ts`

---

**Built with ❤️ for learning full-stack development**
