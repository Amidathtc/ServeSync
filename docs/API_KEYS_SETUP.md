# API Keys Setup Guide

This guide will help you obtain the necessary API keys when you're ready to replace the mock implementations with real services.

---

## 🔑 Stripe API Keys

### What You Need
- Stripe Secret Key (`sk_test_...`)
- Stripe Publishable Key (`pk_test_...`)
- Stripe Webhook Secret (`whsec_...`)

### How to Get Them

#### 1. Create a Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Click **Sign up** (it's free for testing)
3. Complete the registration process
4. You'll land on the Stripe Dashboard

#### 2. Get Your API Keys
1. In the Stripe Dashboard, click **Developers** in the top navigation
2. Click **API keys** in the left sidebar
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`) - Safe to use in frontend
   - **Secret key** (starts with `sk_test_`) - Keep this secret, backend only
4. Click **Reveal test key** to see the secret key
5. Copy both keys and add to your `.env` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

#### 3. Get Webhook Secret (For Production)
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/payments/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click **Add endpoint**
6. Click **Reveal** next to **Signing secret**
7. Copy the webhook secret (starts with `whsec_`)
8. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

#### 4. Testing Webhooks Locally
For local development, use Stripe CLI:
```bash
# Install Stripe CLI
# Windows: https://github.com/stripe/stripe-cli/releases/latest
# Download stripe_X.X.X_windows_x86_64.zip

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3100/payments/webhook
```

This will give you a temporary webhook secret for local testing.

---

## 🗺️ Google Maps API Key

### What You Need
- Google Maps API Key with Geocoding API enabled

### How to Get It

#### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click **Select a project** → **New Project**
4. Enter project name (e.g., "ServeSync")
5. Click **Create**

#### 2. Enable Geocoding API
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Geocoding API"
3. Click on **Geocoding API**
4. Click **Enable**

#### 3. Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Your API key will be generated (starts with `AIza`)
4. Click **Restrict Key** (recommended for security)
5. Under **API restrictions**:
   - Select "Restrict key"
   - Check **Geocoding API**
6. Click **Save**
7. Copy the API key and add to `.env`:
   ```env
   GOOGLE_MAPS_API_KEY=AIzaYourKeyHere
   ```

#### 4. Set Usage Limits (Prevent Unexpected Charges)
1. Go to **APIs & Services** → **Geocoding API** → **Quotas**
2. Set daily request limit (e.g., 1000 requests/day for development)
3. This prevents accidental overuse

#### 5. Pricing Info
- **Free tier:** $200/month credit (includes ~40,000 geocoding requests)
- **Cost:** $5 per 1,000 requests after free tier
- For development, you'll likely stay within free tier

---

## 💡 Current Mock Implementation

The current implementation uses **mock services** that simulate API responses:

### Mock Payment Service
- Simulates successful payments for all requests
- Generates fake payment IDs
- No real charges are made

### Mock Delivery Service
- Validates addresses based on simple pattern matching
- Returns fake coordinates
- Calculates delivery fees based on random distances

---

## 🔄 How to Switch from Mock to Real

When you have your API keys:

### 1. Update `.env` File
Add your real keys:
```env
# Replace these mock values with real keys
STRIPE_SECRET_KEY=sk_test_your_real_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_real_key
STRIPE_WEBHOOK_SECRET=whsec_your_real_secret
GOOGLE_MAPS_API_KEY=AIza_your_real_key

# Set this to enable real APIs
USE_REAL_APIS=true
```

### 2. Install Real SDKs
```bash
npm install stripe @googlemaps/google-maps-services-js
```

### 3. The Code Auto-Switches
The services automatically detect `USE_REAL_APIS=true` and use real implementations:
- `payment.service.ts` will use real Stripe SDK
- `delivery.service.ts` will use real Google Maps API

No code changes needed!

---

## 🧪 Testing with Real Stripe (Test Mode)

Stripe provides test card numbers:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Insufficient funds |

Any future expiry date and any 3-digit CVC work.

---

## 📊 Cost Estimates

### Stripe
- **Fees:** 2.9% + $0.30 per successful transaction
- **Test mode:** Completely free, no charges
- **Production:** Only pay when you actually charge customers

### Google Maps
- **Development:** Free (within $200/month credit)
- **Typical usage:** 
  - ~1 geocoding request per order
  - 1000 orders/month = ~$0.125 (well within free tier)

---

## ⚠️ Important Notes

> [!CAUTION]
> **Never commit API keys to Git!** Always use `.env` files and add `.env` to `.gitignore`

> [!TIP]
> **For production:** Use Stripe live keys (`sk_live_`, `pk_live_`) instead of test keys

> [!NOTE]
> **Current status:** The app works fully with mock services. You can develop and test everything without real API keys.

---

## 🆘 Troubleshooting

### Stripe Issues
- **"Invalid API Key"**: Make sure you're using test keys (start with `sk_test_` or `pk_test_`)
- **"Webhook signature verification failed"**: Use Stripe CLI for local testing
- **"No such payment_intent"**: Payment ID might be from different Stripe account

### Google Maps Issues
- **"REQUEST_DENIED"**: Enable Geocoding API in Google Cloud Console
- **"API key not valid"**: Check API restrictions in credentials settings
- **"Over quota"**: Set usage limits or wait for quota to reset

---

## 📞 Support Resources

- **Stripe Docs:** [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Test Cards:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Google Maps Docs:** [https://developers.google.com/maps/documentation/geocoding](https://developers.google.com/maps/documentation/geocoding)
- **Stripe Discord:** [https://discord.gg/stripe](https://discord.gg/stripe)

---

**Ready to implement?** Keep using mock services until you're ready to get real API keys!
