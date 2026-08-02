import { loadStorefrontSettings } from "@/src/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Dimensions = { width: number; height: number };

function imageDimensions(bytes: Buffer): Dimensions | null {
  // PNG
  if (
    bytes.length > 24 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20)
    };
  }

  // GIF
  if (
    bytes.length > 10 &&
    (bytes.subarray(0, 6).toString("ascii") === "GIF87a" ||
      bytes.subarray(0, 6).toString("ascii") === "GIF89a")
  ) {
    return {
      width: bytes.readUInt16LE(6),
      height: bytes.readUInt16LE(8)
    };
  }

  // JPEG SOF markers
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2) break;
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof && offset + 8 < bytes.length) {
        return {
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7)
        };
      }
      offset += 2 + length;
    }
  }

  return null;
}

function fallbackCover(): string {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 900 1350">
    <rect width="900" height="1350" fill="#171717"/>
    <rect x="54" y="54" width="792" height="1242" rx="12" fill="none" stroke="#f4f3ef" stroke-opacity=".35" stroke-width="3"/>
    <text x="90" y="150" fill="#f4f3ef" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="8">POWER NOW</text>
    <text x="90" y="520" fill="#ffffff" font-family="Georgia, serif" font-size="100" font-weight="700">CLARITY</text>
    <text x="90" y="635" fill="#ffffff" font-family="Georgia, serif" font-size="100" font-weight="700">CREATES</text>
    <text x="90" y="750" fill="#ffffff" font-family="Georgia, serif" font-size="100" font-weight="700">SPEED</text>
    <text x="90" y="1110" fill="#f4f3ef" font-family="Arial, sans-serif" font-size="34">JONATHAN R. HOLMAN</text>
  </svg>`;
}

export async function GET() {
  const settings = await loadStorefrontSettings();
  const asin = settings.product.asin;
  const candidates = Array.from(
    new Set([
      settings.imagery.bookCoverUrl,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`,
      `https://images.amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`,
      `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`
    ])
  ).filter(Boolean);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (compatible; PowerNOWBookStore/1.0; +https://power-now.vercel.app)"
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
        redirect: "follow"
      });

      if (!response.ok) continue;
      const contentType =
        response.headers.get("content-type")?.split(";")[0] ?? "";
      if (!contentType.startsWith("image/")) continue;

      const bytes = Buffer.from(await response.arrayBuffer());
      const dimensions = imageDimensions(bytes);
      const largeEnough = dimensions
        ? dimensions.width >= 200 &&
          dimensions.height >= 300 &&
          dimensions.height / dimensions.width >= 1.25 &&
          dimensions.height / dimensions.width <= 2.2
        : bytes.byteLength >= 10_000;
      if (!largeEnough) continue;

      return new Response(bytes, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          "X-Content-Type-Options": "nosniff",
          "X-Power-Now-Cover": "published-source"
        }
      });
    } catch {
      // Try the next documented Amazon image form.
    }
  }

  return new Response(fallbackCover(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Power-Now-Cover": "fallback"
    }
  });
}
