import { formatMoney } from "@/src/lib/money";
import type { StorefrontSettings } from "@/src/lib/settings";

type PriceBreakdownProps = {
  settings: StorefrontSettings;
  compact?: boolean;
  dark?: boolean;
};

export function PriceBreakdown({
  settings,
  compact = false,
  dark = false
}: PriceBreakdownProps) {
  return (
    <div
      className={[
        "price-breakdown",
        compact ? "price-breakdown-compact" : "",
        dark ? "price-breakdown-dark" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Price details"
    >
      <div className="book-price">
        <strong>
          {formatMoney(
            settings.product.priceCents,
            settings.product.currency
          )}
        </strong>
        <span>per book</span>
      </div>
      <div className="shipping-price">
        <span>+</span>
        <strong>
          {formatMoney(
            settings.product.shippingCents,
            settings.product.currency
          )}
        </strong>
        <span>shipping &amp; handling per order</span>
      </div>
      <small>{settings.product.taxNotice}</small>
    </div>
  );
}
