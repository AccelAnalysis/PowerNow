"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BooksPersistenceInfo,
  BookStatus,
  SeriesBook,
  SeriesCatalog
} from "@/src/lib/books";
import { formatMoney } from "@/src/lib/money";

type BooksResponse = {
  catalog: SeriesCatalog;
  persistence: BooksPersistenceInfo;
  writeAuthentication: string;
};

const statuses: Array<{ value: BookStatus; label: string }> = [
  { value: "available", label: "Available" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "preorder", label: "Preorder" },
  { value: "sold_out", label: "Sold out" },
  { value: "retired", label: "Retired" }
];

function cloneCatalog(catalog: SeriesCatalog): SeriesCatalog {
  return JSON.parse(JSON.stringify(catalog)) as SeriesCatalog;
}

function blankBook(sequence: number): SeriesBook {
  return {
    slug: `book-${sequence}`,
    sequence,
    status: "coming_soon",
    title: `Power NOW Book ${sequence}`,
    subtitle: "",
    description: "",
    guidingQuestion: "",
    editionLabel: `Power NOW · Book ${sequence}`,
    priceCents: 0,
    shippingCents: 0,
    currency: "usd",
    purchaseLimit: 10,
    shipsFrom: "Accel Analysis",
    estimatedShipWindow: "",
    taxNotice: "",
    stripeProductId: "",
    stripePriceId: "",
    paymentLinkId: "",
    paymentLinkUrl: "",
    coverUrl: "",
    amazonUrl: "",
    asin: "",
    samplePath: ""
  };
}

