# Power NOW production operations

This release separates four responsibilities:

1. **GitHub** is the durable merchandising source for public copy, pricing, and imagery.
2. **Stripe Checkout** is the payment and tax-calculation surface.
3. **Stripe events** are the authoritative paid-order trigger.
4. **A private ledger and/or fulfillment provider** receives normalized paid orders.

## 1. GitHub-backed storefront administration

The public settings file is:

```text
data/site-settings.json
```

The website reads that file from:

```text
AccelAnalysis/PowerNow · main
```

The admin screen is:

```text
/admin
```

### Fine-grained token

Create a fine-grained GitHub personal access token restricted to:

- Repository: `AccelAnalysis/PowerNow`
- Repository permission: **Contents — Read and write**
- No organization-wide or account-administration permissions

There are two supported operating modes:

**Session-only token**

Paste the token into `/admin` only when saving. The browser keeps it in component memory and clears it after a successful commit. It is not written to local storage or the repository.

**Server token**

Add the token to Vercel as `GITHUB_TOKEN`, then also configure a strong `ADMIN_TOKEN`. In this mode the admin enters only the admin passphrase and the server performs the GitHub write.

Recommended production variables:

```text
CONFIG_READ_MODE=github
CONFIG_WRITE_MODE=github
GITHUB_REPO=AccelAnalysis/PowerNow
GITHUB_BRANCH=main
SETTINGS_FILE_PATH=data/site-settings.json
GITHUB_TOKEN=<fine-grained token>
ADMIN_TOKEN=<long random passphrase>
```

Because the public site reads GitHub at request time, an accepted settings commit does not depend on Vercel's temporary filesystem.

## 2. Stripe Checkout and tax

Add the live Stripe secret key to Vercel:

```text
STRIPE_SECRET_KEY=<live server key>
STRIPE_AUTOMATIC_TAX=true
```

With the key configured, the site creates Checkout Sessions dynamically from the GitHub-managed price. The existing Payment Link remains a fixed-price fallback.

The customer sees separate lines for:

- Book price per copy
- Shipping and handling once per order
- Applicable sales tax

### Stripe Tax

Automatic tax calculation can be enabled before every jurisdiction has a registration, but Stripe applies tax based on configured registrations. Complete the business origin and registration setup in Stripe Tax before treating collection as legally complete.

## 3. Automatic paid-order ledger

The supplied Google Apps Script creates a private Sheets ledger after payment:

```text
integrations/google-apps-script/PowerNowOrderLedger.gs
```

Setup:

1. Create a private Google Sheet.
2. Open **Extensions → Apps Script**.
3. Replace the script with `PowerNowOrderLedger.gs`.
4. In **Project Settings → Script properties**, add:
   - `POWER_NOW_SPREADSHEET_ID`
   - `POWER_NOW_LEDGER_SECRET`
   - `POWER_NOW_NOTIFICATION_EMAIL` (optional)
5. Deploy as a Web App:
   - Execute as: **Me**
   - Access: **Anyone**
6. Copy the Web App URL.
7. Add these Vercel variables:
   - `ORDER_LEDGER_WEBHOOK_URL`
   - `ORDER_LEDGER_SIGNING_SECRET`

The URL can be publicly reachable because each payload is HMAC-signed and time-limited. Keep the signing secret private.

The script:

- Verifies the signed envelope
- Upserts by Checkout Session or event ID
- Writes payment, line-item, tax, shipping, customer, and fulfillment fields
- Marks new paid orders `READY_TO_FULFILL`
- Sends an optional operational email

No customer information is written into the public PowerNow repository.

## 4. Production Stripe webhook

The application endpoint is:

```text
https://power-now.vercel.app/api/stripe/webhook
```

Create a live Stripe webhook destination for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `charge.refunded`

Copy the generated endpoint signing secret into Vercel:

```text
STRIPE_WEBHOOK_SECRET=<whsec value>
```

The endpoint verifies Stripe's signature before acting. A failed downstream ledger or fulfillment delivery returns a non-success response so Stripe can retry.

The handler is idempotency-oriented:

- Paid Checkout Session ID is the operational order identity.
- Ledger deliveries use `ledger:<session-id>`.
- Fulfillment deliveries use `fulfillment:<session-id>`.
- The Google Sheet upserts instead of duplicating rows.
- Downstream fulfillment systems should honor the `Idempotency-Key` header.

## 5. Fulfillment beyond the ledger

The Google Sheet and email notification remove manual Stripe Dashboard reconciliation, but they do not physically print, pack, label, or ship a book.

For hands-off physical fulfillment, configure a print-on-demand, 3PL, shipping, or workflow provider that accepts an HTTPS order webhook. Then set:

```text
FULFILLMENT_WEBHOOK_URL=<provider or workflow endpoint>
FULFILLMENT_WEBHOOK_SIGNING_SECRET=<shared secret>
```

The same normalized, signed paid-order payload is sent to that endpoint.

Before enabling an automatic shipment provider, confirm:

- Product/SKU mapping for `clarity-creates-speed-paperback`
- Inventory source or print-ready interior and cover files
- Ship-from identity
- Shipping service rules
- Return address
- Label and postage billing authorization
- Idempotency behavior
- Tracking-number callback method
- Customer notification responsibility

The `/admin/orders` page can be used immediately as a protected order center and can resend a paid order after an integration failure.

## 6. Acceptance sequence

1. Add Vercel secrets.
2. Redeploy production.
3. Confirm `/api/health` reports:
   - dynamic Checkout available
   - webhook configured
   - ledger configured
4. Use Stripe test mode first with a separate test webhook and test sheet.
5. Complete one controlled live purchase.
6. Verify:
   - Stripe shows book, shipping, and tax separately
   - The ledger receives one row
   - The fulfillment notification arrives
   - A duplicate event updates rather than duplicates the row
   - Order Center shows the paid order
   - Refund events reach the ledger
7. Only then enable an automatic 3PL or print provider.
