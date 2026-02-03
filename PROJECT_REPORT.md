# ServeSync Project Report 🚀

**ServeSync** is a high-performance backend API designed for the modern on-demand food delivery market in Nigeria. It orchestrates real-time logistics, secure payments, and multi-role user management.

## 🏗️ System Architecture

### Core Stack
*   **Runtime:** Node.js (v18+) & TypeScript
*   **Framework:** Express.js (REST API)
*   **Database:** PostgreSQL 15 managed via Prisma ORM
*   **Real-Time:** Socket.io (Events & Rooms)
*   **Containerization:** Docker & Docker Compose

### Key Design Decisions
1.  **Event-Driven WebSocket Architecture:**
    *   Drivers subscribe to `driver:{userId}` rooms.
    *   Live deliveries stream location data to `order:{orderId}` rooms using ephemeral sockets for low latency.
2.  **Geospatial Logistics:**
    *   Implemented Haversine formula for "Crow Flies" distance calculation.
    *   Optimized driver discovery by filtering nearby online drivers within a 10km radius.
3.  **Nigerian Payment Context:**
    *   Integrated logic for `USSD`, `Bank Transfer`, and `Wallet` payments alongside cards.
    *   Simulated Async Webhook flows (PENDING -> WEBHOOK -> SUCCESS) to mimic providers like Paystack.
4.  **Security First:**
    *   `Helmet` for HTTP header security.
    *   `Rate Limiting` to prevent abuse.
    *   `JWT` stateless authentication with Role-Based Access Control (RBAC).
    *   `Swagger UI` for interactive API documentation at `/api-docs`.

## 🌟 Implemented Features

### 1. User Management (RBAC)
*   **Actors:** Customer, Restaurant, Driver, Admin.
*   **Auth:** Secure Registration, Login, and Profile management.

### 2. Restaurant & Menu
*   **Management:** Create/Update Restaurants.
*   **Inventory:** Manage Menu Items, Categories, and Availability.

### 3. Orders & Logistics
*   **Lifecycle:** `PENDING` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
*   **Assignment:** Smart driver assignment based on location.
*   **Live Tracking:** WebSocket updates pushed to the Customer app.

### 4. Payments
*   **Methods:** Card, USSD (*737*...), Bank Transfer.
*   **Wallets:** Internal wallet system for refunds/funding.

### 5. Documentation
*   **Swagger UI:** Interactive API exploration at `/api-docs`.
*   **DevOps:** Dockerized for one-command deployment.

## 🔮 Future Roadmap
*   **Production Deployment:** Deploy to AWS/DigitalOcean using the Docker containers.
*   **Push Notifications:** Replace the "Stub" service with real FCM/OneSignal integration.
*   **Payment Gateway:** Replace the "Mock" gateway with live Paystack API keys.
*   **Unit Testing:** Expand test coverage using Jest/Supertest.

## 🏁 Conclusion
ServeSync represents a production-ready foundation for a scalable delivery platform, showcasing advanced backend patterns in TypeScript and Node.js.
