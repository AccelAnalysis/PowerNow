import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/app/globals.css";
import "@/app/design-overrides.css";
import { ReferralCapture } from "@/components/ReferralCapture";
import { loadStorefrontSettings } from "@/src/lib/settings";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadStorefrontSettings();
  const canonical = settings.seo.canonicalUrl.replace(/\/$/, "");
  const cover = `${canonical}/api/book-cover`;

  return {
    metadataBase: new URL(canonical),
    title: settings.seo.title,
    description: settings.seo.description,
    applicationName: settings.brand.seriesName,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large"
      }
    },
    openGraph: {
      type: "website",
      title: settings.seo.title,
      description: settings.seo.description,
      url: canonical,
      siteName: settings.brand.seriesName,
      images: [
        {
          url: cover,
          alt: `${settings.product.title} by ${settings.brand.authorName}`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seo.title,
      description: settings.seo.description,
      images: [cover]
    }
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await loadStorefrontSettings();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      style={
        {
          "--theme-primary": settings.theme.fallbackPrimary,
          "--theme-secondary": settings.theme.fallbackSecondary,
          "--theme-accent": settings.theme.fallbackAccent,
          "--theme-paper": settings.theme.fallbackPaper,
          "--theme-on-primary": "#ffffff"
        } as React.CSSProperties
      }
    >
      <body>
        <ReferralCapture
          enabled={settings.affiliate.enabled}
          cookieDays={settings.affiliate.cookieDays}
        />
        {children}
      </body>
    </html>
  );
}
