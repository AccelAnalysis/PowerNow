# Power NOW current production status

Updated: 2026-08-02

## Live storefront and checkout

- Storefront: `https://power-now.vercel.app`
- Book price: **$20.00 per copy**
- Shipping and handling: **$4.95 once per order**
- Tax: **applicable sales tax is calculated and displayed separately in Stripe**
- Published cover source: `/api/book-cover`, backed by the Amazon edition for ASIN `B0H3PJ8GT8`
- Interface palette: derived in the browser from the published cover, with neutral fallbacks

Active Stripe catalog:

- Book Product: `prod_UzoKNuyI2AYWzx`
- Book Price: `price_1TzomYAhUpL6HYCQbfVTOL3j`
- Shipping Product: `prod_UzvLF2A1vJMUf8`
- Shipping Price: `price_1TzvUbAhUpL6HYCQ0H9KcMax`
- Active Payment Link: `plink_1TzvV6AhUpL6HYCQzoOstecc`
- Active checkout URL: `https://book.stripe.com/9B67sKb9m1PQ7x92AHcMM01`

The active checkout uses separate book and shipping line items. Book quantity can be adjusted from 1–10; the shipping line remains quantity 1. Automatic tax is enabled. The shipping product uses Stripe’s Shipping tax code so Stripe can apply jurisdiction-specific shipping treatment.

The retired Payment Link `plink_1Tzon3AhUpL6HYCQulSTqOVM` is inactive.

## GitHub-backed administration

The durable settings record is:

```text
data/site-settings.json
```

Production reads and writes:

```text
Repository: AccelAnalysis/PowerNow
Branch: main
```

The admin page supports two secure modes:

1. A session-only fine-grained GitHub token entered when saving. It must be restricted to this repository with **Contents: Read and write**.
2. A server-held `GITHUB_TOKEN` in Vercel, protected by an independent `ADMIN_TOKEN`.

The second mode is recommended for routine administration. Until those two Vercel variables are present, GitHub persistence remains operational through the session-token mode rather than an unauthenticated server credential.

## Implemented automatic order workflow

The production application includes:

- `POST /api/stripe/webhook`
- `POST /api/fulfillment/callback`
- `/admin/orders`
- `GET/PATCH/POST /api/admin/orders`
- a private Google Sheets receiver at `integrations/google-apps-script/PowerNowOrderLedger.gs`

The Stripe webhook handles:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `charge.refunded`

A verified paid order is normalized with separate book subtotal, shipping, tax, discounts, total, customer, ship-to, quantity, affiliate reference, and fulfillment state. It can then be HMAC-signed and sent independently to:

- a private order ledger through `ORDER_LEDGER_WEBHOOK_URL`
- a physical fulfillment or workflow provider through `FULFILLMENT_WEBHOOK_URL`

Deliveries use stable idempotency keys. Successful ledger and provider deliveries are checkpointed separately in Stripe Checkout Session metadata. Provider callbacks can update production, shipment, carrier, tracking, and delivery status and mirror those changes into the private ledger.

## Activation still requiring business-owned credentials

These values must be stored as Vercel production environment variables and followed by a production redeployment:

```text
NEXT_PUBLIC_SITE_URL=https://power-now.vercel.app
CONFIG_READ_MODE=github
CONFIG_WRITE_MODE=github
GITHUB_REPO=AccelAnalysis/PowerNow
GITHUB_BRANCH=main
SETTINGS_FILE_PATH=data/site-settings.json
GITHUB_TOKEN=<fine-grained repository token>
ADMIN_TOKEN=<independent long passphrase>
STRIPE_SECRET_KEY=<live server or appropriately restricted Stripe key>
STRIPE_WEBHOOK_SECRET=<the whsec value for this exact endpoint>
STRIPE_AUTOMATIC_TAX=true
ORDER_LEDGER_WEBHOOK_URL=<private Google Apps Script Web App URL>
ORDER_LEDGER_SIGNING_SECRET=<shared ledger signing secret>
FULFILLMENT_WEBHOOK_URL=<provider or workflow endpoint>
FULFILLMENT_WEBHOOK_SIGNING_SECRET=<outbound provider secret>
FULFILLMENT_CALLBACK_SIGNING_SECRET=<provider callback secret>
```

No live Stripe webhook endpoint is presently registered, because Stripe returns the endpoint signing secret only when the endpoint is created and the available Vercel connector cannot securely write environment variables. The safe activation order is:

1. Add `STRIPE_SECRET_KEY` to Vercel.
2. Create the live Stripe destination at `https://power-now.vercel.app/api/stripe/webhook` for the four events above.
3. Immediately store the returned `whsec_...` value in Vercel as `STRIPE_WEBHOOK_SECRET`.
4. Add the ledger/provider URLs and signing secrets.
5. Redeploy production.
6. Send a Stripe test event, complete one controlled live order, and verify idempotent ledger and provider delivery.

## Physical fulfillment inputs still required

The application can dispatch and track an order, but no system can print, pick, pack, label, or ship until a provider or internal workflow is selected and supplied with:

- provider account and API credentials
- SKU mapping for `clarity-creates-speed-paperback`
- either inventory location or print-ready interior and full-wrap cover files
- trim size, binding, paper, bleed, spine, and color specifications
- finished weight and package dimensions
- ship-from and return addresses
- shipping-service rules
- print/postage billing authorization
- provider idempotency behavior
- tracking callback mapping
- customer shipment-notification responsibility

## Tax boundary

Automatic tax is enabled on the active checkout, but the connected Stripe account currently has no tax registrations. Stripe Tax origin, registrations, filing, and remittance settings must be completed according to Accel Analysis’s actual obligations before tax collection is treated as fully operational.
