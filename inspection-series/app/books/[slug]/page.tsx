import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/src/lib/money";
import {
  getBookBySlug,
  isBookPurchasable,
  loadSeriesCatalog
} from "@/src/lib/books";
import { loadStorefrontSettings } from "@/src/lib/settings";
import { SeriesBookCover } from "@/components/SeriesBookCover";
import { SeriesCheckoutButton } from "@/components/SeriesCheckoutButton";
import { statusLabel } from "@/components/SeriesShelf";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [settings, catalog] = await Promise.all([
    loadStorefrontSettings(),
    loadSeriesCatalog()
  ]);
  const book = getBookBySlug(catalog, slug);
  if (!book) return {};
  const canonical = `${settings.seo.canonicalUrl.replace(/\/$/, "")}/books/${book.slug}`;
  return {
    title: `${book.title} | ${settings.brand.seriesName}`,
    description: book.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${book.title} | ${settings.brand.seriesName}`,
      description: book.description,
      url: canonical,
      images: book.coverUrl
        ? [{ url: book.coverUrl, alt: `${book.title} book cover` }]
        : undefined
    }
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, catalog] = await Promise.all([
    loadStorefrontSettings(),
    loadSeriesCatalog()
  ]);
  const book = getBookBySlug(catalog, slug);
  if (!book) notFound();
  const purchasable = isBookPurchasable(book);

  return (
    <main className="book-detail-page">
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

      <section className="book-detail-hero">
        <div className="book-detail-cover">
          <SeriesBookCover book={book} priority />
        </div>
        <div className="book-detail-copy">
          <Link className="series-backlink" href="/books">
            ← The Power NOW Series
          </Link>
          <div className="book-detail-meta">
            <span>Book {book.sequence}</span>
            <strong>{statusLabel(book.status)}</strong>
          </div>
          <h1>{book.title}</h1>
          <p className="book-detail-subtitle">{book.subtitle}</p>
          <p className="book-detail-description">{book.description}</p>

          {purchasable ? (
            <div className="book-detail-purchase">
              <div className="book-detail-price">
                <strong>{formatMoney(book.priceCents, book.currency)}</strong>
                <span>per book</span>
              </div>
              <p>
                + {formatMoney(book.shippingCents, book.currency)} shipping &amp;
                handling per order. {book.taxNotice}
              </p>
              <SeriesCheckoutButton book={book} />
              {book.samplePath ? (
                <Link className="text-link" href={book.samplePath}>
                  Read a sample →
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="book-coming-soon">
              <strong>{statusLabel(book.status)}</strong>
              <p>
                This volume is part of the Power NOW series and is currently in
                development. Purchase controls will appear here when the book is
                ready for preorder or sale.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="book-guiding-question">
        <p className="eyebrow">Guiding question</p>
        <h2>{book.guidingQuestion}</h2>
      </section>

      <section className="book-series-next">
        <div>
          <p className="eyebrow">The larger system</p>
          <h2>One series. One operating philosophy.</h2>
          <p>
            Each Power NOW volume focuses on a different part of turning clearer
            priorities into quicker, better action and repeatable success.
          </p>
        </div>
        <Link className="button button-secondary" href="/books">
          Explore all books
        </Link>
      </section>

      <footer className="site-footer">
        <div>
          <strong>{settings.brand.seriesName}</strong>
          <span>{settings.brand.tagline}</span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/books">Books</Link>
          <Link href="/shipping-returns">Shipping &amp; returns</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href={`mailto:${settings.brand.contactEmail}`}>Contact</a>
          {book.amazonUrl ? (
            <a href={book.amazonUrl} target="_blank" rel="noreferrer">
              Amazon listing
            </a>
          ) : null}
        </nav>
      </footer>
    </main>
  );
}
