# Power NOW Direct Sales Website

A professional direct-sales storefront for **Clarity Creates Speed**, the first book in the **Power NOW** series by Jonathan R. Holman.

The site is designed to feel like an extension of the book universe while still functioning as a clean e-commerce engine: immersive hero, readable typography, stock imagery that can be swapped from admin, no fabricated reviews, Stripe Checkout, referral-code capture, and an admin-editable storefront settings file.

## What is included

- Next.js App Router storefront for the Power NOW book series.
- Direct purchase path for the first book: **$20.00 + $4.95 shipping & handling**.
- Stripe Checkout session API route with shipping address collection and fixed shipping rate.
- Mobile sticky buy bar with minimum-size tap targets.
- Admin page at `/admin` for pricing, shipping, copy, imagery URLs, checkout settings, and affiliate defaults.
- Settings persistence through either local JSON or GitHub Contents API.
- Referral capture from `?ref=`, `?affiliate=`, or `?via=` links; referral code is passed into Stripe metadata.
- Affiliate information page at `/affiliates`.
- Sample reading page at `/read-chapter-one`.
- Stripe webhook route that logs completed checkout metadata for fulfillment and affiliate reconciliation.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_TOKEN=a-long-random-secret
```

Optional:

```bash
STRIPE_AUTOMATIC_TAX=false
CONFIG_READ_MODE=local
CONFIG_WRITE_MODE=local
GITHUB_TOKEN=github_pat_...
GITHUB_REPO=AccelAnalysis/PowerNow
GITHUB_BRANCH=main
SETTINGS_FILE_PATH=data/site-settings.json
```

## Admin settings

Visit `/admin`, paste the `ADMIN_TOKEN`, edit settings, and save.

Two write modes are supported:

1. **local** — writes to `data/site-settings.json` on the Node server filesystem. This is simple for local development or traditional Node hosting.
2. **github** — writes to `data/site-settings.json` in the repository using the GitHub Contents API. Use this for serverless hosting where the filesystem is not persistent.

For GitHub-backed settings, set:

```bash
CONFIG_READ_MODE=github
CONFIG_WRITE_MODE=github
GITHUB_TOKEN=github_pat_...
GITHUB_REPO=AccelAnalysis/PowerNow
GITHUB_BRANCH=main
SETTINGS_FILE_PATH=data/site-settings.json
```

Use a narrowly scoped token and protect it as a server-only secret.

## Stripe setup

The checkout route creates a Stripe Checkout Session dynamically from the current admin-managed price and shipping settings. No Stripe product or price ID is required for the first version.

Stripe Checkout can show Apple Pay and Google Pay when those wallet methods are enabled in Stripe and your production domain is configured correctly.

### Webhook

Configure a Stripe webhook endpoint to:

```text
https://your-domain.com/api/stripe/webhook
```

Subscribe to:

```text
checkout.session.completed
```

The webhook logs order metadata including `product_id`, `affiliate_ref`, `quantity`, and the customer email when available. For a production fulfillment workflow, connect this route to your preferred database, fulfillment spreadsheet, CRM, or shipping process.

## Imagery

All default imagery uses remote stock URLs. Admin can replace each image URL without touching the page layout:

- Hero background
- Book mockup cover face
- Writing desk section
- Workspace/action section
- Affiliate section

When the final book cover art is ready, replace `imagery.bookCoverUrl` in `/admin` or `data/site-settings.json`.

## Affiliate tracking

Referral codes are captured from URLs such as:

```text
https://your-domain.com/?ref=PARTNERNAME
```

The captured value is stored in browser local storage and passed into Stripe Checkout metadata as `affiliate_ref`. Payout approval should be reconciled against successful Stripe sessions and your affiliate agreement.

## Production checklist

- Replace `NEXT_PUBLIC_SITE_URL` with the final domain.
- Add live Stripe secret key and webhook secret.
- Confirm Stripe wallet/domain settings for Apple Pay and Google Pay.
- Set `ADMIN_TOKEN` to a long random value.
- Decide whether admin writes locally or back to GitHub.
- Replace stock book mockup imagery with final cover artwork.
- Add real testimonials only after they are received and approved.
- Connect the webhook to a durable fulfillment/order workflow before launch volume increases.
