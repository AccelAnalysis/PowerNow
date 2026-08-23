import Stripe from "stripe";
import { loadStorefrontSettings } from "@/src/lib/settings";
import { postSignedPayload } from "@/src/lib/webhook-delivery";

export type ShippingAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export type NormalizedOrder = {
  schemaVersion: "1.0";
  eventId: string;
  eventType: string;
  orderId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  paymentLinkId: string | null;
  paidAt: string;
  paymentStatus: string;
  currency: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  affiliateRef: string | null;
  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  shipping: {
    name: string | null;
    address: ShippingAddress;
  };
  fulfillment: {
    status: string;
    source: "stripe_checkout";
    requestedAt: string;
  };
};

export type DispatchResult = {
  order: NormalizedOrder;
  ledger: "sent" | "already_sent" | "not_configured";
  fulfillment: "sent" | "already_sent" | "not_configured";
};

function valueId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function sessionShipping(session: Stripe.Checkout.Session): {
  name: string | null;
  address: ShippingAddress;
} {
  const unsafe = session as unknown as {
    shipping_details?: {
      name?: string | null;
      address?: Stripe.Address | null;
    } | null;
    collected_information?: {
      shipping_details?: {
        name?: string | null;
        address?: Stripe.Address | null;
      } | null;
    } | null;
  };

  const details =
    unsafe.collected_information?.shipping_details ??
    unsafe.shipping_details ??
    null;
  const address = details?.address ?? null;

  return {
    name: details?.name ?? null,
    address: {
      line1: address?.line1 ?? null,
      line2: address?.line2 ?? null,
      city: address?.city ?? null,
      state: address?.state ?? null,
      postalCode: address?.postal_code ?? null,
      country: address?.country ?? null
    }
  };
}

function quantityFromSession(session: Stripe.Checkout.Session): number {
  const expanded = session.line_items?.data ?? [];
  const bookLine = expanded.find((item) => {
    const product = item.price?.product;
    const metadata =
      product && typeof product !== "string" && "metadata" in product
        ? product.metadata
        : undefined;
    return (
      metadata?.product_id === "clarity-creates-speed-paperback" ||
      item.description?.toLowerCase().includes("clarity creates speed")
    );
  });
  const lineQuantity = bookLine?.quantity;
  if (typeof lineQuantity === "number" && lineQuantity > 0) {
    return lineQuantity;
  }

  const metadataQuantity = Number(session.metadata?.quantity ?? 1);
  return Number.isFinite(metadataQuantity) && metadataQuantity > 0
    ? Math.round(metadataQuantity)
    : 1;
}

function unitPriceFromSession(
  session: Stripe.Checkout.Session,
  fallback: number
): number {
  const expanded = session.line_items?.data ?? [];
  const bookLine = expanded.find((item) =>
    item.description?.toLowerCase().includes("clarity creates speed")
  );
  return bookLine?.price?.unit_amount ?? fallback;
}

export async function normalizeCheckoutOrder(options: {
  eventId: string;
  eventType: string;
  session: Stripe.Checkout.Session;
}): Promise<NormalizedOrder> {
  const { eventId, eventType, session } = options;
  const settings = await loadStorefrontSettings();
  const quantity = quantityFromSession(session);
  const details = session.customer_details;
  const shipping = sessionShipping(session);
  const totals = session.total_details;
  const paidAt = new Date(
    (session.created || Math.floor(Date.now() / 1000)) * 1000
  ).toISOString();

  return {
    schemaVersion: "1.0",
    eventId,
    eventType,
    orderId: `PN-${session.id}`,
    checkoutSessionId: session.id,
    paymentIntentId: valueId(session.payment_intent),
    paymentLinkId: valueId(session.payment_link),
    paidAt,
    paymentStatus: session.payment_status,
    currency: (session.currency ?? settings.product.currency).toUpperCase(),
    productId: session.metadata?.product_id ?? settings.product.id,
    productTitle: settings.product.title,
    quantity,
    unitPriceCents: unitPriceFromSession(
      session,
      settings.product.priceCents
    ),
    subtotalCents: session.amount_subtotal ?? settings.product.priceCents * quantity,
    shippingCents:
      totals?.amount_shipping ??
      Number(session.metadata?.shipping_cents ?? settings.product.shippingCents),
    taxCents: totals?.amount_tax ?? 0,
    discountCents: totals?.amount_discount ?? 0,
    totalCents: session.amount_total ?? 0,
    affiliateRef:
      session.client_reference_id ??
      session.metadata?.affiliate_ref ??
      null,
    customer: {
      name: details?.name ?? shipping.name ?? null,
      email: details?.email ?? null,
      phone: details?.phone ?? null
    },
    shipping,
    fulfillment: {
      status: session.metadata?.fulfillment_status ?? "READY_TO_FULFILL",
      source: "stripe_checkout",
      requestedAt: new Date().toISOString()
    }
  };
}

export async function retrieveExpandedCheckoutSession(
  stripe: Stripe,
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: [
      "line_items",
      "line_items.data.price.product",
      "payment_intent"
    ]
  });
}

