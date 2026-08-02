import type { Metadata } from "next";
import Link from "next/link";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const metadata: Metadata = {
  title: "Privacy | Power NOW",
  robots: { index: false, follow: false }
};

export default async function PrivacyPage() {
  const settings = await loadStorefrontSettings();

  return (
    <main className="legal-page">
      <header className="simple-header">
        <Link href="/" className="brand-lockup">
          <span>{settings.brand.seriesName}</span>
          <small>Privacy</small>
        </Link>
        <Link href="/" className="button button-secondary">
          Return home
        </Link>
      </header>
      <article className="legal-shell">
        <p className="eyebrow">Privacy notice</p>
        <h1>Information used to complete a direct order</h1>
        <p className="legal-lede">
          The storefront minimizes the customer information it
          stores directly.
        </p>
        <h2>Checkout information</h2>
        <p>
          Stripe collects payment, contact, and shipping
          information needed to process the transaction and
          deliver the physical book. The Power NOW storefront does
          not receive or store full payment-card details.
        </p>
        <h2>Fulfillment information</h2>
        <p>
          After payment, order and shipping details may be sent to
          a private fulfillment ledger and an authorized shipping,
          print-on-demand, or logistics provider. These records are
          used to fulfill, support, reconcile, or refund the order.
          Customer order data is not written into the public
          PowerNow source repository.
        </p>
        <h2>Affiliate attribution</h2>
        <p>
          A referral code may be stored in the visitor&apos;s
          browser for the stated attribution period and passed to
          Stripe as an order reference. It does not contain payment
          information.
        </p>
        <h2>Questions</h2>
        <p>
          Contact{" "}
          <a href={`mailto:${settings.brand.contactEmail}`}>
            {settings.brand.contactEmail}
          </a>
          .
        </p>
      </article>
    </main>
  );
}
