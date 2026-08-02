import Link from "next/link";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  const settings = await loadStorefrontSettings();
  const sampleLink = `${settings.seo.canonicalUrl.replace(/\/$/, "")}/?ref=YOURCODE`;

  return (
    <main className="affiliate-page">
      <header className="simple-header dark-header">
        <Link href="/" className="brand-lockup">
          <span>{settings.brand.seriesName}</span>
          <small>Affiliate program</small>
        </Link>
        <Link href="/#buy" className="button button-on-dark">
          Buy direct
        </Link>
      </header>

      <section className="affiliate-hero" style={{ backgroundImage: `linear-gradient(110deg, rgba(15, 20, 28, 0.94), rgba(15, 20, 28, 0.68)), url(${settings.imagery.affiliateUrl})` }}>
        <p className="eyebrow">Affiliate-ready</p>
        <h1>Share quicker, better action with readers, teams, and communities.</h1>
        <p>{settings.affiliate.intro}</p>
      </section>

      <section className="section affiliate-details">
        <article>
          <span>01</span>
          <h2>Simple referral links</h2>
          <p>
            Referral codes are captured from URL parameters like <code>?ref=YOURCODE</code> and passed into Stripe Checkout metadata when a visitor buys.
          </p>
          <code>{sampleLink}</code>
        </article>
        <article>
          <span>02</span>
          <h2>Tracking-ready checkout</h2>
          <p>
            The default commission is {settings.affiliate.defaultCommissionPercent}% with a {settings.affiliate.cookieDays}-day attribution window. Final approvals and payouts should be reconciled from Stripe metadata and your affiliate records.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Brand-safe promotion</h2>
          <p>
            The site is designed to convert through clarity, not pressure. Affiliates can promote the sample chapter, framework, or direct purchase page without hype-based urgency.
          </p>
        </article>
      </section>

      <section className="affiliate-apply">
        <div>
          <p className="eyebrow">Apply</p>
          <h2>Request affiliate access</h2>
          <p>
            Send your name, audience or community, website or social link, and how you plan to share the book.
          </p>
        </div>
        <a className="button button-primary" href={`mailto:${settings.affiliate.applyEmail}?subject=Power%20NOW%20Affiliate%20Request`}>
          Email affiliate request
        </a>
      </section>
    </main>
  );
}
