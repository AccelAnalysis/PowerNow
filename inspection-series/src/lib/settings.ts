import localSettingsJson from "@/data/site-settings.json";

export type Testimonial = {
  quote: string;
  attribution: string;
  role?: string;
};

export type FrameworkStep = {
  label: string;
  description: string;
};

export type FrameworkPart = {
  eyebrow: string;
  title: string;
  question: string;
  chapters: string[];
};

export type StorefrontSettings = {
  brand: {
    seriesName: string;
    bookTitle: string;
    authorName: string;
    publisherName: string;
    contactEmail: string;
    tagline: string;
    promise: string;
  };
  seo: {
    title: string;
    description: string;
    canonicalUrl: string;
  };
  theme: {
    useCoverPalette: boolean;
    fallbackPrimary: string;
    fallbackSecondary: string;
    fallbackAccent: string;
    fallbackPaper: string;
  };
  product: {
    id: string;
    stripeProductId: string;
    stripePriceId: string;
    title: string;
    subtitle: string;
    editionLabel: string;
    priceCents: number;
    shippingCents: number;
    currency: string;
    purchaseLimit: number;
    shipsFrom: string;
    estimatedShipWindow: string;
    amazonUrl: string;
    asin: string;
    taxNotice: string;
  };
  copy: {
    heroHook: string;
    heroSubhead: string;
    primaryCta: string;
    secondaryCta: string;
    directEditionIntro: string;
    frameworkIntro: string;
    chapterOneIntro: string;
  };
  imagery: {
    bookCoverUrl: string;
    heroBackgroundUrl: string;
    writingDeskUrl: string;
    actionWorkspaceUrl: string;
    affiliateUrl: string;
  };
  proof: {
    assuranceItems: string[];
    testimonials: Testimonial[];
  };
  framework: {
    steps: FrameworkStep[];
    parts: FrameworkPart[];
  };
  checkout: {
    buyButtonLabel: string;
    allowedCountries: string[];
    collectPhone: boolean;
    allowPromotionCodes: boolean;
    preferDynamicCheckout: boolean;
    paymentLinkId: string;
    paymentLinkUrl: string;
  };
  affiliate: {
    enabled: boolean;
    defaultCommissionPercent: number;
    cookieDays: number;
    applyEmail: string;
    intro: string;
  };
};

export type SettingsPersistenceInfo = {
  readMode: "github" | "local";
  writeMode: "github" | "local";
  repository: string;
  branch: string;
  path: string;
  tokenConfigured: boolean;
};

