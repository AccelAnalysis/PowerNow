import { NextResponse } from "next/server";
import Stripe from "stripe";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckoutPayload = {
  productId?: string;
  quantity?: number;
  affiliateRef?: string;
};

function originFromRequest(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY." }, { status: 503 });
  }

  const settings = await loadStorefrontSettings();
  const payload = (await request.json().catch(() => ({}))) as CheckoutPayload;

  if (payload.productId && payload.productId !== settings.product.id) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  const quantity = Math.min(Math.max(Number(payload.quantity ?? 1), 1), settings.product.purchaseLimit);
  const affiliateRef = payload.affiliateRef?.slice(0, 80) ?? "";
  const origin = originFromRequest(request);
  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity,
          price_data: {
            currency: settings.product.currency,
            unit_amount: settings.product.priceCents,
            product_data: {
              name: settings.product.title,
              description: `${settings.product.editionLabel} · ${settings.product.subtitle}`,
              images: [settings.imagery.bookCoverUrl],
              metadata: {
                product_id: settings.product.id,
                asin: settings.product.asin
              }
            }
          }
        }
      ],
      shipping_address_collection: {
        allowed_countries: settings.checkout.allowedCountries as any
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
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 5 }
            }
          }
        }
      ],
      allow_promotion_codes: settings.checkout.allowPromotionCodes,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: settings.checkout.collectPhone },
      invoice_creation: { enabled: true },
      automatic_tax: process.env.STRIPE_AUTOMATIC_TAX === "true" ? { enabled: true } : undefined,
      metadata: {
        product_id: settings.product.id,
        affiliate_ref: affiliateRef,
        quantity: String(quantity),
        unit_price_cents: String(settings.product.priceCents),
        shipping_cents: String(settings.product.shippingCents),
        source: "powernow_direct_storefront"
      },
      payment_intent_data: {
        metadata: {
          product_id: settings.product.id,
          affiliate_ref: affiliateRef,
          quantity: String(quantity),
          source: "powernow_direct_storefront"
        }
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe Checkout could not be created." },
      { status: 500 }
    );
  }
}
