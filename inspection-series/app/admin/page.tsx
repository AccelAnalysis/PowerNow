import type { Metadata } from "next";
import Link from "next/link";
import { AdminSettingsEditor } from "@/components/AdminSettingsEditor";
import { SeriesCatalogEditor } from "@/components/SeriesCatalogEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Storefront admin | Power NOW",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <main className="admin-page">
      <header className="simple-header">
        <Link href="/" className="brand-lockup">
          <span>Power NOW</span>
          <small>Storefront admin</small>
        </Link>
        <nav className="admin-header-nav">
          <Link href="/books" className="button button-secondary">
            Series catalog
          </Link>
          <Link href="/admin/orders" className="button button-secondary">
            Paid orders
          </Link>
          <Link href="/" className="button button-secondary">
            View site
          </Link>
        </nav>
      </header>
      <SeriesCatalogEditor />
      <div className="admin-section-divider" aria-hidden="true" />
      <AdminSettingsEditor />
    </main>
  );
}
