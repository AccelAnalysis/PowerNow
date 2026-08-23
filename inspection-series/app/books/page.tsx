import Link from "next/link";
import { loadSeriesCatalog } from "@/src/lib/books";
import { loadStorefrontSettings } from "@/src/lib/settings";
import { SeriesBookCover } from "@/components/SeriesBookCover";
import { statusLabel } from "@/components/SeriesShelf";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const [settings, catalog] = await Promise.all([
    loadStorefrontSettings(),
    loadSeriesCatalog()
  ]);
  const featured = catalog.books.find(
    (book) => book.slug === catalog.series.featuredBookSlug
  );

  return (
    <main className="series-page">
      <header className="site-header" aria-label="Power NOW site navigation">
        <Link href="/" className="brand-lockup" aria-label="Power NOW home">
          <span>{settings.brand.seriesName}</span>
          <small>{settings.brand.publisherName}</small>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/books">Books</Link>
          <Link href="/#framework">Framework</Link>
          <Link href="/read-chapter-one">Read</Link>
          {settings.affiliate.enabled ? <Link href="/affiliates">Affiliates</Link> : null}
          <Link href="/#buy">Buy</Link>
        </nav>
      </header>

      <section className="series-index-hero">
        <p className="eyebrow">Power NOW</p>
        <h1>{catalog.series.title}</h1>
        <p>{catalog.series.description}</p>
        <span>{catalog.series.developmentNote}</span>
      </section>

      <section className="series-catalog" aria-label="Power NOW books">
        {catalog.books.map((book) => (
          <Link
            className="series-catalog-book"
            key={book.slug}
            href={`/books/${book.slug}`}
          >
            <SeriesBookCover book={book} />
            <div className="series-catalog-copy">
              <div className="series-catalog-meta">
                <span>Book {book.sequence}</span>
                <strong>{statusLabel(book.status)}</strong>
              </div>
              <h2>{book.title}</h2>
              <p>{book.subtitle}</p>
              <small>{book.guidingQuestion}</small>
              <b>View book →</b>
            </div>
          </Link>
        ))}
      </section>

      <footer className="site-footer">
        <div>
          <strong>{settings.brand.seriesName}</strong>
          <span>{settings.brand.tagline}</span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/read-chapter-one">Read a sample</Link>
          <Link href="/shipping-returns">Shipping &amp; returns</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href={`mailto:${settings.brand.contactEmail}`}>Contact</a>
          {featured?.amazonUrl ? (
            <a href={featured.amazonUrl} target="_blank" rel="noreferrer">
              Amazon listing
            </a>
          ) : null}
        </nav>
      </footer>
    </main>
  );
}
