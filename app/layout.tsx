import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ReferralCapture } from "@/components/ReferralCapture";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Clarity Creates Speed | Power NOW",
  description: "Direct sales site for Clarity Creates Speed, the first book in the Power NOW series.",
  metadataBase: new URL("https://powernow.example.com")
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <ReferralCapture />
        {children}
      </body>
    </html>
  );
}
