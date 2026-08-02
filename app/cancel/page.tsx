import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout paused | Power NOW",
  robots: { index: false, follow: false }
};

export default function CancelPage() {
  return (
    <main className="status-page">
      <section>
        <p className="eyebrow">Checkout paused</p>
        <h1>No payment was completed.</h1>
        <p>
          Your order was not submitted. Return to the book page
          whenever you are ready.
        </p>
        <Link href="/#buy" className="button button-primary">
          Return to purchase
        </Link>
      </section>
    </main>
  );
}
