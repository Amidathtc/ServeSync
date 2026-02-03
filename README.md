# ServeSync 🚀

ServeSync is a modern, real-time Food Delivery Backend API built for the Nigerian market. It features live order tracking, advanced driver logistics, and local payment integration.

## 🌟 Features

*   **Real-Time Tracking:** Socket.io powered WebSocket server for live driver location updates.
*   **Logistics Engine:** Geospatial algorithms (Haversine) for finding nearby drivers and calculating delivery fees.
*   **Role-Based Access:** Secure generic RBAC for Customer, Restaurant (Kitchen), Driver, and Admin.
*   **Payments:** Integrated Nigerian payment flows (USSD, Transfer, Wallet).
*   **Notifications:** Centralized notification service stub (FCM/Email).

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
