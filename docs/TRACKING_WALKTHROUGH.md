# Real-Time Tracking Walkthrough

## Overview
Phase 5c adds the "magic" to ServeSync: **Live Driver Tracking** and **Instant Order Alerts**. By enabling WebSockets, we moved from a "refresh to see updates" model to a true real-time experience.

## 📡 Features Implemented

### 1. The "Uber" Alert
When a customer places an order:
1.  **Backend** calculates delivery fee & geocodes address.
2.  **OrderService** finds `ONLINE` drivers within 10km.
3.  **Socket.io** pushes a `NEW_ORDER_AVAILABLE` event to those drivers instantly.
4.  **Driver App** pops up the order card (Accept/Reject).

```typescript
// Payload sent to Driver
{
  orderId: "cl9...",
  restaurantName: "Chicken Republic",
  deliveryFee: 1500,
  distance: 4.5 // km
}
```

### 2. Live Location Streaming
Once a driver accepts:
1.  Driver phone sends `DRIVER_LOCATION_UPDATE` every 5s.
    - Payload: `{ lat: 6.5244, lng: 3.3792, activeOrderId: "..." }`
2.  **Server** relays this specific coordinate to the **Customer's Room** (`order:cl9...`).
3.  **Customer UI** updates the map marker smoothly.

### 3. Status Updates
As the driver taps "Picked Up" or "Delivered":
- **DeliveryService** emits `DELIVERY_STATUS_UPDATE`.
- **OrderService** syncs the Order status.
- Customer receives `ORDER_UPDATED` notification.

## 🛠️ Integration Points

- **Socket Events:** Defined in `src/config/events.ts`.
- **Services:**
  - `OrderService.createOrder` -> Triggers Alerts.
  - `DeliveryService.assignDriver` -> Triggers "Driver Found" UI.
  - `DeliveryService.updateStatus` -> Triggers Progress Bar.

## 🧪 Verification
Run the simulation script to see the logs flow:
```bash
npx ts-node scripts/test-tracking.ts
```
Expected output:
1.  `✅ Driver connected`
2.  `🔔 Driver received NEW ORDER`
3.  `✅ Driver accepted order`
4.  `📍 Driver streaming location...`
5.  `🛰️ Customer received TRACKING UPDATE`

## Next Steps
- **Push Notifications:** For when the app is closed.
- **Payment Integration:** Handling real money.
