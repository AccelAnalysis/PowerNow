import { promises as fs } from "node:fs";
import path from "node:path";

export type CurrencyCode = "usd";

export type Testimonial = {
  quote: string;
  attribution: string;
  role?: string;
};

export type FrameworkStep = {
  label: string;
  description: string;
};

export type SeriesPart = {
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
    tagline: string;
    promise: string;
    accentHex: string;
  };
  seo: {
    title: string;
    description: string;
    canonicalUrl: string;
  };
  product: {
    id: string;
    title: string;
    subtitle: string;
    editionLabel: string;
    priceCents: number;
    shippingCents: number;
    currency: CurrencyCode;
    purchaseLimit: number;
    shipsFrom: string;
    estimatedShipWindow: string;
    amazonUrl: string;
    asin: string;
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
    heroBackgroundUrl: string;
    bookCoverUrl: string;
    bookTextureUrl: string;
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
    parts: SeriesPart[];
  };
  checkout: {
    buyButtonLabel: string;
    allowedCountries: string[];
    collectPhone: boolean;
    allowPromotionCodes: boolean;
  };
  affiliate: {
    enabled: boolean;
    defaultCommissionPercent: number;
    cookieDays: number;
    applyEmail: string;
    intro: string;
    assetLinks: string[];
  };
};

type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<U>
    : T[P] extends object
      ? PartialDeep<T[P]>
      : T[P];
};

const settingsPath = () =>
  path.join(process.cwd(), process.env.SETTINGS_FILE_PATH ?? "data/site-settings.json");

