import { NextResponse } from "next/server";
import Stripe from "stripe";
import { dispatchCheckoutSession } from "@/src/lib/orders";
import { postSignedPayload } from "@/src/lib/webhook-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forwardRefund(event: Stripe.Event): Promise<void> {
  const url = process.env.ORDER_LEDGER_WEBHOOK_URL?.trim() ?? "";
  if (!url) return;

  const charge = event.data.object as Stripe.Charge;
  await postSignedPayload({
    name: "Order ledger",
    url,
    secret:
      process.env.ORDER_LEDGER_SIGNING_SECRET?.trim() ?? "",
    payload: {
      schemaVersion: "1.0",
      eventId: event.id,
      eventType: event.type,
      chargeId: charge.id,
      paymentIntentId:
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null,
      amountRefunded: charge.amount_refunded,
      currency: charge.currency.toUpperCase(),
      refunded: charge.refunded,
      createdAt: new Date(event.created * 1000).toISOString()
    },
    idempotencyKey: `ledger:${event.id}`
  });
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Stripe webhook is not activated. Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET."
      },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secretKey);

  try {
    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      // Delayed payment methods can complete Checkout before funds settle.
      // The async success event will call this again when payment is paid.
      if (
        event.type === "checkout.session.completed" &&
        session.payment_status === "unpaid"
      ) {
        return NextResponse.json({
          received: true,
          fulfillment: "waiting_for_payment"
        });
      }

      const result = await dispatchCheckoutSession({
        stripe,
        sessionId: session.id,
        eventId: event.id,
        eventType: event.type
      });

      return NextResponse.json({
        received: true,
        fulfillment: {
          ledger: result.ledger,
          provider: result.fulfillment
        }
      });
    }

    if (event.type === "charge.refunded") {
      await forwardRefund(event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Returning a non-2xx response causes Stripe to retry live events.
    console.error(
      "Power NOW webhook delivery failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed."
      },
      { status: 500 }
    );
  }
}
