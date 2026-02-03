# Nigerian Market Localization

## Summary

ServeSync has been localized for the Nigerian market with the following changes:

### Currency
- **Changed from:** USD ($)
- **Changed to:** Nigerian Naira (₦/NGN)
- **Smallest unit:** Kobo (100 kobo = ₦1)

### Location
- **Default coordinates:** Lagos, Nigeria (6.5244°N, 3.3792°E)
- **Delivery addresses:** Nigerian addresses (e.g., "Victoria Island, Lagos")

### Pricing
**Delivery Fees:**
- Base fee: ₦500
- Per kilometer: ₦100/km
- Maximum fee: ₦2,000
- Maximum range: 15km

**Examples:**
- 1km delivery: ₦500 + (₦100 × 1) = **₦600**
- 5km delivery: ₦500 + (₦100 × 5) = **₦1,000**
- 15km delivery: ₦500 + (₦100 × 15) = ₦2,000 → **₦2,000** (at max)

### Files Updated
1. `src/services/delivery.service.ts` - Lagos coordinates, NGN pricing
2. `src/services/payment.service.ts` - NGN currency
3. `src/services/order.service.ts` - Lagos restaurant coordinates
4. `prisma/schema.prisma` - Default currency to "ngn"
5. `scripts/test-payment-delivery.ts` - Nigerian addresses and ₦ symbol

### Stripe Integration
Stripe supports NGN payments with the following considerations:
- Currency code: `ngn`
- Smallest unit: kobo (divide by 100)
- Example: ₦7,000 = 700000 kobo in Stripe API
- International cards and local Nigerian cards supported

All mock services now default to Nigerian market settings while maintaining the ability to switch to real APIs when needed.
