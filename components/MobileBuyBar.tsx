"use client";

import { useEffect, useState } from "react";
import type { StorefrontSettings } from "@/src/lib/settings";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatMoney } from "@/src/lib/money";

export function MobileBuyBar({
  settings
}: {
  settings: StorefrontSettings;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".hero-section");
    const buy = document.querySelector("#buy");
    if (!hero || !buy) {
      setVisible(true);
      return;
    }

    let heroVisible = true;
    let buyVisible = false;
    const update = () => setVisible(!heroVisible && !buyVisible);

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        update();
      },
      { threshold: 0.02 }
    );
    const buyObserver = new IntersectionObserver(
      ([entry]) => {
        buyVisible = entry.isIntersecting;
        update();
      },
      { threshold: 0.05 }
    );

    heroObserver.observe(hero);
    buyObserver.observe(buy);

    return () => {
      heroObserver.disconnect();
      buyObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={`mobile-buy-bar ${
        visible ? "mobile-buy-bar-visible" : ""
      }`}
      aria-hidden={!visible}
    >
      <span>
        <strong>
          {formatMoney(
            settings.product.priceCents,
            settings.product.currency
          )}
        </strong>
        <small>per book · + S&amp;H · + applicable tax</small>
      </span>
      <CheckoutButton
        settings={settings}
        label="Buy direct"
        className="mobile-checkout"
      />
    </div>
  );
}
