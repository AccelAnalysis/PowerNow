import Link from "next/link";
import { BookMockup } from "@/components/BookMockup";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatMoney } from "@/src/lib/money";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await loadStorefrontSettings();
  const fullPrice = settings.product.priceCents + settings.product.shippingCents;

  return (
    <main>
      <header className="site-header" aria-label="Power NOW site navigation">
        <Link href="/" className="brand-lockup" aria-label="Power NOW home">
          <span>{settings.brand.seriesName}</span>
          <small>{settings.brand.publisherName}</small>
        </Link>
        <nav>
          <Link href="/read-chapter-one">Chapter One</Link>
          <a href="#framework">Framework</a>
          {settings.affiliate.enabled ? <Link href="/affiliates">Affiliates</Link> : null}
          <a href="#buy">Buy</a>
        </nav>
      </header>

      <section
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(110deg, rgba(248, 244, 235, 0.96) 0%, rgba(248, 244, 235, 0.9) 38%, rgba(248, 244, 235, 0.55) 62%, rgba(16, 22, 31, 0.74) 100%), url(${settings.imagery.heroBackgroundUrl})`
        }}
      >
        <div className="hero-content">
          <p className="eyebrow">{settings.product.editionLabel}</p>
          <h1>{settings.copy.heroHook}</h1>
          <p className="hero-subhead">{settings.copy.heroSubhead}</p>
          <div className="hero-actions">
            <CheckoutButton settings={settings} label={settings.copy.primaryCta} />
            <Link href="/read-chapter-one" className="button button-secondary">
              {settings.copy.secondaryCta}
            </Link>
          </div>
          <div className="proof-row" aria-label="Purchase assurances">
            {settings.proof.assuranceItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <aside className="hero-book" aria-label="Featured book">
          <BookMockup settings={settings} />
          <div className="price-note">
            <strong>{formatMoney(settings.product.priceCents, settings.product.currency)}</strong>
            <span>+ {formatMoney(settings.product.shippingCents, settings.product.currency)} S&H</span>
          </div>
        </aside>
      </section>

      <section className="section spacious-section intro-section">
        <div className="section-kicker">
          <p className="eyebrow">The premise</p>
          <h2>Success gets faster when the right action gets clearer.</h2>
        </div>
        <div className="text-column">
          <p>
            {settings.brand.promise} It is not a shame-based book about procrastination. It is about harvest: doing the things now that create growth and putting down the distractions that siphon away productive energy.
          </p>
          <p>
            The first move is clarity. When the win is defined, the work that moves the needle separates itself from the noise, and today can stop feeling like a fog of equal priorities.
          </p>
        </div>
      </section>

      {settings.proof.testimonials.length ? (
        <section className="testimonial-strip" aria-label="Reader testimonials">
          {settings.proof.testimonials.slice(0, 4).map((testimonial) => (
            <figure key={`${testimonial.quote}-${testimonial.attribution}`}>
              <blockquote>“{testimonial.quote}”</blockquote>
              <figcaption>
                {testimonial.attribution}
                {testimonial.role ? <span>{testimonial.role}</span> : null}
              </figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      <section className="section image-text-section">
        <div className="image-panel">
          <img src={settings.imagery.writingDeskUrl} alt="A focused writing desk with notebook and planning materials" />
        </div>
        <div>
          <p className="eyebrow">Read the book when…</p>
          <h2>You have more ideas than finished moves.</h2>
          <p>
            The book is built for business owners, analysts, creators, leaders, and builders who already know they need to act—but need a cleaner way to choose the next move and make it now.
          </p>
          <ul className="minimal-list">
            <li>Define the win so action has a target.</li>
            <li>Separate needle-moving work from polished busywork.</li>
            <li>Choose the Big Three for business and life.</li>
            <li>Protect execution capacity so speed is sustainable.</li>
          </ul>
        </div>
      </section>

      <section className="section framework-section" id="framework">
        <div className="section-heading centered">
          <p className="eyebrow">The Power NOW cycle</p>
          <h2>Start. Sustain. Succeed. Repeat.</h2>
          <p>{settings.copy.frameworkIntro}</p>
        </div>
        <div className="cycle-grid">
          {settings.framework.steps.map((step, index) => (
            <article key={step.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.label}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section parts-section">
        <div className="section-heading">
          <p className="eyebrow">Inside the book</p>
          <h2>Five movements from clarity to multiplied wins.</h2>
        </div>
        <div className="parts-list">
          {settings.framework.parts.map((part) => (
            <article key={part.title}>
              <div>
                <span className="part-eyebrow">{part.eyebrow}</span>
                <h3>{part.title}</h3>
                <p>{part.question}</p>
              </div>
              <ol>
                {part.chapters.map((chapter) => (
                  <li key={chapter}>{chapter}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="section image-text-section reverse-section">
        <div>
          <p className="eyebrow">Direct author edition</p>
          <h2>Make buying feel like the next step, not a sales pitch.</h2>
          <p>{settings.copy.directEditionIntro}</p>
          <p>
            The checkout path stays intentionally light: no required account, no forced bundle, no hype countdown. Just the first Power NOW book, shipped direct.
          </p>
        </div>
        <div className="image-panel">
          <img src={settings.imagery.actionWorkspaceUrl} alt="People gathered around a table moving work from planning into action" />
        </div>
      </section>

      <section className="buy-section" id="buy">
        <div className="buy-copy">
          <p className="eyebrow">Buy direct</p>
          <h2>{settings.product.title}</h2>
          <p>{settings.product.subtitle}</p>
          <div className="price-line">
            <strong>{formatMoney(settings.product.priceCents, settings.product.currency)}</strong>
            <span>+ {formatMoney(settings.product.shippingCents, settings.product.currency)} shipping & handling</span>
          </div>
          <p className="muted">{settings.product.estimatedShipWindow} · Ships from {settings.product.shipsFrom}</p>
        </div>
        <div className="buy-card">
          <BookMockup settings={settings} />
          <CheckoutButton settings={settings} label={`Buy now — ${formatMoney(fullPrice, settings.product.currency)} today`} />
          <small>Checkout opens through Stripe. Sales tax may be added if automatic tax is enabled.</small>
        </div>
      </section>

      {settings.affiliate.enabled ? (
        <section className="affiliate-band" style={{ backgroundImage: `linear-gradient(90deg, rgba(15, 20, 28, 0.9), rgba(15, 20, 28, 0.66)), url(${settings.imagery.affiliateUrl})` }}>
          <div>
            <p className="eyebrow">Share the framework</p>
            <h2>Affiliate-ready without turning the brand into a loud funnel.</h2>
            <p>{settings.affiliate.intro}</p>
          </div>
          <Link href="/affiliates" className="button button-on-dark">
            View affiliate details
          </Link>
        </section>
      ) : null}

      <footer className="site-footer">
        <div>
          <strong>{settings.brand.seriesName}</strong>
          <span>{settings.brand.tagline}</span>
        </div>
        <nav>
          <Link href="/read-chapter-one">Read Chapter One</Link>
          {settings.affiliate.enabled ? <Link href="/affiliates">Affiliates</Link> : null}
          <Link href="/admin">Admin</Link>
          <a href={settings.product.amazonUrl} target="_blank" rel="noreferrer">
            Amazon listing
          </a>
        </nav>
      </footer>

      <div className="mobile-buy-bar">
        <span>{formatMoney(fullPrice, settings.product.currency)} today</span>
        <CheckoutButton settings={settings} label="Buy direct" />
      </div>
    </main>
  );
}
