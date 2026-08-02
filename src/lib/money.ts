export function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2
  }).format(cents / 100);
}

export function dollarsToCents(value: string | number): number {
  const numberValue = typeof value === "number" ? value : Number.parseFloat(value || "0");
  if (Number.isNaN(numberValue)) return 0;
  return Math.round(numberValue * 100);
}
