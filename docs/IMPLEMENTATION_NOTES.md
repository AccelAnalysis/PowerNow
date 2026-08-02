# Implementation Notes

## Brand and conversion direction

The site follows a minimalist, high-converting book-sales structure:

- Serif-led display typography with a highly legible sans-serif body font.
- Warm off-white background, charcoal text, and restrained gold accent.
- Generous negative space instead of heavy card borders.
- Full-width atmospheric imagery with editable URLs.
- Low-pressure calls to action: read the sample, enter the framework, buy direct.
- No fabricated testimonial quotes. Testimonial rendering is supported, but the default list is empty.

## Storefront architecture

`data/site-settings.json` is the merchandising control surface. It includes brand, SEO, product, copy, imagery, proof, framework, checkout, and affiliate settings.

`src/lib/settings.ts` merges that file with safe defaults and provides local or GitHub-backed writes.

## Checkout architecture

`app/api/checkout/route.ts` creates Stripe Checkout Sessions from the active admin-managed product price and shipping settings. It uses `price_data`, so price changes do not require creating a new Stripe Price object.

The route collects a shipping address, attaches fixed shipping and handling, supports promotion codes, and passes referral metadata into the Stripe Session and PaymentIntent.

## Affiliate architecture

`components/ReferralCapture.tsx` captures referral codes from:

- `?ref=`
- `?affiliate=`
- `?via=`

`components/CheckoutButton.tsx` sends the stored referral code into `/api/checkout`.

## Admin architecture

`/admin` is intentionally lightweight and protected by a server-side `ADMIN_TOKEN` for write operations. Public settings can be loaded without a secret because the content is already used on the public storefront. Writes require the token.

## Known production extension points

- Durable order database or fulfillment integration.
- True affiliate ledger and payout workflow.
- Email capture and launch sequence.
- Multi-book product catalog when future Power NOW books are ready.
- Replacement of stock book mockup texture with final cover art.
