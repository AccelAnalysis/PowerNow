import { NextResponse } from "next/server";
import {
  getSettingsPersistenceInfo,
  loadStorefrontSettings
} from "@/src/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await loadStorefrontSettings();
  const persistence = getSettingsPersistenceInfo();
  const dynamicCheckout = Boolean(
    process.env.STRIPE_SECRET_KEY
  );
  const webhook = Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET
  );
  const ledger = Boolean(
    process.env.ORDER_LEDGER_WEBHOOK_URL &&
      process.env.ORDER_LEDGER_SIGNING_SECRET
  );
  const fulfillmentProvider = Boolean(
    process.env.FULFILLMENT_WEBHOOK_URL &&
      process.env.FULFILLMENT_WEBHOOK_SIGNING_SECRET
  );

  return NextResponse.json(
    {
      ok: true,
      service: "power-now-storefront",
      pricing: {
        bookPriceCents: settings.product.priceCents,
        shippingCents: settings.product.shippingCents,
        taxPresentation: "separate"
      },
      cover: {
        source: "/api/book-cover",
        paletteFromCover: settings.theme.useCoverPalette
      },
      checkout: {
        available: Boolean(
          dynamicCheckout || settings.checkout.paymentLinkUrl
        ),
        mode: dynamicCheckout
          ? "dynamic_checkout_session"
          : "fixed_payment_link_fallback",
        automaticTaxRequested:
          process.env.STRIPE_AUTOMATIC_TAX !== "false"
      },
      admin: {
        persistence: persistence.writeMode,
        repository: persistence.repository,
        branch: persistence.branch,
        serverTokenConfigured: persistence.tokenConfigured,
        sessionTokenSupported: true
      },
      automation: {
        stripeWebhookConfigured: webhook,
        paidOrderLedgerConfigured: ledger,
        fulfillmentProviderConfigured: fulfillmentProvider,
        stripeOrderCenterAvailable: dynamicCheckout
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
