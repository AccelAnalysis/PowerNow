import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getBookBySlug,
  isBookPurchasable,
  loadSeriesCatalog,
  type SeriesBook
} from "@/src/lib/books";
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
  const forwardedProtocol = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProtocol}://${forwardedHost}`;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function paymentLinkUrl(base: string, affiliateRef: string): string {
  const url = new URL(base);
  if (affiliateRef) {
    url.searchParams.set("client_reference_id", affiliateRef);
    url.searchParams.set("utm_source", "affiliate");
    url.searchParams.set("utm_campaign", "power_now_direct");
  }
  return url.toString();
}

function absoluteCover(book: SeriesBook, origin: string): string | undefined {
  const value = book.coverUrl.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return undefined;
}

export async function POST(request: Request) {
  const [settings, catalog] = await Promise.all([
    loadStorefrontSettings(),
    loadSeriesCatalog()
  ]);
  const payload = (await request.json().catch(() => ({}))) as CheckoutPayload;
  const requested = String(payload.productId ?? "").trim();

  let book = requested ? getBookBySlug(catalog, requested) : undefined;
  if (!book && requested === settings.product.id) {
    book = getBookBySlug(catalog, catalog.series.featuredBookSlug);
  }
  if (!book && !requested) {
    book = getBookBySlug(catalog, catalog.series.featuredBookSlug);
  }
  if (!book) {
    return NextResponse.json({ error: "Unknown book." }, { status: 400 });
  }
  if (!isBookPurchasable(book)) {
    return NextResponse.json(
      { error: `${book.title} is not currently available for purchase.` },
      { status: 409 }
    );
  }

  const parsedQuantity = Number(payload.quantity ?? 1);
  const quantity = Number.isFinite(parsedQuantity)
    ? Math.min(book.purchaseLimit, Math.max(1, Math.round(parsedQuantity)))
    : 1;
  const affiliateRef = String(payload.affiliateRef ?? "")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 80);
  const paymentLink =
    book.paymentLinkUrl ||
    (book.slug === catalog.series.featuredBookSlug
      ? settings.checkout.paymentLinkUrl
      : "");

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || !settings.checkout.preferDynamicCheckout) {
    if (!paymentLink) {
      return NextResponse.json(
        {
          error:
            "This book is marked available but does not yet have a Stripe Payment Link."
        },
        { status: 503 }
      );
    }
    return NextResponse.json({
      url: paymentLinkUrl(paymentLink, affiliateRef),
      mode: "payment_link",
      bookSlug: book.slug,
      pricing: {
        bookPriceCents: book.priceCents,
        shippingCents: book.shippingCents,
        tax: "calculated_separately_when_applicable"
      }
    });
  }

  const stripe = new Stripe(secretKey);
  const origin = requestOrigin(request);
  const automaticTax = process.env.STRIPE_AUTOMATIC_TAX !== "false";
  const cover = absoluteCover(book, origin);

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
            currency: book.currency,
            unit_amount: book.priceCents,
            tax_behavior: "exclusive",
            product_data: {
              name: book.title,
              description: `${book.editionLabel} · ${book.subtitle}`,
              images: cover ? [cover] : undefined,
              tax_code: "txcd_35010000",
              metadata: {
                book_slug: book.slug,
                product_id: book.stripeProductId || book.slug,
                asin: book.asin
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
              amount: book.shippingCents,
              currency: book.currency
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
      phone_number_collection: { enabled: settings.checkout.collectPhone },
      allow_promotion_codes: settings.checkout.allowPromotionCodes,
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
        book_slug: book.slug,
        product_id: book.stripeProductId || book.slug,
        quantity: String(quantity),
        affiliate_ref: affiliateRef,
        unit_price_cents: String(book.priceCents),
        shipping_cents: String(book.shippingCents),
        fulfillment_status: "AWAITING_PAYMENT"
      },
      payment_intent_data: {
        metadata: {
          source: "powernow_direct_storefront",
          book_slug: book.slug,
          product_id: book.stripeProductId || book.slug,
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
      bookSlug: book.slug,
      pricing: {
        bookPriceCents: book.priceCents,
        shippingCents: book.shippingCents,
        tax: "calculated_separately_when_applicable"
      }
    });
  } catch (error) {
    console.error(
      "Power NOW Checkout Session creation failed:",
      error instanceof Error ? error.message : error
    );

    if (!paymentLink) {
      return NextResponse.json(
        { error: "Secure checkout is temporarily unavailable for this book." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      url: paymentLinkUrl(paymentLink, affiliateRef),
      mode: "payment_link_fallback",
      bookSlug: book.slug,
      warning:
        "Dynamic checkout was unavailable; the configured fixed-price Payment Link was used.",
      pricing: {
        bookPriceCents: book.priceCents,
        shippingCents: book.shippingCents,
        tax: "calculated_separately_when_applicable"
      }
    });
  }
}
