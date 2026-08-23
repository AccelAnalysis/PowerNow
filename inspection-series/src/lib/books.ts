import localCatalogJson from "@/data/books.json";

export type BookStatus =
  | "available"
  | "coming_soon"
  | "preorder"
  | "sold_out"
  | "retired";

export type SeriesBook = {
  slug: string;
  sequence: number;
  status: BookStatus;
  title: string;
  subtitle: string;
  description: string;
  guidingQuestion: string;
  editionLabel: string;
  priceCents: number;
  shippingCents: number;
  currency: string;
  purchaseLimit: number;
  shipsFrom: string;
  estimatedShipWindow: string;
  taxNotice: string;
  stripeProductId: string;
  stripePriceId: string;
  paymentLinkId: string;
  paymentLinkUrl: string;
  coverUrl: string;
  amazonUrl: string;
  asin: string;
  samplePath: string;
};

export type SeriesCatalog = {
  series: {
    name: string;
    title: string;
    description: string;
    featuredBookSlug: string;
    homepageBookSlugs: string[];
    developmentNote: string;
  };
  books: SeriesBook[];
};

export type BooksPersistenceInfo = {
  repository: string;
  branch: string;
  path: string;
  tokenConfigured: boolean;
};

const defaults = localCatalogJson as SeriesCatalog;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = "", max = 2000): string {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : fallback;
}

function integer(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

function stringArray(value: unknown, fallback: string[], max = 20): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function status(value: unknown, fallback: BookStatus): BookStatus {
  const allowed: BookStatus[] = [
    "available",
    "coming_soon",
    "preorder",
    "sold_out",
    "retired"
  ];
  return allowed.includes(value as BookStatus)
    ? (value as BookStatus)
    : fallback;
}

function sanitizeBook(value: unknown, fallback: SeriesBook): SeriesBook {
  const source = asRecord(value);
  return {
    slug: text(source.slug, fallback.slug, 120)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, ""),
    sequence: integer(source.sequence, fallback.sequence, 1, 999),
    status: status(source.status, fallback.status),
    title: text(source.title, fallback.title, 180),
    subtitle: text(source.subtitle, fallback.subtitle, 400),
    description: text(source.description, fallback.description, 1200),
    guidingQuestion: text(
      source.guidingQuestion,
      fallback.guidingQuestion,
      700
    ),
    editionLabel: text(source.editionLabel, fallback.editionLabel, 180),
    priceCents: integer(source.priceCents, fallback.priceCents, 0, 1_000_000),
    shippingCents: integer(
      source.shippingCents,
      fallback.shippingCents,
      0,
      1_000_000
    ),
    currency: text(source.currency, fallback.currency, 3).toLowerCase(),
    purchaseLimit: integer(
      source.purchaseLimit,
      fallback.purchaseLimit,
      1,
      100
    ),
    shipsFrom: text(source.shipsFrom, fallback.shipsFrom, 200),
    estimatedShipWindow: text(
      source.estimatedShipWindow,
      fallback.estimatedShipWindow,
      300
    ),
    taxNotice: text(source.taxNotice, fallback.taxNotice, 300),
    stripeProductId: text(
      source.stripeProductId,
      fallback.stripeProductId,
      160
    ),
    stripePriceId: text(source.stripePriceId, fallback.stripePriceId, 160),
    paymentLinkId: text(source.paymentLinkId, fallback.paymentLinkId, 160),
    paymentLinkUrl: text(source.paymentLinkUrl, fallback.paymentLinkUrl, 3000),
    coverUrl: text(source.coverUrl, fallback.coverUrl, 3000),
    amazonUrl: text(source.amazonUrl, fallback.amazonUrl, 3000),
    asin: text(source.asin, fallback.asin, 30),
    samplePath: text(source.samplePath, fallback.samplePath, 300)
  };
}

export function sanitizeSeriesCatalog(input: unknown): SeriesCatalog {
  const source = asRecord(input);
  const series = asRecord(source.series);
  const incomingBooks = Array.isArray(source.books) ? source.books : [];
  const fallbackBySlug = new Map(defaults.books.map((book) => [book.slug, book]));

  const books = incomingBooks
    .slice(0, 50)
    .map((item, index) => {
      const record = asRecord(item);
      const candidateSlug = text(record.slug, "", 120);
      const fallback =
        fallbackBySlug.get(candidateSlug) ??
        defaults.books[Math.min(index, defaults.books.length - 1)] ??
        defaults.books[0];
      return sanitizeBook(item, fallback);
    })
    .filter((book) => book.slug && book.title)
    .filter(
      (book, index, all) =>
        all.findIndex((candidate) => candidate.slug === book.slug) === index
    )
    .sort((a, b) => a.sequence - b.sequence);

  const safeBooks = books.length ? books : defaults.books;
  const requestedFeatured = text(
    series.featuredBookSlug,
    defaults.series.featuredBookSlug,
    120
  );
  const featuredBookSlug = safeBooks.some(
    (book) => book.slug === requestedFeatured
  )
    ? requestedFeatured
    : safeBooks[0].slug;

  return {
    series: {
      name: text(series.name, defaults.series.name, 120),
      title: text(series.title, defaults.series.title, 180),
      description: text(series.description, defaults.series.description, 600),
      featuredBookSlug,
      homepageBookSlugs: stringArray(
        series.homepageBookSlugs,
        defaults.series.homepageBookSlugs,
        20
      ).filter((slug) => safeBooks.some((book) => book.slug === slug)),
      developmentNote: text(
        series.developmentNote,
        defaults.series.developmentNote,
        300
      )
    },
    books: safeBooks
  };
}

