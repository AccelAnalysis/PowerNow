import type { Metadata } from "next";
import Link from "next/link";
import { OrderLedger } from "@/components/OrderLedger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paid-order center | Power NOW",
  robots: { index: false, follow: false }
};

export default function OrdersPage() {
  return (
    <main className="admin-page">
      <header className="simple-header">
        <Link href="/" className="brand-lockup">
          <span>Power NOW</span>
          <small>Paid-order center</small>
        </Link>
        <nav className="admin-header-nav">
          <Link href="/admin" className="button button-secondary">
            Storefront settings
          </Link>
          <Link href="/" className="button button-secondary">
            View site
          </Link>
        </nav>
      </header>
      <OrderLedger />
    </main>
  );
}
