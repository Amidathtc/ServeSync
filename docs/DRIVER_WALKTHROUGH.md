# Driver Management System Walkthrough

## Overview

Successfully implemented the **Driver Management System** (Phase 5b), enabling independent contractors to sign up, manage their availability, and fulfill delivery orders.

### 🛵 Key Features

**1. Driver Onboarding**
- **Registration:** Drivers sign up with vehicle details (Type, Plate, License).
- **Verification:** Admin approves "Pending" drivers to "Verified".
- **States:** PENDING -> VERIFIED -> SUSPENDED.

**2. Logistics & Availability**
- **Status Toggle:** Drivers go Online/Offline.
- **Location Updates:** Periodic GPS updates (Lat/Lng).
- **Visibility:** Only Online & Verified drivers receive orders.

**3. Order Fulfillment (The "Uber" Model)**
- **Pull Model:** Drivers see "Available Orders" nearby (10km radius).
- **Atomic Acceptance:** `assignDriver` ensures only one driver claims an order.
- **Status Flow:**
  - `ASSIGNED` -> `IN_TRANSIT` -> `DELIVERED`.
  - Updates Order status automatically (`OUT_FOR_DELIVERY` -> `DELIVERED`).

### 🛠️ Architecture

**Service Layer:**
- `DriverService`: Handles profile state, availability, and verification.
- `DeliveryService`: Handles logistics, fee calculation, and order assignment transaction (Concurrency safe).

**Endpoints:**
- `POST /drivers/register`
- `PUT /drivers/me/status` (Online/Offline)
- `GET /drivers/orders/available` (Geo-filtered)
- `POST /drivers/orders/:id/accept` (Claim order)
- `PUT /drivers/orders/:id/status` (Update progress)

**Admin Tools:**
- `GET /admin/drivers` (Fleet view)
- `PUT /admin/drivers/:id/verify` (Approve/Reject)

### 🇳🇬 Local Context
- **Vehicle Types:** Optimization for Motorcycles (Okada) delivery.
- **Geocoding:** Mock implementation tuned for Lagos coordinates.

### 📝 Usage Example

**1. Driver Goes Online**
```http
PUT /drivers/me/status
{ "isOnline": true, "lat": 6.5244, "lng": 3.3792 }
```

**2. Find Orders**
```http
GET /drivers/orders/available
```

**3. Accept Order**
```http
POST /drivers/orders/cl9.../accept
```
