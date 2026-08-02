import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/src/lib/money";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipping & returns | Power NOW",
  robots: { index: false, follow: false }
};

export default async function ShippingReturnsPage() {
  const settings = await loadStorefrontSettings();

  return (
    <main className="legal-page">
      <header className="simple-header">
        <Link href="/" className="brand-lockup">
          <span>{settings.brand.seriesName}</span>
          <small>Order policies</small>
        </Link>
        <Link href="/#buy" className="button button-secondary">
          Buy direct
        </Link>
      </header>

      <article className="legal-shell">
        <p className="eyebrow">Direct book orders</p>
        <h1>Shipping &amp; returns</h1>
        <p className="legal-lede">
          Clear expectations for physical copies of{" "}
          {settings.product.title} purchased through this
          storefront.
        </p>

        <h2>Pricing and tax</h2>
        <p>
          Each book is{" "}
          {formatMoney(
            settings.product.priceCents,
            settings.product.currency
          )}
          . Shipping and handling is{" "}
          {formatMoney(
            settings.product.shippingCents,
            settings.product.currency
          )}{" "}
          once per order. Applicable sales tax is calculated
          separately at checkout based on Stripe Tax settings,
          registrations, and the customer&apos;s location.
        </p>

        <h2>Shipping</h2>
        <p>
          Direct orders currently ship to U.S. addresses.{" "}
          {settings.product.estimatedShipWindow}. Delivery timing
          can be affected by destination, inventory, fulfillment
          volume, and carrier conditions.
        </p>

        <h2>Changes and cancellations</h2>
        <p>
          Email{" "}
          <a href={`mailto:${settings.brand.contactEmail}`}>
            {settings.brand.contactEmail}
          </a>{" "}
          as soon as possible with the Stripe order reference.
          Address changes or cancellation cannot be guaranteed
          after fulfillment has started.
        </p>

        <h2>Damaged, incorrect, or missing books</h2>
        <p>
          Contact support promptly and include the order reference
          and clear photos when applicable. After the order and
          carrier details are reviewed, an eligible order may be
          replaced or refunded.
        </p>

        <h2>Other returns</h2>
        <p>
          Contact support before sending a book back. Return
          eligibility depends on the item&apos;s condition, the
          circumstances of the order, and applicable law.
          Authorized refunds are issued to the original payment
          method after any required return is received and
          reviewed.
        </p>
      </article>
    </main>
  );
}