export function SeriesCatalogEditor() {
  const [catalog, setCatalog] = useState<SeriesCatalog | null>(null);
  const [persistence, setPersistence] =
    useState<BooksPersistenceInfo | null>(null);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [status, setStatus] = useState("Loading series catalog…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/books", { cache: "no-store" });
        const body = (await response.json()) as BooksResponse & { error?: string };
        if (!response.ok || !body.catalog) {
          throw new Error(body.error || "Series catalog could not be loaded.");
        }
        const loaded = cloneCatalog(body.catalog);
        setCatalog(loaded);
        setPersistence(body.persistence);
        setSelectedSlug(
          loaded.series.featuredBookSlug || loaded.books[0]?.slug || ""
        );
        setStatus(
          body.persistence.tokenConfigured
            ? "Series catalog is GitHub-backed and ready."
            : "Series catalog is GitHub-backed. Enter a fine-grained GitHub token when saving."
        );
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : "Series catalog could not be loaded."
        );
      }
    })();
  }, []);

  const selectedBook = useMemo(
    () => catalog?.books.find((book) => book.slug === selectedSlug) ?? null,
    [catalog, selectedSlug]
  );

  function updateSeries(patch: Partial<SeriesCatalog["series"]>) {
    setCatalog((current) =>
      current
        ? {
            ...current,
            series: { ...current.series, ...patch }
          }
        : current
    );
  }

  function updateBook(patch: Partial<SeriesBook>) {
    if (!selectedBook) return;
    setCatalog((current) => {
      if (!current) return current;
      const oldSlug = selectedBook.slug;
      const nextBook = { ...selectedBook, ...patch };
      const books = current.books.map((book) =>
        book.slug === oldSlug ? nextBook : book
      );
      const nextFeatured =
        current.series.featuredBookSlug === oldSlug
          ? nextBook.slug
          : current.series.featuredBookSlug;
      const nextHomepage = current.series.homepageBookSlugs.map((slug) =>
        slug === oldSlug ? nextBook.slug : slug
      );
      if (patch.slug) setSelectedSlug(nextBook.slug);
      return {
        ...current,
        series: {
          ...current.series,
          featuredBookSlug: nextFeatured,
          homepageBookSlugs: nextHomepage
        },
        books
      };
    });
  }

  function addBook() {
    if (!catalog) return;
    const sequence =
      Math.max(0, ...catalog.books.map((book) => book.sequence)) + 1;
    let candidate = blankBook(sequence);
    let counter = sequence;
    while (catalog.books.some((book) => book.slug === candidate.slug)) {
      counter += 1;
      candidate = blankBook(counter);
    }
    setCatalog({ ...catalog, books: [...catalog.books, candidate] });
    setSelectedSlug(candidate.slug);
    setStatus("New book added in the browser. Save to commit it to GitHub.");
  }

  function toggleHomepage(slug: string, checked: boolean) {
    if (!catalog) return;
    const current = catalog.series.homepageBookSlugs;
    updateSeries({
      homepageBookSlugs: checked
        ? [...new Set([...current, slug])]
        : current.filter((item) => item !== slug)
    });
  }

  async function save() {
    if (!catalog) return;
    setSaving(true);
    setStatus("Committing series catalog to GitHub…");
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (githubToken.trim()) headers["X-GitHub-Token"] = githubToken.trim();
      if (adminToken.trim()) {
        headers.Authorization = `Bearer ${adminToken.trim()}`;
      }
      const response = await fetch("/api/admin/books", {
        method: "POST",
        headers,
        body: JSON.stringify(catalog)
      });
      const body = (await response.json()) as {
        error?: string;
        catalog?: SeriesCatalog;
        commit?: { commitSha?: string };
      };
      if (!response.ok || !body.catalog) {
        throw new Error(body.error || "Series catalog save failed.");
      }
      setCatalog(cloneCatalog(body.catalog));
      setGithubToken("");
      setStatus(
        `Series catalog saved${
          body.commit?.commitSha
            ? ` in commit ${body.commit.commitSha.slice(0, 8)}`
            : ""
        }. The public catalog reads it directly.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Series catalog save failed."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!catalog || !selectedBook) {
    return (
      <section className="admin-shell series-admin-shell">
        <p className="admin-status">{status}</p>
      </section>
    );
  }

  return (
    <section className="admin-shell series-admin-shell">
      <div className="admin-panel admin-hero-panel">
        <div>
          <p className="eyebrow">Series manager</p>
          <h1>Power NOW books</h1>
          <p>
            Add future volumes before launch, control which book is featured,
            and connect each available book to its own Stripe product and
            checkout link.
          </p>
        </div>
        <div className="admin-summary">
          <span>Catalog</span>
          <strong>{catalog.books.length} books registered</strong>
          <small>
            {catalog.books.filter((book) => book.status === "available").length}{" "}
            available now
          </small>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-panel">
          <p className="eyebrow">Series</p>
          <h2>Catalog behavior</h2>
          <label className="field">
            <span>Series title</span>
            <input
              value={catalog.series.title}
              onChange={(event) => updateSeries({ title: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Series description</span>
            <textarea
              rows={3}
              value={catalog.series.description}
              onChange={(event) =>
                updateSeries({ description: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Featured book</span>
            <select
              value={catalog.series.featuredBookSlug}
              onChange={(event) =>
                updateSeries({ featuredBookSlug: event.target.value })
              }
            >
              {catalog.books.map((book) => (
                <option key={book.slug} value={book.slug}>
                  {book.sequence}. {book.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Homepage development note</span>
            <input
              value={catalog.series.developmentNote}
              onChange={(event) =>
                updateSeries({ developmentNote: event.target.value })
              }
            />
          </label>
        </div>

        <div className="admin-panel">
          <div className="series-admin-book-select">
            <div>
              <p className="eyebrow">Book manager</p>
              <h2>Edit a volume</h2>
            </div>
            <button className="button button-secondary" type="button" onClick={addBook}>
              Add book
            </button>
          </div>
          <label className="field">
            <span>Selected book</span>
            <select
              value={selectedSlug}
              onChange={(event) => setSelectedSlug(event.target.value)}
            >
              {catalog.books.map((book) => (
                <option key={book.slug} value={book.slug}>
                  {book.sequence}. {book.title}
                </option>
              ))}
            </select>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={catalog.series.homepageBookSlugs.includes(selectedBook.slug)}
              onChange={(event) =>
                toggleHomepage(selectedBook.slug, event.target.checked)
              }
            />
            <span>Show this book on the homepage series shelf</span>
          </label>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-panel">
          <p className="eyebrow">Identity</p>
          <h2>{selectedBook.title}</h2>
          <label className="field">
            <span>Sequence</span>
            <input
              type="number"
              min="1"
              value={selectedBook.sequence}
              onChange={(event) =>
                updateBook({ sequence: Number(event.target.value) })
              }
            />
          </label>
          <label className="field">
            <span>Slug</span>
            <input
              value={selectedBook.slug}
              onChange={(event) => updateBook({ slug: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={selectedBook.status}
              onChange={(event) =>
                updateBook({ status: event.target.value as BookStatus })
              }
            >
              {statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Title</span>
            <input
              value={selectedBook.title}
              onChange={(event) => updateBook({ title: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Subtitle</span>
            <input
              value={selectedBook.subtitle}
              onChange={(event) => updateBook({ subtitle: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Guiding question</span>
            <textarea
              rows={3}
              value={selectedBook.guidingQuestion}
              onChange={(event) =>
                updateBook({ guidingQuestion: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              rows={5}
              value={selectedBook.description}
              onChange={(event) =>
                updateBook({ description: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Cover URL</span>
            <input
              value={selectedBook.coverUrl}
              onChange={(event) => updateBook({ coverUrl: event.target.value })}
              placeholder="Leave blank until final artwork exists"
            />
          </label>
        </div>

        <div className="admin-panel">
          <p className="eyebrow">Commerce</p>
          <h2>
            {selectedBook.priceCents
              ? `${formatMoney(selectedBook.priceCents, selectedBook.currency)} per book`
              : "Not priced yet"}
          </h2>
          <label className="field">
            <span>Book price, cents</span>
            <input
              type="number"
              min="0"
              value={selectedBook.priceCents}
              onChange={(event) =>
                updateBook({ priceCents: Number(event.target.value) })
              }
            />
          </label>
          <label className="field">
            <span>Shipping &amp; handling, cents</span>
            <input
              type="number"
              min="0"
              value={selectedBook.shippingCents}
              onChange={(event) =>
                updateBook({ shippingCents: Number(event.target.value) })
              }
            />
          </label>
          <label className="field">
            <span>Stripe Product ID</span>
            <input
              value={selectedBook.stripeProductId}
              onChange={(event) =>
                updateBook({ stripeProductId: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Stripe Price ID</span>
            <input
              value={selectedBook.stripePriceId}
              onChange={(event) =>
                updateBook({ stripePriceId: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Stripe Payment Link</span>
            <input
              value={selectedBook.paymentLinkUrl}
              onChange={(event) =>
                updateBook({ paymentLinkUrl: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Amazon URL, optional bottom-matter link</span>
            <input
              value={selectedBook.amazonUrl}
              onChange={(event) => updateBook({ amazonUrl: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Sample path</span>
            <input
              value={selectedBook.samplePath}
              onChange={(event) => updateBook({ samplePath: event.target.value })}
              placeholder="/books/book-slug/sample"
            />
          </label>
          <p className="admin-note">
            A book must be Available or Preorder, have a price, and have either
            a Payment Link or dynamic Stripe Checkout configured before the
            public site will sell it.
          </p>
        </div>
      </div>

      <div className="admin-auth-panel">
        <div>
          <label className="field">
            <span>
              GitHub fine-grained token{" "}
              {persistence?.tokenConfigured
                ? "(optional—server token is configured)"
                : "(required for this save)"}
            </span>
            <input
              type="password"
              autoComplete="off"
              value={githubToken}
              onChange={(event) => setGithubToken(event.target.value)}
              placeholder="github_pat_…"
            />
          </label>
        </div>
        <div>
          <label className="field">
            <span>Admin passphrase, when configured</span>
            <input
              type="password"
              autoComplete="off"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="admin-savebar">
        <span>{status}</span>
        <button
          className="button button-primary"
          type="button"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving series…" : "Save series to GitHub"}
        </button>
      </div>
    </section>
  );
}