const defaults = localSettingsJson as StorefrontSettings;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback: string, max = 2000): string {
  return typeof value === "string" && value.trim()
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

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringArray(value: unknown, fallback: string[], max = 20): string[] {
  if (!Array.isArray(value)) return fallback;
  const values = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
  return values.length ? values : fallback;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function urlText(value: unknown, fallback: string): string {
  const candidate = text(value, fallback, 3000);
  return isHttpUrl(candidate) ? candidate : fallback;
}

function sanitizeTestimonials(
  value: unknown,
  fallback: Testimonial[]
): Testimonial[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .slice(0, 12)
    .map((item) => {
      const record = asRecord(item);
      return {
        quote: text(record.quote, "", 500),
        attribution: text(record.attribution, "", 160),
        role: text(record.role, "", 160) || undefined
      };
    })
    .filter((item) => item.quote && item.attribution);
}

function sanitizeSteps(
  value: unknown,
  fallback: FrameworkStep[]
): FrameworkStep[] {
  if (!Array.isArray(value)) return fallback;
  const steps = value
    .slice(0, 8)
    .map((item) => {
      const record = asRecord(item);
      return {
        label: text(record.label, "", 80),
        description: text(record.description, "", 500)
      };
    })
    .filter((item) => item.label && item.description);
  return steps.length ? steps : fallback;
}

function sanitizeParts(
  value: unknown,
  fallback: FrameworkPart[]
): FrameworkPart[] {
  if (!Array.isArray(value)) return fallback;
  const parts = value
    .slice(0, 10)
    .map((item) => {
      const record = asRecord(item);
      return {
        eyebrow: text(record.eyebrow, "", 80),
        title: text(record.title, "", 160),
        question: text(record.question, "", 500),
        chapters: stringArray(record.chapters, [], 20)
      };
    })
    .filter(
      (item) =>
        item.eyebrow && item.title && item.question && item.chapters.length
    );
  return parts.length ? parts : fallback;
}

export function sanitizeSettings(input: unknown): StorefrontSettings {
  const source = asRecord(input);
  const brand = asRecord(source.brand);
  const seo = asRecord(source.seo);
  const theme = asRecord(source.theme);
  const product = asRecord(source.product);
  const copy = asRecord(source.copy);
  const imagery = asRecord(source.imagery);
  const proof = asRecord(source.proof);
  const framework = asRecord(source.framework);
  const checkout = asRecord(source.checkout);
  const affiliate = asRecord(source.affiliate);

  return {
    brand: {
      seriesName: text(brand.seriesName, defaults.brand.seriesName, 100),
      bookTitle: text(brand.bookTitle, defaults.brand.bookTitle, 160),
      authorName: text(brand.authorName, defaults.brand.authorName, 120),
      publisherName: text(
        brand.publisherName,
        defaults.brand.publisherName,
        120
      ),
      contactEmail: text(
        brand.contactEmail,
        defaults.brand.contactEmail,
        200
      ),
      tagline: text(brand.tagline, defaults.brand.tagline, 300),
      promise: text(brand.promise, defaults.brand.promise, 600)
    },
    seo: {
      title: text(seo.title, defaults.seo.title, 180),
      description: text(seo.description, defaults.seo.description, 500),
      canonicalUrl: urlText(
        seo.canonicalUrl,
        defaults.seo.canonicalUrl
      )
    },
    theme: {
      useCoverPalette: bool(
        theme.useCoverPalette,
        defaults.theme.useCoverPalette
      ),
      fallbackPrimary: text(
        theme.fallbackPrimary,
        defaults.theme.fallbackPrimary,
        20
      ),
      fallbackSecondary: text(
        theme.fallbackSecondary,
        defaults.theme.fallbackSecondary,
        20
      ),
      fallbackAccent: text(
        theme.fallbackAccent,
        defaults.theme.fallbackAccent,
        20
      ),
      fallbackPaper: text(
        theme.fallbackPaper,
        defaults.theme.fallbackPaper,
        20
      )
    },
    product: {
      id: text(product.id, defaults.product.id, 120),
      stripeProductId: text(
        product.stripeProductId,
        defaults.product.stripeProductId,
        120
      ),
      stripePriceId: text(
        product.stripePriceId,
        defaults.product.stripePriceId,
        120
      ),
      title: text(product.title, defaults.product.title, 160),
      subtitle: text(product.subtitle, defaults.product.subtitle, 400),
      editionLabel: text(
        product.editionLabel,
        defaults.product.editionLabel,
        180
      ),
      priceCents: integer(
        product.priceCents,
        defaults.product.priceCents,
        0,
        1_000_000
      ),
      shippingCents: integer(
        product.shippingCents,
        defaults.product.shippingCents,
        0,
        1_000_000
      ),
      currency: text(
        product.currency,
        defaults.product.currency,
        3
      ).toLowerCase(),
      purchaseLimit: integer(
        product.purchaseLimit,
        defaults.product.purchaseLimit,
        1,
        100
      ),
      shipsFrom: text(
        product.shipsFrom,
        defaults.product.shipsFrom,
        200
      ),
      estimatedShipWindow: text(
        product.estimatedShipWindow,
        defaults.product.estimatedShipWindow,
        300
      ),
      amazonUrl: urlText(
        product.amazonUrl,
        defaults.product.amazonUrl
      ),
      asin: text(product.asin, defaults.product.asin, 20),
      taxNotice: text(
        product.taxNotice,
        defaults.product.taxNotice,
        300
      )
    },
    copy: {
      heroHook: text(copy.heroHook, defaults.copy.heroHook, 600),
      heroSubhead: text(
        copy.heroSubhead,
        defaults.copy.heroSubhead,
        1000
      ),
      primaryCta: text(
        copy.primaryCta,
        defaults.copy.primaryCta,
        100
      ),
      secondaryCta: text(
        copy.secondaryCta,
        defaults.copy.secondaryCta,
        100
      ),
      directEditionIntro: text(
        copy.directEditionIntro,
        defaults.copy.directEditionIntro,
        1000
      ),
      frameworkIntro: text(
        copy.frameworkIntro,
        defaults.copy.frameworkIntro,
        1200
      ),
      chapterOneIntro: text(
        copy.chapterOneIntro,
        defaults.copy.chapterOneIntro,
        1000
      )
    },
    imagery: {
      bookCoverUrl: urlText(
        imagery.bookCoverUrl,
        defaults.imagery.bookCoverUrl
      ),
      heroBackgroundUrl: urlText(
        imagery.heroBackgroundUrl,
        defaults.imagery.heroBackgroundUrl
      ),
      writingDeskUrl: urlText(
        imagery.writingDeskUrl,
        defaults.imagery.writingDeskUrl
      ),
      actionWorkspaceUrl: urlText(
        imagery.actionWorkspaceUrl,
        defaults.imagery.actionWorkspaceUrl
      ),
      affiliateUrl: urlText(
        imagery.affiliateUrl,
        defaults.imagery.affiliateUrl
      )
    },
    proof: {
      assuranceItems: stringArray(
        proof.assuranceItems,
        defaults.proof.assuranceItems,
        12
      ),
      testimonials: sanitizeTestimonials(
        proof.testimonials,
        defaults.proof.testimonials
      )
    },
    framework: {
      steps: sanitizeSteps(framework.steps, defaults.framework.steps),
      parts: sanitizeParts(framework.parts, defaults.framework.parts)
    },
    checkout: {
      buyButtonLabel: text(
        checkout.buyButtonLabel,
        defaults.checkout.buyButtonLabel,
        140
      ),
      allowedCountries: stringArray(
        checkout.allowedCountries,
        defaults.checkout.allowedCountries,
        50
      ).map((country) => country.toUpperCase()),
      collectPhone: bool(
        checkout.collectPhone,
        defaults.checkout.collectPhone
      ),
      allowPromotionCodes: bool(
        checkout.allowPromotionCodes,
        defaults.checkout.allowPromotionCodes
      ),
      preferDynamicCheckout: bool(
        checkout.preferDynamicCheckout,
        defaults.checkout.preferDynamicCheckout
      ),
      paymentLinkId: text(
        checkout.paymentLinkId,
        defaults.checkout.paymentLinkId,
        160
      ),
      paymentLinkUrl: urlText(
        checkout.paymentLinkUrl,
        defaults.checkout.paymentLinkUrl
      )
    },
    affiliate: {
      enabled: bool(affiliate.enabled, defaults.affiliate.enabled),
      defaultCommissionPercent: integer(
        affiliate.defaultCommissionPercent,
        defaults.affiliate.defaultCommissionPercent,
        0,
        100
      ),
      cookieDays: integer(
        affiliate.cookieDays,
        defaults.affiliate.cookieDays,
        1,
        365
      ),
      applyEmail: text(
        affiliate.applyEmail,
        defaults.affiliate.applyEmail,
        200
      ),
      intro: text(
        affiliate.intro,
        defaults.affiliate.intro,
        1000
      )
    }
  };
}

export function getSettingsPersistenceInfo(): SettingsPersistenceInfo {
  const readMode =
    process.env.CONFIG_READ_MODE === "local" ? "local" : "github";
  const writeMode =
    process.env.CONFIG_WRITE_MODE === "local" ? "local" : "github";

  return {
    readMode,
    writeMode,
    repository: process.env.GITHUB_REPO ?? "AccelAnalysis/PowerNow",
    branch: process.env.GITHUB_BRANCH ?? "main",
    path: process.env.SETTINGS_FILE_PATH ?? "data/site-settings.json",
    tokenConfigured: Boolean(process.env.GITHUB_TOKEN)
  };
}

function githubContentsUrl(info: SettingsPersistenceInfo): string {
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

async function loadFromGitHub(
  info: SettingsPersistenceInfo
): Promise<StorefrontSettings> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const fetchOptions: RequestInit & {
    next: { revalidate: number; tags: string[] };
  } = {
    headers: {
      Accept: token
        ? "application/vnd.github.raw+json"
        : "application/json",
      "User-Agent": "power-now-storefront",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    next: {
      revalidate: 60,
      tags: ["power-now-settings"]
    }
  };

  let response: Response;
  if (token) {
    response = await fetch(
      `${githubContentsUrl(info)}?ref=${encodeURIComponent(info.branch)}`,
      fetchOptions
    );
  } else {
    const [owner, repository] = info.repository.split("/");
    const rawPath = info.path
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    response = await fetch(
      `https://raw.githubusercontent.com/${encodeURIComponent(
        owner
      )}/${encodeURIComponent(repository)}/${encodeURIComponent(
        info.branch
      )}/${rawPath}`,
      fetchOptions
    );
  }

  if (!response.ok) {
    throw new Error(
      `GitHub settings read failed (${response.status} ${response.statusText}).`
    );
  }

  return sanitizeSettings(await response.json());
}

export async function loadStorefrontSettings(): Promise<StorefrontSettings> {
  const info = getSettingsPersistenceInfo();
  if (info.readMode === "github") {
    try {
      return await loadFromGitHub(info);
    } catch (error) {
      console.error(
        "Power NOW settings fell back to the deployed copy:",
        error instanceof Error ? error.message : error
      );
    }
  }
  return sanitizeSettings(defaults);
}

type GitHubFileResponse = {
  sha?: string;
  content?: string;
  encoding?: string;
  message?: string;
};

type GitHubWriteResponse = {
  commit?: {
    sha?: string;
    html_url?: string;
  };
  content?: {
    sha?: string;
  };
  message?: string;
};

function encodeBase64Utf8(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

export async function writeStorefrontSettingsToGitHub(
  settings: StorefrontSettings,
  token: string
): Promise<{ commitSha: string; commitUrl?: string }> {
  const info = getSettingsPersistenceInfo();
  const apiUrl = githubContentsUrl(info);
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "power-now-storefront",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  const currentResponse = await fetch(
    `${apiUrl}?ref=${encodeURIComponent(info.branch)}`,
    { headers, cache: "no-store" }
  );
  const current = (await currentResponse
    .json()
    .catch(() => ({}))) as GitHubFileResponse;

  if (!currentResponse.ok || !current.sha) {
    throw new Error(
      current.message ||
        `Unable to read the current GitHub settings file (${currentResponse.status}).`
    );
  }

  const updateResponse = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Update Power NOW storefront settings (${new Date().toISOString()})`,
      content: encodeBase64Utf8(
        `${JSON.stringify(settings, null, 2)}\n`
      ),
      sha: current.sha,
      branch: info.branch
    }),
    cache: "no-store"
  });

  const result = (await updateResponse
    .json()
    .catch(() => ({}))) as GitHubWriteResponse;

  if (!updateResponse.ok || !result.commit?.sha) {
    throw new Error(
      result.message ||
        `GitHub settings update failed (${updateResponse.status}).`
    );
  }

  return {
    commitSha: result.commit.sha,
    commitUrl: result.commit.html_url
  };
}
