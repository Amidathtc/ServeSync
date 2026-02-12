# API Keys Setup Guide 🇳🇬

This guide will help you obtain the necessary API keys for **Paystack**, the recommended payment gateway for Nigeria 🇳🇬.

---

## 💳 Paystack API Keys

### What You Need
- Paystack Secret Key (`sk_test_...`)
- Paystack Public Key (`pk_test_...`)

### How to Get Them

#### 1. Create a Paystack Account
1. Go to [https://dashboard.paystack.com/#/signup](https://dashboard.paystack.com/#/signup)
2. Sign up (it's free)
3. You will land on the Dashboard in **Test Mode** (Toggle is near the top right)

#### 2. Get Your API Keys
1. In the Dashboard, go to **Settings** (Gear Icon) → **API Keys & Webhooks**
2. You will see:
   - **Secret Key**: `sk_test_xxxxxxxx...` (Server-side, keep safe!)
   - **Public Key**: `pk_test_xxxxxxxx...` (Frontend use)
3. Copy the **Secret Key** and add it to your `.env` file:
   ```env
   PAYSTACK_SECRET_KEY=sk_test_your_key_here
   ```

#### 3. Setup Webhook (For Production)
1. In **Settings** → **API Keys & Webhooks**
2. Scroll to **Webhooks URL**
3. Enter your live server URL: `https://your-domain.com/payments/webhook`
4. Click **Save Changes**

---

## 🗺️ Google Maps API Key
> Unchanged. See Google Cloud Console for keys.

---

## 🔁 How to Switch to Real Payments
1. In `.env`, set:
   ```env
   USE_REAL_APIS=true
   PAYSTACK_SECRET_KEY=sk_test_...
   ```
2. The `PaymentService` will detect the key and switch from "Mock Mode" to real Paystack API calls.

---

## 🧪 Testing with Paystack (Test Mode)

You can use these test cards to simulate scenarios:

| Card Type | Card Number | CVV | Expiry | PIN |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `4084 0840 8408 4081` | 408 | Any Future | 1111 |
| **Failed** | `4084 0840 8408 4082` | 408 | Any Future | 1111 |
| **Bank Auth**| `4084 0840 8408 4083` | 408 | Any Future | 1111 |
| **Insufficient**| `4084 0840 8408 4084` | 408 | Any Future | 1111 |

### USSD Testing
- Choose "USSD" -> Select "GTBank" -> Dial code `*737*...` in the simulator.

---

## 📊 Cost Estimates (Paystack Nigeria)
- **Local Transactions:** 1.5% + ₦100
- **International:** 3.9% + ₦100
- **Transfers:** ₦10 - ₦50 per transfer

---

## ⚠️ Checklist
- [ ] Add `PAYSTACK_SECRET_KEY` to `.env`
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Use `sk_live_...` only when launching to real customers!
