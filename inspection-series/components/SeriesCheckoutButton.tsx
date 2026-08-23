"use client";

import { useMemo, useState } from "react";
import type { SeriesBook } from "@/src/lib/books";
import { formatMoney } from "@/src/lib/money";

type ReferralRecord = {
  code?: string;
  expiresAt?: number;
};

function readAffiliateRef(): string | undefined {
  try {
    const stored = window.localStorage.getItem("powernow_referral");
    if (!stored) return undefined;
    if (!stored.startsWith("{")) return stored.slice(0, 80);
    const record = JSON.parse(stored) as ReferralRecord;
    if (
      typeof record.expiresAt === "number" &&
      record.expiresAt < Date.now()
    ) {
      window.localStorage.removeItem("powernow_referral");
      return undefined;
    }
    return typeof record.code === "string"
      ? record.code.slice(0, 80)
      : undefined;
  } catch {
    return undefined;
  }
}

export function SeriesCheckoutButton({ book }: { book: SeriesBook }) {
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () => book.priceCents * quantity,
    [book.priceCents, quantity]
  );

  async function startCheckout() {
    setState("loading");
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: book.slug,
          quantity,
          affiliateRef: readAffiliateRef()
        })
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        throw new Error(body.error || "Checkout could not be opened.");
      }
      window.location.assign(body.url);
    } catch (checkoutError) {
      setState("error");
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout could not be opened."
      );
    }
  }

  return (
    <div className="checkout-control series-checkout-control">
      <label className="quantity-control">
        <span>Quantity</span>
        <select
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          aria-label="Book quantity"
        >
          {Array.from(
            { length: Math.min(book.purchaseLimit, 10) },
            (_, index) => index + 1
          ).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <button
        className="button button-primary"
        type="button"
        onClick={startCheckout}
        disabled={state === "loading"}
        aria-busy={state === "loading"}
      >
        {state === "loading" ? "Opening secure checkout…" : "Buy direct"}
      </button>

      <span className="checkout-note" aria-live="polite">
        {formatMoney(subtotal, book.currency)} book subtotal
        <br />
        Shipping and applicable tax are shown separately.
      </span>

      {error ? (
        <small className="form-error" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
