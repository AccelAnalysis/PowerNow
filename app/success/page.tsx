import Link from "next/link";
import { loadStorefrontSettings } from "@/src/lib/settings";

export const dynamic = "force-dynamic";

export default async function SuccessPage() {
  const settings = await loadStorefrontSettings();

  return (
    <main className="status-page">
      <section>
        <p className="eyebrow">Order received</p>
        <h1>Thank you for buying {settings.product.title}.</h1>
        <p>
          Stripe will send the checkout confirmation to the email address used during purchase. Fulfillment will follow the shipping details collected at checkout.
        </p>
        <Link href="/" className="button button-primary">
          Return to Power NOW
        </Link>
      </section>
    </main>
  );
}
