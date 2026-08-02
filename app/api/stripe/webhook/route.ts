import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function appendLocalOrderLog(session: Stripe.Checkout.Session) {
  const record = {
    event: "checkout.session.completed",
    sessionId: session.id,
    customerEmail: session.customer_details?.email ?? null,
    amountTotal: session.amount_total,
    currency: session.currency,
    productId: session.metadata?.product_id ?? null,
    affiliateRef: session.metadata?.affiliate_ref ?? null,
    quantity: session.metadata?.quantity ?? null,
    createdAt: new Date().toISOString()
  };

  const filePath = path.join(process.cwd(), "data/orders.ndjson");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8").catch(() => {
    console.log("Power NOW order", record);
  });
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      await appendLocalOrderLog(event.data.object as Stripe.Checkout.Session);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook could not be processed." },
      { status: 400 }
    );
  }
}
