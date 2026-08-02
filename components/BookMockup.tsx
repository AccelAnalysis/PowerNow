import type { StorefrontSettings } from "@/src/lib/settings";

export function BookMockup({ settings }: { settings: StorefrontSettings }) {
  return (
    <div className="book-mockup" aria-label={`${settings.product.title} book cover mockup`}>
      <div className="book-spine" />
      <div
        className="book-cover"
        style={{
          backgroundImage: `linear-gradient(145deg, rgba(13, 20, 29, 0.88), rgba(13, 20, 29, 0.5)), url(${settings.imagery.bookCoverUrl})`
        }}
      >
        <span className="book-series">{settings.brand.seriesName}</span>
        <strong>{settings.product.title}</strong>
        <em>{settings.product.subtitle}</em>
        <span className="book-author">{settings.brand.authorName}</span>
      </div>
      <div className="book-pages" />
    </div>
  );
}
