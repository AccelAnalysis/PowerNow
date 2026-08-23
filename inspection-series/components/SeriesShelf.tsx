import Link from "next/link";
import type { SeriesCatalog } from "@/src/lib/books";
import { SeriesBookCover } from "@/components/SeriesBookCover";

export function statusLabel(status: string): string {
  switch (status) {
    case "available":
      return "Available now";
    case "preorder":
      return "Preorder";
    case "sold_out":
      return "Sold out";
    case "retired":
      return "Archive";
    default:
      return "Coming soon";
  }
}

export function SeriesShelf({ catalog }: { catalog: SeriesCatalog }) {
  const books = catalog.series.homepageBookSlugs
    .map((slug) => catalog.books.find((book) => book.slug === slug))
    .filter(Boolean);

  return (
    <section className="series-home-section" aria-labelledby="series-home-title">
      <div className="series-home-heading">
        <p className="eyebrow">The series</p>
        <h2 id="series-home-title">{catalog.series.title}</h2>
        <p>{catalog.series.description}</p>
      </div>

      <div className="series-home-books">
        {books.map((book) =>
          book ? (
            <Link
              className="series-home-book"
              key={book.slug}
              href={`/books/${book.slug}`}
            >
              <SeriesBookCover book={book} compact />
              <div>
                <span>{statusLabel(book.status)}</span>
                <h3>{book.title}</h3>
                <p>{book.description}</p>
                <strong>View book</strong>
              </div>
            </Link>
          ) : null
        )}
      </div>

      <div className="series-home-foot">
        <span>{catalog.series.developmentNote}</span>
        <Link href="/books">Explore the full series →</Link>
      </div>
    </section>
  );
}
