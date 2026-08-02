# Power NOW direct-sales storefront

Production storefront for **Clarity Creates Speed**, the first book in the **Power NOW** series by Jonathan R. Holman.

## Live architecture

- Next.js App Router storefront
- Published Amazon cover served through a validated same-origin image proxy
- Browser-derived visual palette from the actual cover artwork
- Explicit price presentation:
  - **$20.00 per book**
  - **$4.95 shipping & handling per order**
  - **Applicable tax calculated separately**
- Stripe-hosted Checkout
- GitHub-backed merchandising settings
- Paid-order center at `/admin/orders`
- Stripe webhook fulfillment handler
- Private Google Sheets ledger integration
- Optional fulfillment-provider webhook
- No fabricated testimonials or urgency

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Validation:

```bash
npm run typecheck
npm run check:pricing
npm run build
```

## Admin

- Storefront settings: `/admin`
- Paid orders: `/admin/orders`

The admin writes `data/site-settings.json` through the GitHub Contents API. It does not rely on Vercel filesystem persistence.

## Operations

See [Production setup](docs/PRODUCTION_SETUP.md) for:

- Fine-grained GitHub token permissions
- Stripe live key and automatic tax
- Google Apps Script order ledger
- Stripe webhook events and signing secret
- Optional print-on-demand or 3PL integration
- Controlled launch acceptance

## Repository materialization

The production source bundle is stored in the split `.powernow/part*` bundle and materialized by `bootstrap.mjs` during `npm install`. Public merchandising settings, the operational setup guide, and the Google Apps Script ledger remain directly editable in the repository.

Archive SHA-256:

```text
005b4f0de2f59932a8104178a80ae71c1d4249109cabdcfaf251ad337444934a
```

`data/site-settings.json` remains outside the archive so the GitHub-backed admin can update it without rebuilding the application source.
