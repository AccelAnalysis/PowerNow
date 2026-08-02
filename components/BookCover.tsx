import type { StorefrontSettings } from "@/src/lib/settings";

type BookCoverProps = {
  settings: StorefrontSettings;
  priority?: boolean;
};

export function BookCover({
  settings,
  priority = false
}: BookCoverProps) {
  return (
    <div className="book-object">
      <div className="book-spine" aria-hidden="true" />
      <div className="book-face">
        <img
          src="/api/book-cover"
          alt={`${settings.product.title} by ${settings.brand.authorName}`}
          width="900"
          height="1350"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      </div>
      <div className="book-pages" aria-hidden="true" />
    </div>
  );
}
