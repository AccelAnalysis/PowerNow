"use client";

import { useEffect } from "react";
import type { StorefrontSettings } from "@/src/lib/settings";

type RGB = { r: number; g: number; b: number; count: number };

function luminance({ r, g, b }: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function distance(a: RGB, b: RGB): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
      (a.g - b.g) ** 2 +
      (a.b - b.b) ** 2
  );
}

function hex({ r, g, b }: RGB): string {
  return `#${[r, g, b]
    .map((value) =>
      Math.max(0, Math.min(255, value))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function mixWithWhite(color: RGB, amount = 0.9): RGB {
  return {
    r: Math.round(color.r + (255 - color.r) * amount),
    g: Math.round(color.g + (255 - color.g) * amount),
    b: Math.round(color.b + (255 - color.b) * amount),
    count: color.count
  };
}

function extractPalette(data: Uint8ClampedArray): {
  primary: RGB;
  secondary: RGB;
  accent: RGB;
  paper: RGB;
} | null {
  const buckets = new Map<string, RGB>();

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 200) continue;

    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Ignore photographic glare and pure page-white, but keep pale cover colors.
    if (r > 246 && g > 246 && b > 246) continue;

    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const key = `${qr},${qg},${qb}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, {
        r: Math.min(qr, 255),
        g: Math.min(qg, 255),
        b: Math.min(qb, 255),
        count: 1 + Math.round((max - min) / 48)
      });
    }
  }

  const colors = [...buckets.values()].sort(
    (a, b) => b.count - a.count
  );
  if (!colors.length) return null;

  const darkCandidates = colors.filter(
    (color) => luminance(color) < 145
  );
  const primary =
    darkCandidates[0] ??
    [...colors].sort(
      (a, b) => luminance(a) - luminance(b)
    )[0];

  const secondary =
    colors.find(
      (color) =>
        distance(color, primary) > 95 &&
        luminance(color) > 35 &&
        luminance(color) < 225
    ) ?? primary;

  const accentCandidates = colors
    .filter(
      (color) =>
        saturation(color) > 0.28 &&
        luminance(color) > 55 &&
        luminance(color) < 225 &&
        distance(color, primary) > 85
    )
    .sort((a, b) => {
      const aScore =
        a.count *
        (0.7 + saturation(a)) *
        (1 + distance(a, primary) / 255);
      const bScore =
        b.count *
        (0.7 + saturation(b)) *
        (1 + distance(b, primary) / 255);
      return bScore - aScore;
    });

  const accent = accentCandidates[0] ?? secondary;
  const lightCandidate = colors.find(
    (color) =>
      luminance(color) > 185 &&
      distance(color, primary) > 120
  );
  const paper = lightCandidate ?? mixWithWhite(primary, 0.91);

  return { primary, secondary, accent, paper };
}

export function CoverPalette({
  settings
}: {
  settings: StorefrontSettings;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--theme-primary",
      settings.theme.fallbackPrimary
    );
    root.style.setProperty(
      "--theme-secondary",
      settings.theme.fallbackSecondary
    );
    root.style.setProperty(
      "--theme-accent",
      settings.theme.fallbackAccent
    );
    root.style.setProperty(
      "--theme-paper",
      settings.theme.fallbackPaper
    );

    if (!settings.theme.useCoverPalette) return;

    const image = new Image();
    image.decoding = "async";
    image.src = `/api/book-cover?palette=${Date.now()}`;

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 72;
        const context = canvas.getContext("2d", {
          willReadFrequently: true
        });
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ).data;
        const palette = extractPalette(pixels);
        if (!palette) return;

        root.style.setProperty(
          "--theme-primary",
          hex(palette.primary)
        );
        root.style.setProperty(
          "--theme-secondary",
          hex(palette.secondary)
        );
        root.style.setProperty(
          "--theme-accent",
          hex(palette.accent)
        );
        root.style.setProperty(
          "--theme-paper",
          hex(palette.paper)
        );
        root.style.setProperty(
          "--theme-on-primary",
          luminance(palette.primary) < 155
            ? "#ffffff"
            : "#121212"
        );
      } catch {
        // The static fallback palette remains in use.
      }
    };
  }, [settings]);

  return null;
}
