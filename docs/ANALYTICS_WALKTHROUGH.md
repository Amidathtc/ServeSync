# Analytics Dashboard System Walkthrough

## Overview

Successfully implemented the **Analytics Dashboard System** with three distinct views ensuring role-based access to data. This module demonstrates advanced data aggregation, clean architecture, and business intelligence capabilities.

### 📊 Key Features

**1. Admin Dashboard (Platform View)**
- **Revenue Analytics:** Platform wide revenue, growth rate, and breakdown by payment method.
- **Order Statistics:** Order volume tracking and fulfillment rates (Delivery vs Pickup).
- **Restaurant Performance:** Top performing restaurants by revenue and order volume.
- **Endpoints:**
  - `GET /admin/dashboard` - Combined overview
  - `GET /admin/revenue` - Detailed revenue stats
  - `GET /admin/orders` - Order stats
  - `GET /admin/restaurants/top` - Top restaurants

**2. Restaurant Dashboard (Owner View)**
- **Business Insights:** Revenue tracking and order trends for specific restaurants.
- **Menu Performance:** Top selling items analysis.
- **Endpoints:**
  - `GET /restaurants/:restaurantId/dashboard` - Dashboard overview

**3. Customer Dashboard (Personal View)**
- **Spending Habits:** Total spent, average order value.
- **Order History:** Recent orders and status.
- **Endpoints:**
  - `GET /users/me/analytics` - Personal stats

### 🧹 Architecture & Quality

- **Service Layer:** `AnalyticsService` handles all complex aggregations and business logic.
- **Controller Layer:** Separate controllers for Admin, Restaurant, and Customer analytics.
- **Authorization:**
  - `requireAdmin` middleware for platform protection.
  - Role-based access for restaurant data (KITCHEN/ADMIN).
  - User-scoped access for customer data.
- **Localization:**
  - **Timezone:** Lagos/WAT (UTC+1) handling for accurate daily reporting.
  - **Currency:** Auto-formatted to Nigerian Naira (₦).
- **Performance:**
  - Efficient Prisma aggregations (`groupBy`, `aggregate`) instead of loading all data.
  - Scalable design ready for caching.

### 📝 Usage Examples

**Admin: Get Platform Revenue**
```http
GET /admin/revenue?period=month&groupBy=week
Authorization: Bearer <admin_token>
```

**Restaurant: Get Dashboard**
```http
GET /restaurants/cm3rx.../dashboard?period=week
Authorization: Bearer <kitchen_token>
```

**Customer: Get My Stats**
```http
GET /users/me/analytics
Authorization: Bearer <customer_token>
```
