import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { normalizeReferralCode } from "@/src/lib/referral";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckoutPayload = {
  productId?: string;
  quantity?: number;
  affiliateRef?: string;
  checkoutAttemptId?: string;
};

function originFromRequest(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
    } catch {
      // Fall through to the request origin.
    }
  }
  return new URL(request.url).origin;
}

function parseQuantity(value: unknown, purchaseLimit: number): number | null {
  const quantity = Number(value ?? 1);
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) return null;
  if (quantity < 1 || quantity > Math.min(purchaseLimit, 10)) return null;
  return quantity;
}

function normalizeAttemptId(value: unknown): string {
  if (typeof value !== "string") return "";
  return /^[A-Za-z0-9_-]{8,80}$/.test(value) ? value : "";
}

export async function POST(request: Request) {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > 10_000) {
    return NextResponse.json({ error: "Checkout request is too large." }, { status: 413 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Secure checkout is temporarily unavailable. Please contact order support." },
      { status: 503 }
    );
  }

  const settings = await loadStorefrontSettings();
  const payload = (await request.json().catch(() => ({}))) as CheckoutPayload;

  if (payload.productId !== settings.product.id) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  const quantity = parseQuantity(payload.quantity, settings.product.purchaseLimit);
  if (!quantity) {
    return NextResponse.json({ error: "Choose a valid quantity between 1 and 10." }, { status: 400 });
  }

  const affiliateRef = normalizeReferralCode(payload.affiliateRef);
  const checkoutAttemptId = normalizeAttemptId(payload.checkoutAttemptId);
  const referenceSeed = checkoutAttemptId || randomUUID();
  const orderReference = `PN-${referenceSeed.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const origin = originFromRequest(request);
  const stripe = new Stripe(secretKey);
  const automaticTaxEnabled = process.env.STRIPE_AUTOMATIC_TAX === "true";

  type SessionCreateParams = NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>;
  type SessionLineItem = NonNullable<SessionCreateParams["line_items"]>[number];
  type SessionPriceData = NonNullable<SessionLineItem["price_data"]>;
  type ShippingAddressCollection = NonNullable<SessionCreateParams["shipping_address_collection"]>;
  type AllowedCountry = ShippingAddressCollection["allowed_countries"][number];

  const allowedCountries = settings.checkout.allowedCountries
    .map((country) => country.trim().toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country))
    .slice(0, 50) as AllowedCountry[];

  const priceData: SessionPriceData = {
    currency: settings.product.currency,
    unit_amount: settings.product.priceCents,
    tax_behavior: automaticTaxEnabled ? "exclusive" : undefined
  };

  if (settings.product.stripeProductId) {
    priceData.product = settings.product.stripeProductId;
  } else {
    priceData.product_data = {
      name: settings.product.title,
      description: `${settings.product.editionLabel} · ${settings.product.subtitle}`,
      images: [settings.imagery.bookCoverUrl],
      tax_code:
        automaticTaxEnabled && process.env.STRIPE_TAX_CODE
          ? process.env.STRIPE_TAX_CODE
          : undefined,
      metadata: {
        product_id: settings.product.id,
        asin: settings.product.asin
      }
    };
  }

  const sessionParams: SessionCreateParams = {
    mode: "payment",
    submit_type: "pay",
    locale: "auto",
    client_reference_id: orderReference,
    line_items: [{ quantity, price_data: priceData }],
    shipping_address_collection: {
      allowed_countries: allowedCountries.length ? allowedCountries : ["US"]
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Standard shipping & handling",
          fixed_amount: {
            amount: settings.product.shippingCents,
            currency: settings.product.currency
          },
          tax_behavior: automaticTaxEnabled ? "exclusive" : undefined,
          tax_code: automaticTaxEnabled ? "txcd_92010001" : undefined
        }
      }
    ],
    custom_text: {
      shipping_address: {
        message: "Power NOW books currently ship to United States addresses."
      },
      submit: {
        message: "You will receive a Stripe confirmation after payment is completed."
      }
    },
    allow_promotion_codes: settings.checkout.allowPromotionCodes,
    billing_address_collection: "auto",
    phone_number_collection: { enabled: settings.checkout.collectPhone },
    automatic_tax: automaticTaxEnabled ? { enabled: true } : undefined,
    metadata: {
      order_reference: orderReference,
      product_id: settings.product.id,
      affiliate_ref: affiliateRef,
      quantity: String(quantity),
      unit_price_cents: String(settings.product.priceCents),
      shipping_cents: String(settings.product.shippingCents),
      source: "powernow_direct_storefront"
    },
    payment_intent_data: {
      description: `${settings.product.title} — direct author purchase`,
      statement_descriptor_suffix: "POWER NOW",
      metadata: {
        order_reference: orderReference,
        product_id: settings.product.id,
        affiliate_ref: affiliateRef,
        quantity: String(quantity),
        source: "powernow_direct_storefront"
      }
    },
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`
  };

  try {
    const session = await stripe.checkout.sessions.create(
      sessionParams,
      checkoutAttemptId ? { idempotencyKey: `powernow_${checkoutAttemptId}` } : undefined
    );

    if (!session.url) throw new Error("Stripe did not return a hosted Checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Power NOW Checkout Session creation failed", {
      message: error instanceof Error ? error.message : "Unknown Stripe error",
      productId: settings.product.id,
      quantity,
      orderReference
    });

    return NextResponse.json(
      { error: "Checkout could not be started. Please try again in a moment." },
      { status: 500 }
    );
  }
}
