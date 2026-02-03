# ServeSync Payment & Delivery API

This document describes the payment and delivery endpoints added in Phase 4.

## Payment Endpoints

### Create Payment Intent

**POST** `/payments/intent`

Creates a Stripe payment intent for an order.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "cm3abc123..."
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_mock_1234567890_secret_abc123",
  "amount": 7600,
  "orderId": "cm3abc123..."
}
```

**Errors:**
- `404`: Order not found
- `403`: Unauthorized (not your order)
- `400`: Order already paid

---

### Confirm Payment (Mock Only)

**POST** `/payments/confirm`

Confirms a payment. In production, webhooks handle this automatically.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentIntentId": "pi_mock_1234567890"
}
```

**Response (200):**
```json
{
  "message": "Payment confirmed successfully"
}
```

---

### Get Payment Status

**GET** `/payments/:orderId`

Retrieves payment status for an order.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "payment": {
    "id": "cm3payment123",
    "amount": 7600,
    "currency": "ngn",
    "status": "SUCCEEDED",
    "last4": "4242",
    "createdAt": "2026-02-02T17:00:00.000Z"
  }
}
```

**Errors:**
- `404`: Order not found or no payment found
- `403`: Unauthorized

---

### Webhook Handler

**POST** `/payments/webhook`

Handles Stripe webhook events. **No authentication required** (Stripe calls this directly).

**Headers:**
```
stripe-signature: <webhook_signature>
Content-Type: application/json
```

**Request Body:** (Stripe event object)
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "status": "succeeded"
    }
  }
}
```

**Response (200):**
```json
{
  "received": true
}
```

---

## Updated Order Endpoint

### Create Order with Delivery

**POST** `/orders`

Now supports optional delivery address.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "restaurantId": "cm3restaurant123",
  "items": [
    {
      "menuItemId": "cm3item123",
      "quantity": 2
    }
  ],
  "deliveryAddress": "Victoria Island, Lagos, Nigeria",
  "notes": "Extra pepper please"
}
```

**Response (201):**
```json
{
  "message": "Order placed successfully",
  "order": {
    "id": "cm3order123",
    "status": "PENDING",
    "subtotal": 7000,
    "deliveryFee": 600,
    "deliveryDistance": 1.2,
    "total": 7600,
    "customerId": "cm3customer123",
    "restaurantId": "cm3restaurant123",
    "notes": "Extra pepper please",
    "createdAt": "2026-02-02T17:00:00.000Z",
    "updatedAt": "2026-02-02T17:00:00.000Z",
    "items": [...],
    "restaurant": {...},
    "delivery": {
      "id": "cm3delivery123",
      "orderId": "cm3order123",
      "address": "Victoria Island, Lagos, Nigeria",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "status": "PENDING",
      "createdAt": "2026-02-02T17:00:00.000Z",
      "updatedAt": "2026-02-02T17:00:00.000Z"
    }
  }
}
```

**Notes:**
- If `deliveryAddress` is omitted, it's a pickup order (no delivery fee)
- Delivery fee automatically calculated based on distance
- Maximum delivery distance: 15km
- Delivery pricing: ₦500 base + ₦100/km (max ₦2,000)

---

## Payment Flow

1. **Customer creates order** with optional delivery address
   - `POST /orders`
   - Server validates address, calculates delivery fee
   - Returns order with total amount

2. **Customer initiates payment**
   - `POST /payments/intent`
   - Server creates Stripe payment intent
   - Returns `clientSecret` for frontend

3. **Frontend confirms payment** (using Stripe.js)
   - Customer enters payment details
   - Stripe processes payment
   - Stripe sends webhook to server

4. **Webhook updates order**
   - `POST /payments/webhook`
   - Server verifies signature
   - Updates payment status to SUCCEEDED
   - Order becomes visible to kitchen

---

## Payment Status Enum

```typescript
enum PaymentStatus {
  PENDING      // Payment intent created, awaiting confirmation
  PROCESSING   // Payment being processed
  SUCCEEDED    // Payment successful
  FAILED       // Payment failed
  REFUNDED     // Payment refunded
}
```

---

## Delivery Status Enum

```typescript
enum DeliveryStatus {
  PENDING         // Delivery scheduled
  ASSIGNED        // Driver assigned (future)
  PICKED_UP       // Order picked up (future)
  IN_TRANSIT      // On the way (future)
  DELIVERED       // Delivered
  CANCELLED       // Delivery cancelled
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad request (validation error, invalid data) |
| 401  | Unauthorized (invalid/missing token) |
| 403  | Forbidden (not your resource) |
| 404  | Not found (order, payment, etc.) |
| 500  | Internal server error |

---

## Testing with Mock Services

When `USE_REAL_APIS=false` (default):

- **Payments**: All payments auto-succeed
- **Geocoding**: Returns mock coordinates based on address hash
- **Webhooks**: Signature verification always passes

To test payment flow:
```bash
npx ts-node scripts/test-payment-delivery.ts
```

---

## Switching to Real APIs

1. Update `.env`:
```env
USE_REAL_APIS=true
STRIPE_SECRET_KEY=sk_test_your_real_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_real_key
STRIPE_WEBHOOK_SECRET=whsec_your_real_secret
GOOGLE_MAPS_API_KEY=AIza_your_real_key
```

2. Install SDKs:
```bash
npm install stripe @googlemaps/google-maps-services-js
```

3. Restart server

See [API_KEYS_SETUP.md](./API_KEYS_SETUP.md) for detailed setup instructions.
