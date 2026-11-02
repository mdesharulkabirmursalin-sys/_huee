# __huee_ — streetwear storefront

A responsive React + Vite storefront based on your supplied __huee_ design, with BDT pricing, product filters, size/stock-aware cart, product detail modal, WhatsApp and Instagram order requests, Supabase auth integration, and a starter admin dashboard.

## Included

- Mobile-first storefront with __huee_ dark/neon branding.
- Real editorial/product photos from Unsplash (replace with your own product photography before selling).
- BDT pricing and product cards, category filters, search, product details and cart.
- Stock-aware size selection and quantity controls.
- WhatsApp message checkout and Instagram DM handoff.
- Supabase email/password customer login.
- Starter product management dashboard with size stock fields.
- Supabase SQL schema and Row Level Security policies.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. The site runs with demo data if Supabase is not configured.

## Configure Supabase

1. Create a Supabase project.
2. Copy the project URL and **anon/public** key into `.env.local`.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Register your account through the website.
5. In Supabase SQL Editor, find your user UUID in Authentication → Users and run the admin insert at the bottom of `schema.sql`, replacing `USER_UUID`.
6. Confirm the `profiles` row says `admin`. RLS policies must remain enabled.
7. Add your WhatsApp number (digits only, international country code) to `VITE_WHATSAPP_NUMBER`. For Bangladesh, start with `8801...`, not `+8801...`.
8. Add your public Instagram profile URL to `VITE_INSTAGRAM_URL`.

### Important security note about admin

The UI is not the security boundary. The SQL policies grant product write access only to a user whose `profiles.role` is `admin`. Do not make a policy that lets anyone self-assign `admin`. Do not expose the Supabase service-role key in the frontend.

## Online payments (bKash / SSLCommerz / Stripe)

The included checkout deliberately does **not** pretend to take online payments. A secure gateway requires a server-side function that:
1. Re-reads product prices and stock from the database.
2. Creates an order from trusted product IDs, sizes and quantities.
3. Starts a payment session using private gateway credentials.
4. Verifies the gateway callback/webhook server-side.
5. Marks the order paid only after successful verification and decrements stock atomically.

Use a Supabase Edge Function or your own backend. Never put gateway secrets in `VITE_*` variables or browser JavaScript. Choose a provider that supports your business and settlement requirements in Bangladesh. Once this is configured, add the provider checkout option to the order form.

## Before public launch checklist

- [ ] Replace Unsplash editorial placeholders with photos of your actual products.
- [ ] Confirm prices, descriptions, sizes and stock counts are accurate.
- [ ] Set WhatsApp and Instagram details in `.env.local`.
- [ ] Configure Supabase and review RLS policies with a developer.
- [ ] Implement server-side order validation and stock reservation.
- [ ] Add payment gateway Edge Function and verified callbacks if taking online payments.
- [ ] Add shipping, returns, privacy, terms, and contact pages.
- [ ] Configure a transactional email provider if you need email receipts/marketing.
- [ ] Test mobile layouts, real devices, checkout, and admin permissions.
- [ ] Deploy the `dist` output to Vercel, Netlify, or another static host. Add environment variables in the host dashboard.

## Build

```bash
npm run build
npm run preview
```

This is a starter implementation. It is not a fully production-secure commerce backend until the server-side order/payment and stock workflows are completed and tested.
