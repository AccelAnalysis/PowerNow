import type { Metadata } from "next";
import Link from "next/link";
import Stripe from "stripe";
import { dispatchCheckoutSession } from "@/src/lib/orders";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order received | Power NOW",
  robots: { index: false, follow: false }
};

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const settings = await loadStorefrontSettings();
  const { session_id: sessionId } = await searchParams;
  let operationalMessage =
    "Stripe has recorded your payment. Your receipt itemizes the book, shipping and handling, and applicable tax separately.";

  if (
    sessionId?.startsWith("cs_") &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const result = await dispatchCheckoutSession({
        stripe,
        sessionId,
        eventId: `redirect:${sessionId}`,
        eventType: "checkout.success_redirect"
      });
      operationalMessage =
        result.fulfillment === "sent"
          ? "Payment is confirmed and the order has been submitted to the configured fulfillment provider."
          : result.ledger === "sent"
            ? "Payment is confirmed and the order has been added to the fulfillment ledger."
            : "Payment is confirmed and the order is available in the paid-order center.";
    } catch {
      // The Stripe webhook remains the authoritative fulfillment trigger.
      operationalMessage =
        "Payment is confirmed. The secure Stripe webhook will continue processing the fulfillment record.";
    }
  }

  return (
    <main className="status-page">
      <section>
        <p className="eyebrow">Order received</p>
        <h1>Thank you for moving now.</h1>
        <p>{operationalMessage}</p>
        <p>
          {settings.product.estimatedShipWindow}. Questions can be
          sent to{" "}
          <a href={`mailto:${settings.brand.contactEmail}`}>
            {settings.brand.contactEmail}
          </a>
          .
        </p>
        <div className="status-actions">
          <Link href="/" className="button button-primary">
            Return to the book
          </Link>
          <Link
            href="/shipping-returns"
            className="button button-secondary"
          >
            Shipping &amp; returns
          </Link>
        </div>
      </section>
    </main>
  );
}
