# ServeSync 🚀

ServeSync is a modern **Restaurant Order Management System** that streamlines restaurant operations with online ordering, real-time kitchen updates, payments, and analytics. Built for the Nigerian market with local payment integration.

## 🌟 Core Features

*   **Online Ordering:** Customers can browse menus and place orders seamlessly.
*   **Real-Time Kitchen Updates:** Socket.io powered WebSocket notifications for instant order alerts.
*   **Order Management:** Complete workflow from PENDING → CONFIRMED → PREPARING → READY.
*   **Payment Processing:** Integrated Nigerian payment methods (USSD, Bank Transfer, Cards, Wallet).
*   **Restaurant Analytics:** Track performance, orders, and revenue.
*   **Role-Based Access:** Secure RBAC for Customer, Restaurant (Kitchen), and Admin.
*   **Menu Management:** Create and manage restaurant menus, categories, and pricing.

## 🚚 Optional Delivery Features

*   **Driver Management:** Assign and track delivery drivers.
*   **Live Tracking:** Real-time driver location updates for order tracking.
*   **Smart Assignment:** Geospatial algorithms for finding nearby drivers within 10km radius.

## 🛠️ Tech Stack

*   **Runtime:** Node.js (TypeScript)
*   **Framework:** Express.js
*   **Database:** PostgreSQL (via Prisma ORM)
*   **Real-Time:** Socket.io
*   **Authentication:** JWT + bcrypt

## 🚀 Getting Started

### Prerequisites

*   Node.js v18+
*   PostgreSQL
*   Docker (Optional)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Amidathtc/servesync.git
    cd servesync
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    *   Copy `.env.example` to `.env`
    *   **IMPORTANT:** Fill in your API Key secrets!
    ```bash
    cp .env.example .env
    ```

4.  **Database Setup**
    ```bash
    npx prisma generate
    npx prisma db push
    npm run seed  # (Optional) Seed dummy data
    ```

5.  **Run the Server**
    ```bash
    npm run dev
    ```

## 🐳 Running with Docker

Easily spin up the entire stack (API + Database):

```bash
docker-compose up --build
```

The API will be available at `http://localhost:3100`.

## 🧪 Testing & Verification Scripts

We have built custom scripts to simulate complex flows without a frontend:

*   **Test Orders:** `npx ts-node scripts/test-orders.ts`
*   **Test Tracking:** `npx ts-node scripts/test-tracking.ts`
*   **Test Payment:** `npx ts-node scripts/test-payment.ts`

## 🔑 Configuration & Secrets

Check `.env.example` for the full list of required keys.

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Postgres Connection String |
| `JWT_SECRET` | Secret for signing auth tokens |
| `GOOGLE_MAPS_API_KEY` | For real geocoding/distance calc |
| `PAYSTACK_SECRET_KEY` | For processing real payments |

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
