import Link from "next/link";
import { AdminSettingsEditor } from "@/components/AdminSettingsEditor";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <header className="simple-header">
        <Link href="/" className="brand-lockup">
          <span>Power NOW</span>
          <small>Storefront admin</small>
        </Link>
        <Link href="/" className="button button-secondary">
          View site
        </Link>
      </header>
      <AdminSettingsEditor />
    </main>
  );
}