export function getBooksPersistenceInfo(): BooksPersistenceInfo {
  return {
    repository: process.env.GITHUB_REPO ?? "AccelAnalysis/PowerNow",
    branch: process.env.GITHUB_BRANCH ?? "main",
    path: process.env.BOOKS_FILE_PATH ?? "data/books.json",
    tokenConfigured: Boolean(process.env.GITHUB_TOKEN)
  };
}

function githubContentsUrl(info: BooksPersistenceInfo): string {
  const [owner, repository] = info.repository.split("/");
  if (!owner || !repository) {
    throw new Error("GITHUB_REPO must use owner/repository format.");
  }
  const encodedPath = info.path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://api.github.com/repos/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repository)}/contents/${encodedPath}`;
}

async function loadFromGitHub(info: BooksPersistenceInfo): Promise<SeriesCatalog> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const [owner, repository] = info.repository.split("/");
  const rawPath = info.path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = token
    ? await fetch(
        `${githubContentsUrl(info)}?ref=${encodeURIComponent(info.branch)}`,
        {
          headers: {
            Accept: "application/vnd.github.raw+json",
            Authorization: `Bearer ${token}`,
            "User-Agent": "power-now-storefront"
          },
          next: { revalidate: 60, tags: ["power-now-books"] }
        }
      )
    : await fetch(
        `https://raw.githubusercontent.com/${encodeURIComponent(
          owner
        )}/${encodeURIComponent(repository)}/${encodeURIComponent(
          info.branch
        )}/${rawPath}`,
        {
          headers: { "User-Agent": "power-now-storefront" },
          next: { revalidate: 60, tags: ["power-now-books"] }
        }
      );

  if (!response.ok) {
    throw new Error(
      `GitHub books read failed (${response.status} ${response.statusText}).`
    );
  }
  return sanitizeSeriesCatalog(await response.json());
}

export async function loadSeriesCatalog(): Promise<SeriesCatalog> {
  try {
    return await loadFromGitHub(getBooksPersistenceInfo());
  } catch (error) {
    console.warn(
      "Power NOW series catalog fell back to the deployed copy:",
      error instanceof Error ? error.message : error
    );
    return sanitizeSeriesCatalog(localCatalogJson);
  }
}

export function getBookBySlug(
  catalog: SeriesCatalog,
  slug: string
): SeriesBook | undefined {
  return catalog.books.find((book) => book.slug === slug);
}

export function getFeaturedBook(catalog: SeriesCatalog): SeriesBook {
  return (
    getBookBySlug(catalog, catalog.series.featuredBookSlug) ?? catalog.books[0]
  );
}

export function isBookPurchasable(book: SeriesBook): boolean {
  return (
    (book.status === "available" || book.status === "preorder") &&
    book.priceCents > 0
  );
}

export async function writeSeriesCatalogToGitHub(
  catalog: SeriesCatalog,
  token: string
): Promise<{ commitSha?: string; commitUrl?: string }> {
  const info = getBooksPersistenceInfo();
  const url = githubContentsUrl(info);
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "power-now-storefront",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  const current = await fetch(
    `${url}?ref=${encodeURIComponent(info.branch)}`,
    { headers, cache: "no-store" }
  );
  if (!current.ok) {
    throw new Error(
      `GitHub books lookup failed (${current.status} ${current.statusText}).`
    );
  }
  const currentBody = (await current.json()) as { sha?: string };
  if (!currentBody.sha) {
    throw new Error("GitHub did not return the current books file SHA.");
  }

  const normalized = sanitizeSeriesCatalog(catalog);
  const content = Buffer.from(
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8"
  ).toString("base64");

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "Update Power NOW series catalog",
      content,
      sha: currentBody.sha,
      branch: info.branch
    }),
    cache: "no-store"
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `GitHub books write failed (${response.status}): ${detail.slice(0, 500)}`
    );
  }
  const body = (await response.json()) as {
    commit?: { sha?: string; html_url?: string };
  };
  return {
    commitSha: body.commit?.sha,
    commitUrl: body.commit?.html_url
  };
}
