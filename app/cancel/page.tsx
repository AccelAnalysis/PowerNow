import Link from "next/link";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export default async function CancelPage() {
  const settings = await loadStorefrontSettings();

  return (
    <main className="status-page">
      <section>
        <p className="eyebrow">Checkout paused</p>
        <h1>Your order was not completed.</h1>
        <p>
          You can return to the book page, read the opening chapter, or restart checkout when ready.
        </p>
        <div className="hero-actions">
          <Link href="/#buy" className="button button-primary">
            Return to checkout
          </Link>
          <Link href="/read-chapter-one" className="button button-secondary">
            Read Chapter One
          </Link>
        </div>
        <small>{settings.product.title} · {settings.brand.seriesName}</small>
      </section>
    </main>
  );
}
