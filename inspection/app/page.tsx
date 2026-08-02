import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { CheckoutButton } from "@/components/CheckoutButton";
import { MobileBuyBar } from "@/components/MobileBuyBar";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await loadStorefrontSettings();

  return (
    <main>
      <header
        className="site-header"
        aria-label="Power NOW site navigation"
      >
        <Link
          href="/"
          className="brand-lockup"
          aria-label="Power NOW home"
        >
          <span>{settings.brand.seriesName}</span>
          <small>{settings.brand.publisherName}</small>
        </Link>

        <nav
          className="desktop-nav"
          aria-label="Primary navigation"
        >
          <Link href="/read-chapter-one">Read a sample</Link>
          <a href="#framework">Framework</a>
          {settings.affiliate.enabled ? (
            <Link href="/affiliates">Affiliates</Link>
          ) : null}
          <a href="#buy">Buy</a>
        </nav>

        <details className="mobile-nav">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            <Link href="/read-chapter-one">Read a sample</Link>
            <a href="#framework">Framework</a>
            {settings.affiliate.enabled ? (
              <Link href="/affiliates">Affiliates</Link>
            ) : null}
            <a href="#buy">Buy</a>
          </nav>
        </details>
      </header>

      <section
        className="hero-section"
        style={
          {
            "--hero-image": `url(${settings.imagery.heroBackgroundUrl})`
          } as React.CSSProperties
        }
      >
        <div className="hero-content">
          <p className="eyebrow">
            {settings.product.editionLabel}
          </p>
          <h1>{settings.copy.heroHook}</h1>
          <p className="hero-subhead">
            {settings.copy.heroSubhead}
          </p>

          <PriceBreakdown settings={settings} />

          <div className="hero-actions">
            <CheckoutButton
              settings={settings}
              label={settings.copy.primaryCta}
            />
            <Link
              href="/read-chapter-one"
              className="button button-secondary"
            >
              {settings.copy.secondaryCta}
            </Link>
          </div>

          <div
            className="proof-row"
            aria-label="Purchase assurances"
          >
            {settings.proof.assuranceItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <aside
          className="hero-book"
          aria-label="Published book cover"
        >
          <BookCover settings={settings} priority />
          <a
            className="amazon-reference"
            href={settings.product.amazonUrl}
            target="_blank"
            rel="noreferrer"
          >
            View the published edition on Amazon
          </a>
        </aside>
      </section>

      <section className="section spacious-section intro-section">
        <div className="section-kicker">
          <p className="eyebrow">The premise</p>
          <h2>
            Success gets faster when the right action gets
            clearer.
          </h2>
        </div>
        <div className="text-column">
          <p>
            {settings.brand.promise} It is not a shame-based book
            about procrastination. It is about harvest: doing the
            things now that create growth and putting down the
            distractions that siphon away productive energy.
          </p>
          <p>
            The first move is clarity. When the win is defined,
            the work that moves the needle separates itself from
            the noise, and today can stop feeling like a fog of
            equal priorities.
          </p>
        </div>
      </section>

      {settings.proof.testimonials.length ? (
        <section
          className="testimonial-strip"
          aria-label="Reader testimonials"
        >
          {settings.proof.testimonials
            .slice(0, 4)
            .map((testimonial) => (
              <figure
                key={`${testimonial.quote}-${testimonial.attribution}`}
              >
                <blockquote>
                  “{testimonial.quote}”
                </blockquote>
                <figcaption>
                  {testimonial.attribution}
                  {testimonial.role ? (
                    <span>{testimonial.role}</span>
                  ) : null}
                </figcaption>
              </figure>
            ))}
        </section>
      ) : null}

      <section className="section image-text-section">
        <div className="image-panel">
          <img
            src={settings.imagery.writingDeskUrl}
            alt="A focused writing desk with notebook and planning materials"
            width="1800"
            height="1200"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <p className="eyebrow">Read the book when…</p>
          <h2>You have more ideas than finished moves.</h2>
          <p>
            The book is built for business owners, analysts,
            creators, leaders, and builders who already know they
            need to act—but need a cleaner way to choose the next
            move and make it now.
          </p>
          <ul className="minimal-list">
            <li>Define the win so action has a target.</li>
            <li>
              Separate needle-moving work from polished busywork.
            </li>
            <li>
              Choose the Big Three for business and life.
            </li>
            <li>
              Protect execution capacity so speed is sustainable.
            </li>
          </ul>
        </div>
      </section>

      <section
        className="section framework-section"
        id="framework"
      >
        <div className="section-heading centered">
          <p className="eyebrow">The Power NOW cycle</p>
          <h2>Start. Sustain. Succeed. Repeat.</h2>
          <p>{settings.copy.frameworkIntro}</p>
        </div>

        <div className="cycle-grid">
          {settings.framework.steps.map((step, index) => (
            <article key={step.label}>
              <span>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.label}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section parts-section">
        <div className="section-heading">
          <p className="eyebrow">Inside the book</p>
          <h2>
            Five movements from clarity to multiplied wins.
          </h2>
        </div>

        <div className="parts-list">
          {settings.framework.parts.map((part) => (
            <article key={part.title}>
              <div>
                <span className="part-eyebrow">
                  {part.eyebrow}
                </span>
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
          <p className="eyebrow">From the author</p>
          <h2>
            Turn clarity into a move you can make today.
          </h2>
          <p>{settings.copy.directEditionIntro}</p>
          <p>
            Purchase without creating an account. Stripe presents
            the book price, shipping and handling, and applicable
            sales tax as separate amounts before payment.
          </p>
        </div>
        <div className="image-panel">
          <img
            src={settings.imagery.actionWorkspaceUrl}
            alt="People gathered around a table moving work from planning into action"
            width="1800"
            height="1200"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <section className="buy-section" id="buy">
        <div className="buy-copy">
          <p className="eyebrow">Buy direct</p>
          <h2>{settings.product.title}</h2>
          <p>{settings.product.subtitle}</p>
          <PriceBreakdown settings={settings} dark />
          <p className="muted">
            {settings.product.estimatedShipWindow}
          </p>
        </div>

        <div className="buy-card">
          <BookCover settings={settings} />
          <CheckoutButton
            settings={settings}
            label="Continue to secure checkout"
            showQuantity
          />
          <small>
            Stripe shows the book subtotal, the one-per-order
            shipping-and-handling charge, and applicable tax on
            separate lines before payment.
          </small>
        </div>
      </section>

      {settings.affiliate.enabled ? (
        <section
          className="affiliate-band"
          style={{
            backgroundImage: `linear-gradient(90deg, color-mix(in srgb, var(--theme-primary) 94%, transparent), color-mix(in srgb, var(--theme-primary) 68%, transparent)), url(${settings.imagery.affiliateUrl})`
          }}
        >
          <div>
            <p className="eyebrow">Share the framework</p>
            <h2>
              Help your audience put better work in motion.
            </h2>
            <p>{settings.affiliate.intro}</p>
          </div>
          <Link
            href="/affiliates"
            className="button button-on-dark"
          >
            View affiliate details
          </Link>
        </section>
      ) : null}

      <footer className="site-footer">
        <div>
          <strong>{settings.brand.seriesName}</strong>
          <span>{settings.brand.tagline}</span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/read-chapter-one">
            Read a sample
          </Link>
          {settings.affiliate.enabled ? (
            <Link href="/affiliates">Affiliates</Link>
          ) : null}
          <Link href="/shipping-returns">
            Shipping &amp; returns
          </Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href={`mailto:${settings.brand.contactEmail}`}>
            Contact
          </a>
          <a
            href={settings.product.amazonUrl}
            target="_blank"
            rel="noreferrer"
          >
            Amazon listing
          </a>
        </nav>
      </footer>

      <MobileBuyBar settings={settings} />
    </main>
  );
}
