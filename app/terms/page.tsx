import type { Metadata } from "next";
import Link from "next/link";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const metadata: Metadata = {
  title: "Terms | Power NOW",
  robots: { index: false, follow: false }
};

export default async function TermsPage() {
  const settings = await loadStorefrontSettings();

  return (
    <main className="legal-page">
      <header className="simple-header">
        <Link href="/" className="brand-lockup">
          <span>{settings.brand.seriesName}</span>
          <small>Terms</small>
        </Link>
        <Link href="/" className="button button-secondary">
          Return home
        </Link>
      </header>
      <article className="legal-shell">
        <p className="eyebrow">Direct-order terms</p>
        <h1>Book-storefront terms</h1>
        <p className="legal-lede">
          These terms apply to purchases made through the Power
          NOW direct-sales website.
        </p>
        <h2>Pricing</h2>
        <p>
          The book price, shipping-and-handling charge, discounts,
          and applicable tax are itemized before payment. A
          purchase is not complete until Stripe confirms payment.
        </p>
        <h2>Fulfillment</h2>
        <p>
          Orders may be fulfilled by Accel Analysis or an
          authorized print, shipping, or logistics provider.
          Delivery estimates are not guarantees.
        </p>
        <h2>Intellectual property</h2>
        <p>
          The book, excerpts, framework, site copy, and related
          materials remain protected by their applicable
          copyrights and other rights. Purchasing a book does not
          transfer reproduction or redistribution rights.
        </p>
        <h2>Support</h2>
        <p>
          Order questions should include the Stripe order
          reference and be sent to{" "}
          <a href={`mailto:${settings.brand.contactEmail}`}>
            {settings.brand.contactEmail}
          </a>
          .
        </p>
      </article>
    </main>
  );
}
