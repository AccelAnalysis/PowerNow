"use client";

import { useMemo, useState } from "react";
import type { StorefrontSettings } from "@/src/lib/settings";
import { formatMoney } from "@/src/lib/money";

type CheckoutButtonProps = {
  settings: StorefrontSettings;
  label?: string;
  showQuantity?: boolean;
  className?: string;
};

type ReferralRecord = {
  code?: string;
  expiresAt?: number;
};

function readAffiliateRef(): string | undefined {
  try {
    const stored = window.localStorage.getItem(
      "powernow_referral"
    );
    if (!stored) return undefined;

    if (!stored.startsWith("{")) {
      return stored.slice(0, 80);
    }

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

export function CheckoutButton({
  settings,
  label,
  showQuantity = false,
  className
}: CheckoutButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [error, setError] = useState("");

  const bookSubtotal = useMemo(
    () => settings.product.priceCents * quantity,
    [quantity, settings.product.priceCents]
  );

  async function startCheckout() {
    setState("loading");
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: settings.product.id,
          quantity,
          affiliateRef: readAffiliateRef()
        })
      });

      const body = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !body.url) {
        throw new Error(
          body.error || "Checkout could not be opened."
        );
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
    <div
      className={[
        "checkout-control",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showQuantity ? (
        <label className="quantity-control">
          <span>Quantity</span>
          <select
            value={quantity}
            onChange={(event) =>
              setQuantity(Number(event.target.value))
            }
            aria-label="Book quantity"
          >
            {Array.from(
              {
                length: Math.min(
                  settings.product.purchaseLimit,
                  10
                )
              },
              (_, index) => index + 1
            ).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        className="button button-primary"
        type="button"
        onClick={startCheckout}
        disabled={state === "loading"}
        aria-busy={state === "loading"}
      >
        {state === "loading"
          ? "Opening secure checkout…"
          : label ?? settings.checkout.buyButtonLabel}
      </button>

      {showQuantity ? (
        <span className="checkout-note" aria-live="polite">
          {formatMoney(
            bookSubtotal,
            settings.product.currency
          )}{" "}
          book subtotal for {quantity}{" "}
          {quantity === 1 ? "copy" : "copies"}
          <br />
          Shipping and applicable tax are shown separately.
        </span>
      ) : (
        <span className="checkout-note">
          Book price, shipping, and applicable tax are itemized
          in Stripe.
        </span>
      )}

      {error ? (
        <small className="form-error" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
