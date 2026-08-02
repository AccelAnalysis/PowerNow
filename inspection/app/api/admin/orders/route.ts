import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  dispatchCheckoutSession,
  listPaidOrders
} from "@/src/lib/orders";
import { resolveStripeAdminKey } from "@/src/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown): NextResponse {
  const message =
    error instanceof Error ? error.message : "Order request failed.";

  if (message === "ADMIN_UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Unauthorized admin request." },
      { status: 401 }
    );
  }
  if (message === "STRIPE_KEY_REQUIRED") {
    return NextResponse.json(
      {
        error:
          "A Stripe restricted key is required for this session, or configure STRIPE_SECRET_KEY together with ADMIN_TOKEN in Vercel."
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const key = resolveStripeAdminKey(request);
    const stripe = new Stripe(key);
    const orders = await listPaidOrders(stripe);

    return NextResponse.json(
      { orders },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const key = resolveStripeAdminKey(request);
    const stripe = new Stripe(key);
    const body = (await request.json()) as {
      sessionId?: string;
      fulfillmentStatus?: string;
      trackingNumber?: string;
      carrier?: string;
    };

    const sessionId = String(body.sessionId ?? "").trim();
    if (!sessionId.startsWith("cs_")) {
      throw new Error("A valid Checkout Session ID is required.");
    }

    const status = String(
      body.fulfillmentStatus ?? "READY_TO_FULFILL"
    )
      .trim()
      .toUpperCase()
      .slice(0, 80);
    const trackingNumber = String(body.trackingNumber ?? "")
      .trim()
      .slice(0, 160);
    const carrier = String(body.carrier ?? "")
      .trim()
      .slice(0, 120);

    const metadata: Record<string, string> = {
      fulfillment_status: status,
      tracking_number: trackingNumber,
      carrier
    };
    if (status === "SHIPPED") {
      metadata.shipped_at = new Date().toISOString();
    }

    const session = await stripe.checkout.sessions.update(
      sessionId,
      { metadata }
    );

    return NextResponse.json({
      updated: true,
      sessionId: session.id,
      metadata: session.metadata
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const key = resolveStripeAdminKey(request);
    const stripe = new Stripe(key);
    const body = (await request.json()) as {
      sessionId?: string;
      action?: string;
    };
    const sessionId = String(body.sessionId ?? "").trim();
    if (!sessionId.startsWith("cs_")) {
      throw new Error("A valid Checkout Session ID is required.");
    }
    if (body.action !== "dispatch") {
      throw new Error("Unsupported order action.");
    }

    const result = await dispatchCheckoutSession({
      stripe,
      sessionId,
      eventId: `admin:${sessionId}:${Date.now()}`,
      eventType: "admin.fulfillment_dispatch"
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
