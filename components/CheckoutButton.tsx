"use client";

import { useMemo, useState } from "react";
import type { StorefrontSettings } from "@/src/lib/settings";
import { formatMoney } from "@/src/lib/money";

type CheckoutButtonProps = {
  settings: StorefrontSettings;
  className?: string;
  label?: string;
};

export function CheckoutButton({ settings, className, label }: CheckoutButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const total = useMemo(
    () => settings.product.priceCents * quantity + settings.product.shippingCents,
    [quantity, settings.product.priceCents, settings.product.shippingCents]
  );

  async function startCheckout() {
    setStatus("loading");
    setError("");

    try {
      const affiliateRef = window.localStorage.getItem("powernow_referral") ?? undefined;
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: settings.product.id,
          quantity,
          affiliateRef
        })
      });

      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        throw new Error(body.error || "Checkout could not be started.");
      }

      window.location.href = body.url;
    } catch (checkoutError) {
      setStatus("error");
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
    }
  }

  return (
    <div className={className ? `checkout-control ${className}` : "checkout-control"}>
      <label className="quantity-control">
        <span>Qty</span>
        <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} aria-label="Quantity">
          {Array.from({ length: settings.product.purchaseLimit }, (_, index) => index + 1)
            .slice(0, 10)
            .map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
      </label>
      <button className="button button-primary" type="button" onClick={startCheckout} disabled={status === "loading"}>
        {status === "loading" ? "Opening checkout…" : label ?? settings.checkout.buyButtonLabel}
      </button>
      <span className="checkout-total" aria-live="polite">
        {formatMoney(total, settings.product.currency)} total today
      </span>
      {error ? <small className="form-error">{error}</small> : null}
    </div>
  );
}
