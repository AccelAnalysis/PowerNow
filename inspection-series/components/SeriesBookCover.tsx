import type { SeriesBook } from "@/src/lib/books";

type SeriesBookCoverProps = {
  book: SeriesBook;
  priority?: boolean;
  compact?: boolean;
};

export function SeriesBookCover({
  book,
  priority = false,
  compact = false
}: SeriesBookCoverProps) {
  const cover = book.coverUrl.trim();

  return (
    <div
      className={[
        "series-book-cover",
        compact ? "series-book-cover-compact" : "",
        cover ? "series-book-cover-art" : "series-book-cover-placeholder"
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${book.title} cover`}
    >
      {cover ? (
        <img
          src={cover}
          alt={`${book.title} book cover`}
          width="900"
          height="1350"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      ) : (
        <div className="series-placeholder-type">
          <small>Power NOW · Book {book.sequence}</small>
          <strong>{book.title}</strong>
          <span>Jonathan R. Holman</span>
        </div>
      )}
    </div>
  );
}
