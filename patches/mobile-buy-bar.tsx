"use client";

import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatMoney } from "@/src/lib/money";
import type { StorefrontSettings } from "@/src/lib/settings";

export function MobileBuyBar({ settings }: { settings: StorefrontSettings }) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [buySectionVisible, setBuySectionVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".hero-section");
    const buySection = document.getElementById("buy");

    const heroObserver = hero
      ? new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
          threshold: 0.02
        })
      : null;

    const buyObserver = buySection
      ? new IntersectionObserver(([entry]) => setBuySectionVisible(entry.isIntersecting), {
          threshold: 0.08
        })
      : null;

    if (hero && heroObserver) heroObserver.observe(hero);
    if (buySection && buyObserver) buyObserver.observe(buySection);

    return () => {
      heroObserver?.disconnect();
      buyObserver?.disconnect();
    };
  }, []);

  const visible = !heroVisible && !buySectionVisible;
  if (!visible) return null;

  const total = settings.product.priceCents + settings.product.shippingCents;

  return (
    <div className="mobile-buy-bar is-visible" role="region" aria-label="Quick purchase">
      <span>{formatMoney(total, settings.product.currency)} today</span>
      <CheckoutButton settings={settings} label="Buy direct" showQuantity={false} showTotal={false} />
    </div>
  );
}
