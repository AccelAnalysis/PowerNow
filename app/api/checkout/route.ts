import { NextResponse } from "next/server";
import Stripe from "stripe";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutPayload = {
  productId?: string;
  quantity?: number;
  affiliateRef?: string;
};

function requestOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProtocol =
    request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProtocol}://${forwardedHost}`;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function paymentLinkUrl(
  base: string,
  affiliateRef: string
): string {
  const url = new URL(base);
  if (affiliateRef) {
    url.searchParams.set("client_reference_id", affiliateRef);
    url.searchParams.set("utm_source", "affiliate");
    url.searchParams.set("utm_campaign", "power_now_direct");
  }
  return url.toString();
}

export async function POST(request: Request) {
  const settings = await loadStorefrontSettings();
  const payload = (await request.json().catch(() => ({}))) as CheckoutPayload;

  if (payload.productId && payload.productId !== settings.product.id) {
    return NextResponse.json(
      { error: "Unknown product." },
      { status: 400 }
    );
  }

  const parsedQuantity = Number(payload.quantity ?? 1);
  const quantity = Number.isFinite(parsedQuantity)
    ? Math.min(
        settings.product.purchaseLimit,
        Math.max(1, Math.round(parsedQuantity))
      )
    : 1;
  const affiliateRef = String(payload.affiliateRef ?? "")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 80);

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || !settings.checkout.preferDynamicCheckout) {
    return NextResponse.json({
      url: paymentLinkUrl(
        settings.checkout.paymentLinkUrl,
        affiliateRef
      ),
      mode: "payment_link",
      pricing: {
        bookPriceCents: settings.product.priceCents,
        shippingCents: settings.product.shippingCents,
        tax: "calculated_separately_when_applicable"
      }
    });
  }

  const stripe = new Stripe(secretKey);
  const origin = requestOrigin(request);
  const automaticTax =
    process.env.STRIPE_AUTOMATIC_TAX !== "false";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "book",
      customer_creation: "always",
      client_reference_id: affiliateRef || undefined,
      line_items: [
        {
          quantity,
          price_data: {
            currency: settings.product.currency,
            unit_amount: settings.product.priceCents,
            tax_behavior: "exclusive",
            product_data: {
              name: settings.product.title,
              description: `${settings.product.editionLabel} · ${settings.product.subtitle}`,
              images: [`${origin}/api/book-cover`],
              tax_code: "txcd_35010000",
              metadata: {
                product_id: settings.product.id,
                asin: settings.product.asin
              }
            }
          }
        }
      ],
      shipping_address_collection: {
        allowed_countries: settings.checkout.allowedCountries as never
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Shipping & handling",
            fixed_amount: {
              amount: settings.product.shippingCents,
              currency: settings.product.currency
            },
            tax_behavior: "exclusive",
            tax_code: "txcd_92010001",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 }
            }
          }
        }
      ],
      automatic_tax: automaticTax ? { enabled: true } : undefined,
      billing_address_collection: "auto",
      phone_number_collection: {
        enabled: settings.checkout.collectPhone
      },
      allow_promotion_codes:
        settings.checkout.allowPromotionCodes,
      custom_text: {
        submit: {
          message:
            "Book price, shipping and handling, and applicable sales tax are shown separately before payment."
        },
        shipping_address: {
          message:
            "Direct orders currently ship to U.S. addresses. Please verify the address before paying."
        }
      },
      metadata: {
        source: "powernow_direct_storefront",
        product_id: settings.product.id,
        quantity: String(quantity),
        affiliate_ref: affiliateRef,
        unit_price_cents: String(settings.product.priceCents),
        shipping_cents: String(settings.product.shippingCents),
        fulfillment_status: "AWAITING_PAYMENT"
      },
      payment_intent_data: {
        metadata: {
          source: "powernow_direct_storefront",
          product_id: settings.product.id,
          quantity: String(quantity),
          affiliate_ref: affiliateRef
        }
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.json({
      url: session.url,
      mode: "checkout_session",
      pricing: {
        bookPriceCents: settings.product.priceCents,
        shippingCents: settings.product.shippingCents,
        tax: "calculated_separately_when_applicable"
      }
    });
  } catch (error) {
    console.error(
      "Power NOW Checkout Session creation failed:",
      error instanceof Error ? error.message : error
    );

    // Keep sales available through the reviewed fixed-price Payment Link.
    return NextResponse.json({
      url: paymentLinkUrl(
        settings.checkout.paymentLinkUrl,
        affiliateRef
      ),
      mode: "payment_link_fallback",
      warning:
        "Dynamic checkout was unavailable; the fixed $20 book price and $4.95 shipping-and-handling Payment Link was used.",
      pricing: {
        bookPriceCents: settings.product.priceCents,
        shippingCents: settings.product.shippingCents,
        tax: "calculated_separately_when_applicable"
      }
    });
  }
}