export const defaultSettings: StorefrontSettings = {
  brand: {
    seriesName: "Power NOW",
    bookTitle: "Clarity Creates Speed",
    authorName: "Jonathan R. Holman",
    publisherName: "Accel Analysis",
    tagline: "Quicker, better action. Quicker, better success.",
    promise: "A practical field guide for closing the gap between insight and action.",
    accentHex: "#C68A2D"
  },
  seo: {
    title: "Clarity Creates Speed | Power NOW by Jonathan R. Holman",
    description:
      "Buy Clarity Creates Speed direct from the author. A practical Power NOW field guide for quicker, better action and quicker, better success.",
    canonicalUrl: "https://powernow.example.com"
  },
  product: {
    id: "clarity-creates-speed-paperback",
    title: "Clarity Creates Speed",
    subtitle: "Put your now on the work that actually deserves it.",
    editionLabel: "Paperback · Direct Author Edition",
    priceCents: 2000,
    shippingCents: 495,
    currency: "usd",
    purchaseLimit: 10,
    shipsFrom: "Accel Analysis",
    estimatedShipWindow: "Ships in 3–5 business days",
    amazonUrl: "https://www.amazon.com/Clarity-Creates-Speed-actually-deserves/dp/B0H3PJ8GT8/",
    asin: "B0H3PJ8GT8"
  },
  copy: {
    heroHook: "Know what deserves your now—and move before the moment cools.",
    heroSubhead:
      "Clarity Creates Speed is the first Power NOW book: a concise, practical guide for turning vague intention into focused action, cleaner decisions, and meaningful momentum.",
    primaryCta: "Buy direct",
    secondaryCta: "Read Chapter One",
    directEditionIntro:
      "Buying direct keeps the path simple: one book, one clear price, secure Stripe checkout, and no account required.",
    frameworkIntro:
      "The Power NOW framework turns success into a repeatable operating loop: Start quicker, Sustain better, Succeed more often, then multiply what works.",
    chapterOneIntro:
      "Chapter One begins where real speed begins: defining the win clearly enough that your next action becomes obvious."
  },
  imagery: {
    heroBackgroundUrl:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2400&q=82",
    bookCoverUrl:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=82",
    bookTextureUrl:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=82",
    writingDeskUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=82",
    actionWorkspaceUrl:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1800&q=82",
    affiliateUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=82"
  },
  proof: {
    assuranceItems: [
      "Secure Stripe checkout",
      "Apple Pay and Google Pay available when enabled in Stripe",
      "No customer account required",
      "$20 book + $4.95 shipping & handling"
    ],
    testimonials: []
  },
  framework: {
    steps: [
      {
        label: "Start",
        description: "Take a concrete step now instead of letting the idea cool on the shelf."
      },
      {
        label: "Sustain",
        description: "Build the rhythms and feedback loops that keep the right work moving."
      },
      {
        label: "Succeed",
        description: "Let repeated, meaningful action compound into results, opportunities, and freedom."
      }
    ],
    parts: [
      {
        eyebrow: "Part I",
        title: "Clarity Creates Speed",
        question: "What should I be doing now instead of everything else?",
        chapters: ["Define the Win", "Work That Moves the Needle", "The NOW Success Cycle", "The Big Three for Today"]
      },
      {
        eyebrow: "Part II",
        title: "Start Quicker",
        question: "How do I get myself to start the right things today instead of later?",
        chapters: ["Why We Don’t Start", "Micro-Starts That Break the Stall", "Productive Pressure", "From Idea to In-Motion"]
      },
      {
        eyebrow: "Part III",
        title: "Sustain Better",
        question: "How do I keep going long enough for success to become inevitable?",
        chapters: ["From Effort to Rhythm", "Environment by Design", "Feedback in Motion", "Stay, Shift, or Stop"]
      },
      {
        eyebrow: "Part IV",
        title: "Guarding Your Execution Capacity",
        question: "How do I protect my ability to act quickly and well over the long haul?",
        chapters: ["Find the Leaks", "The Power of No", "Calendar as Strategy", "Recovery as Fuel"]
      },
      {
        eyebrow: "Part V",
        title: "Multiply Your Wins",
        question: "How do I make each success create more—and faster—success?",
        chapters: ["Repeat the Win", "Document to Scale", "Leverage Engines", "Living in the Loop"]
      }
    ]
  },
  checkout: {
    buyButtonLabel: "Buy direct — $20",
    allowedCountries: ["US"],
    collectPhone: false,
    allowPromotionCodes: true
  },
  affiliate: {
    enabled: true,
    defaultCommissionPercent: 20,
    cookieDays: 30,
    applyEmail: "hello@accelanalysis.com",
    intro:
      "The affiliate layer is built for reviewers, podcasters, ministry leaders, coaches, and business communities that want to share the Power NOW framework without turning the site into a hard-sell funnel.",
    assetLinks: []
  }
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeSettings(
  base: StorefrontSettings,
  overrides: PartialDeep<StorefrontSettings> | null | undefined
): StorefrontSettings {
  if (!overrides) return base;

  const merge = (left: unknown, right: unknown): unknown => {
    if (Array.isArray(right)) return right;
    if (isPlainObject(left) && isPlainObject(right)) {
      const output: Record<string, unknown> = { ...left };
      for (const [key, value] of Object.entries(right)) {
        output[key] = merge(output[key], value);
      }
      return output;
    }
    return right === undefined ? left : right;
  };

  return merge(base, overrides) as StorefrontSettings;
}

async function readLocalSettings(): Promise<PartialDeep<StorefrontSettings> | null> {
  try {
    const raw = await fs.readFile(settingsPath(), "utf8");
    return JSON.parse(raw) as PartialDeep<StorefrontSettings>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function repoContentUrl(): string {
  const repo = process.env.GITHUB_REPO ?? "AccelAnalysis/PowerNow";
  const settingsFile = process.env.SETTINGS_FILE_PATH ?? "data/site-settings.json";
  const encodedPath = settingsFile.split("/").map(encodeURIComponent).join("/");
  const branch = process.env.GITHUB_BRANCH ?? "main";
  return `https://api.github.com/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
}

async function readGithubSettings(): Promise<PartialDeep<StorefrontSettings> | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const response = await fetch(repoContentUrl(), {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub settings read failed with ${response.status}`);
  }

  const body = (await response.json()) as { content?: string; encoding?: string };
  if (!body.content || body.encoding !== "base64") return null;
  return JSON.parse(Buffer.from(body.content, "base64").toString("utf8")) as PartialDeep<StorefrontSettings>;
}

export async function loadStorefrontSettings(): Promise<StorefrontSettings> {
  const readMode = process.env.CONFIG_READ_MODE ?? "local";
  const overrides = readMode === "github" ? await readGithubSettings() : await readLocalSettings();
  return mergeSettings(defaultSettings, overrides);
}

export async function writeStorefrontSettings(settings: StorefrontSettings): Promise<{ mode: string }> {
  const writeMode = process.env.CONFIG_WRITE_MODE ?? "local";
  const content = `${JSON.stringify(settings, null, 2)}\n`;

  if (writeMode === "github") {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO ?? "AccelAnalysis/PowerNow";
    const branch = process.env.GITHUB_BRANCH ?? "main";
    const settingsFile = process.env.SETTINGS_FILE_PATH ?? "data/site-settings.json";
    const encodedPath = settingsFile.split("/").map(encodeURIComponent).join("/");

    if (!token) {
      throw new Error("CONFIG_WRITE_MODE=github requires GITHUB_TOKEN.");
    }

    const current = await fetch(repoContentUrl(), {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    const currentBody = current.ok ? ((await current.json()) as { sha?: string }) : null;

    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${encodedPath}`, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        message: "Update storefront settings from admin",
        content: Buffer.from(content, "utf8").toString("base64"),
        branch,
        sha: currentBody?.sha
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub settings write failed with ${response.status}: ${errorBody}`);
    }

    return { mode: writeMode };
  }

  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), content, "utf8");
  return { mode: writeMode };
}

export function sanitizeSettings(input: StorefrontSettings): StorefrontSettings {
  const settings = mergeSettings(defaultSettings, input);
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(Math.round(value), min), max);

  settings.product.priceCents = clamp(settings.product.priceCents, 0, 100000);
  settings.product.shippingCents = clamp(settings.product.shippingCents, 0, 100000);
  settings.product.purchaseLimit = clamp(settings.product.purchaseLimit, 1, 100);
  settings.affiliate.defaultCommissionPercent = clamp(settings.affiliate.defaultCommissionPercent, 0, 80);
  settings.affiliate.cookieDays = clamp(settings.affiliate.cookieDays, 1, 365);
  settings.checkout.allowedCountries = settings.checkout.allowedCountries.length
    ? settings.checkout.allowedCountries.map((country) => country.toUpperCase())
    : ["US"];

  return settings;
}