export async function dispatchCheckoutSession(options: {
  stripe: Stripe;
  sessionId: string;
  eventId: string;
  eventType: string;
}): Promise<DispatchResult> {
  const { stripe, sessionId, eventId, eventType } = options;
  const session = await retrieveExpandedCheckoutSession(stripe, sessionId);

  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    throw new Error(
      `Checkout Session ${session.id} is not paid (${session.payment_status}).`
    );
  }

  const order = await normalizeCheckoutOrder({
    eventId,
    eventType,
    session
  });

  const metadata = session.metadata ?? {};
  const ledgerUrl = process.env.ORDER_LEDGER_WEBHOOK_URL?.trim() ?? "";
  const ledgerSecret =
    process.env.ORDER_LEDGER_SIGNING_SECRET?.trim() ?? "";
  const fulfillmentUrl =
    process.env.FULFILLMENT_WEBHOOK_URL?.trim() ?? "";
  const fulfillmentSecret =
    process.env.FULFILLMENT_WEBHOOK_SIGNING_SECRET?.trim() ?? "";

  let ledger: DispatchResult["ledger"] = "not_configured";
  let fulfillment: DispatchResult["fulfillment"] = "not_configured";
  const metadataUpdate: Record<string, string> = {
    fulfillment_status:
      metadata.fulfillment_status || "READY_TO_FULFILL"
  };

  if (ledgerUrl) {
    if (metadata.ledger_dispatched_at) {
      ledger = "already_sent";
    } else {
      await postSignedPayload({
        name: "Order ledger",
        url: ledgerUrl,
        secret: ledgerSecret,
        payload: order,
        idempotencyKey: `ledger:${session.id}`
      });
      ledger = "sent";
      metadataUpdate.ledger_dispatched_at = new Date().toISOString();
    }
  }

  if (fulfillmentUrl) {
    if (metadata.fulfillment_dispatched_at) {
      fulfillment = "already_sent";
    } else {
      await postSignedPayload({
        name: "Fulfillment provider",
        url: fulfillmentUrl,
        secret: fulfillmentSecret,
        payload: order,
        idempotencyKey: `fulfillment:${session.id}`
      });
      fulfillment = "sent";
      metadataUpdate.fulfillment_dispatched_at =
        new Date().toISOString();
      metadataUpdate.fulfillment_status = "SUBMITTED_TO_FULFILLMENT";
    }
  }

  if (
    Object.entries(metadataUpdate).some(
      ([key, value]) => metadata[key] !== value
    )
  ) {
    await stripe.checkout.sessions.update(session.id, {
      metadata: metadataUpdate
    });
  }

  return { order, ledger, fulfillment };
}

export type AdminOrder = {
  id: string;
  createdAt: string;
  paymentStatus: string;
  currency: string;
  amountSubtotal: number;
  amountShipping: number;
  amountTax: number;
  amountTotal: number;
  quantity: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingName: string | null;
  shippingAddress: ShippingAddress;
  affiliateRef: string | null;
  fulfillmentStatus: string;
  trackingNumber: string | null;
  carrier: string | null;
  ledgerDispatchedAt: string | null;
  fulfillmentDispatchedAt: string | null;
};

export async function listPaidOrders(
  stripe: Stripe,
  limit = 100
): Promise<AdminOrder[]> {
  const settings = await loadStorefrontSettings();
  const sessions = await stripe.checkout.sessions.list({
    limit: Math.min(Math.max(limit, 1), 100),
    status: "complete",
    expand: ["data.line_items"]
  });

  const orders: AdminOrder[] = [];
  for (const session of sessions.data) {
    const isPowerNow =
      session.metadata?.source === "powernow_direct_storefront" ||
      valueId(session.payment_link) === settings.checkout.paymentLinkId ||
      session.metadata?.product_id === settings.product.id;

    if (!isPowerNow || session.payment_status !== "paid") continue;

    const shipping = sessionShipping(session);
    orders.push({
      id: session.id,
      createdAt: new Date(session.created * 1000).toISOString(),
      paymentStatus: session.payment_status,
      currency: (session.currency ?? "usd").toUpperCase(),
      amountSubtotal: session.amount_subtotal ?? 0,
      amountShipping: session.total_details?.amount_shipping ?? 0,
      amountTax: session.total_details?.amount_tax ?? 0,
      amountTotal: session.amount_total ?? 0,
      quantity: quantityFromSession(session),
      customerName: session.customer_details?.name ?? null,
      customerEmail: session.customer_details?.email ?? null,
      customerPhone: session.customer_details?.phone ?? null,
      shippingName: shipping.name,
      shippingAddress: shipping.address,
      affiliateRef:
        session.client_reference_id ??
        session.metadata?.affiliate_ref ??
        null,
      fulfillmentStatus:
        session.metadata?.fulfillment_status ?? "READY_TO_FULFILL",
      trackingNumber: session.metadata?.tracking_number ?? null,
      carrier: session.metadata?.carrier ?? null,
      ledgerDispatchedAt:
        session.metadata?.ledger_dispatched_at ?? null,
      fulfillmentDispatchedAt:
        session.metadata?.fulfillment_dispatched_at ?? null
    });
  }

  return orders.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}
