"use client";

import { useMemo, useState } from "react";
import type { AdminOrder } from "@/src/lib/orders";
import { formatMoney } from "@/src/lib/money";

type StatusOption =
  | "READY_TO_FULFILL"
  | "PACKING"
  | "SUBMITTED_TO_FULFILLMENT"
  | "SHIPPED"
  | "ON_HOLD"
  | "CANCELLED";

function addressText(order: AdminOrder): string {
  const address = order.shippingAddress;
  return [
    order.shippingName,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.country
  ]
    .filter(Boolean)
    .join("\n");
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(orders: AdminOrder[]) {
  const header = [
    "Checkout Session",
    "Created",
    "Status",
    "Quantity",
    "Customer",
    "Email",
    "Phone",
    "Shipping Address",
    "Book Subtotal",
    "Shipping",
    "Tax",
    "Total",
    "Currency",
    "Affiliate",
    "Carrier",
    "Tracking"
  ];
  const rows = orders.map((order) => [
    order.id,
    order.createdAt,
    order.fulfillmentStatus,
    order.quantity,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    addressText(order),
    order.amountSubtotal,
    order.amountShipping,
    order.amountTax,
    order.amountTotal,
    order.currency,
    order.affiliateRef,
    order.carrier,
    order.trackingNumber
  ]);
  const content = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `power-now-orders-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function OrderLedger() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stripeKey, setStripeKey] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [status, setStatus] = useState(
    "Enter the operational credential, then load paid orders."
  );
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const visibleOrders = useMemo(
    () =>
      filter === "ALL"
        ? orders
        : orders.filter(
            (order) => order.fulfillmentStatus === filter
          ),
    [orders, filter]
  );

  function headers(): Record<string, string> {
    const result: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (stripeKey.trim()) {
      result["X-Stripe-Key"] = stripeKey.trim();
    }
    if (adminToken.trim()) {
      result.Authorization = `Bearer ${adminToken.trim()}`;
    }
    return result;
  }

  async function loadOrders() {
    setLoading(true);
    setStatus("Loading paid Checkout Sessions…");
    try {
      const response = await fetch("/api/admin/orders", {
        headers: headers(),
        cache: "no-store"
      });
      const body = (await response.json()) as {
        orders?: AdminOrder[];
        error?: string;
      };
      if (!response.ok || !body.orders) {
        throw new Error(body.error || "Orders could not be loaded.");
      }
      setOrders(body.orders);
      setStatus(
        `${body.orders.length} paid Power NOW order${
          body.orders.length === 1 ? "" : "s"
        } loaded directly from Stripe.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Orders could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateOrder(
    order: AdminOrder,
    updates: {
      fulfillmentStatus: StatusOption;
      trackingNumber?: string;
      carrier?: string;
    }
  ) {
    setStatus(`Updating ${order.id}…`);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          sessionId: order.id,
          ...updates
        })
      });
      const body = (await response.json()) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "Order update failed.");
      }
      await loadOrders();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Order update failed."
      );
    }
  }

  async function dispatch(order: AdminOrder) {
    setStatus(
      `Sending ${order.id} to configured ledger and fulfillment endpoints…`
    );
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          sessionId: order.id,
          action: "dispatch"
        })
      });
      const body = (await response.json()) as {
        error?: string;
        ledger?: string;
        fulfillment?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "Dispatch failed.");
      }
      setStatus(
        `Dispatch result — ledger: ${body.ledger}; fulfillment provider: ${body.fulfillment}.`
      );
      await loadOrders();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Dispatch failed."
      );
    }
  }

  return (
    <section className="admin-shell order-ledger-shell">
      <div className="admin-panel admin-hero-panel">
        <div>
          <p className="eyebrow">Automated order record</p>
          <h1>Paid-order center</h1>
          <p>
            This ledger is generated from paid Stripe Checkout
            Sessions. It removes the need to reconcile payment
            receipts against a separate shipping form.
          </p>
        </div>
        <div className="admin-summary">
          <span>Operational model</span>
          <strong>
            Stripe is the payment record; webhook destinations
            create the fulfillment queue.
          </strong>
          <small>
            Customer data is not duplicated into the public
            PowerNow repository.
          </small>
        </div>
      </div>

      <div className="admin-auth-panel">
        <label className="field">
          <span>
            Stripe restricted key, when no server key is configured
          </span>
          <input
            type="password"
            autoComplete="off"
            value={stripeKey}
            onChange={(event) =>
              setStripeKey(event.target.value)
            }
            placeholder="rk_live_… or sk_live_…"
          />
          <small>
            Kept only in page memory. A restricted key is preferred.
          </small>
        </label>
        <label className="field">
          <span>Admin passphrase, when configured</span>
          <input
            type="password"
            autoComplete="off"
            value={adminToken}
            onChange={(event) =>
              setAdminToken(event.target.value)
            }
          />
        </label>
        <button
          className="button button-primary"
          type="button"
          onClick={loadOrders}
          disabled={loading}
        >
          {loading ? "Loading…" : "Load paid orders"}
        </button>
      </div>

      <div className="order-toolbar">
        <label>
          <span>Filter</span>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
          >
            <option value="ALL">All orders</option>
            <option value="READY_TO_FULFILL">
              Ready to fulfill
            </option>
            <option value="PACKING">Packing</option>
            <option value="SUBMITTED_TO_FULFILLMENT">
              Submitted to provider
            </option>
            <option value="SHIPPED">Shipped</option>
            <option value="ON_HOLD">On hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => downloadCsv(visibleOrders)}
          disabled={!visibleOrders.length}
        >
          Export visible orders
        </button>
      </div>

      <p className="admin-status" role="status">
        {status}
      </p>

      <div className="orders-list">
        {visibleOrders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            onUpdate={updateOrder}
            onDispatch={dispatch}
          />
        ))}
      </div>
    </section>
  );
}

function OrderRow({
  order,
  onUpdate,
  onDispatch
}: {
  order: AdminOrder;
  onUpdate: (
    order: AdminOrder,
    updates: {
      fulfillmentStatus: StatusOption;
      trackingNumber?: string;
      carrier?: string;
    }
  ) => Promise<void>;
  onDispatch: (order: AdminOrder) => Promise<void>;
}) {
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState<StatusOption>(
      (order.fulfillmentStatus as StatusOption) ||
        "READY_TO_FULFILL"
    );
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber ?? ""
  );
  const [carrier, setCarrier] = useState(
    order.carrier ?? ""
  );

  return (
    <article className="order-card">
      <header>
        <div>
          <span className="order-id">{order.id}</span>
          <h2>
            {order.customerName ||
              order.shippingName ||
              "Customer"}
          </h2>
          <p>
            {new Date(order.createdAt).toLocaleString()} ·{" "}
            {order.quantity}{" "}
            {order.quantity === 1 ? "book" : "books"}
          </p>
        </div>
        <span className="status-pill">
          {order.fulfillmentStatus.replaceAll("_", " ")}
        </span>
      </header>

      <div className="order-grid">
        <div>
          <h3>Contact</h3>
          <p>{order.customerEmail || "No email returned"}</p>
          <p>{order.customerPhone || "No phone collected"}</p>
        </div>
        <div>
          <h3>Ship to</h3>
          <pre>{addressText(order)}</pre>
        </div>
        <div>
          <h3>Charges</h3>
          <dl>
            <div>
              <dt>Books</dt>
              <dd>
                {formatMoney(
                  order.amountSubtotal,
                  order.currency
                )}
              </dd>
            </div>
            <div>
              <dt>Shipping &amp; handling</dt>
              <dd>
                {formatMoney(
                  order.amountShipping,
                  order.currency
                )}
              </dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>
                {formatMoney(order.amountTax, order.currency)}
              </dd>
            </div>
            <div className="order-total">
              <dt>Stripe amount paid</dt>
              <dd>
                {formatMoney(order.amountTotal, order.currency)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="order-actions">
        <label>
          <span>Fulfillment status</span>
          <select
            value={fulfillmentStatus}
            onChange={(event) =>
              setFulfillmentStatus(
                event.target.value as StatusOption
              )
            }
          >
            <option value="READY_TO_FULFILL">
              Ready to fulfill
            </option>
            <option value="PACKING">Packing</option>
            <option value="SUBMITTED_TO_FULFILLMENT">
              Submitted to provider
            </option>
            <option value="SHIPPED">Shipped</option>
            <option value="ON_HOLD">On hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label>
          <span>Carrier</span>
          <input
            value={carrier}
            onChange={(event) =>
              setCarrier(event.target.value)
            }
            placeholder="USPS, UPS, FedEx…"
          />
        </label>
        <label>
          <span>Tracking number</span>
          <input
            value={trackingNumber}
            onChange={(event) =>
              setTrackingNumber(event.target.value)
            }
          />
        </label>
        <button
          className="button button-secondary"
          type="button"
          onClick={() =>
            void onUpdate(order, {
              fulfillmentStatus,
              trackingNumber,
              carrier
            })
          }
        >
          Save order status
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={() => void onDispatch(order)}
        >
          Send/retry automation
        </button>
      </div>

      <footer>
        <span>
          Ledger:{" "}
          {order.ledgerDispatchedAt
            ? `sent ${new Date(
                order.ledgerDispatchedAt
              ).toLocaleString()}`
            : "not marked sent"}
        </span>
        <span>
          Provider:{" "}
          {order.fulfillmentDispatchedAt
            ? `sent ${new Date(
                order.fulfillmentDispatchedAt
              ).toLocaleString()}`
            : "not marked sent"}
        </span>
        {order.affiliateRef ? (
          <span>Affiliate: {order.affiliateRef}</span>
        ) : null}
      </footer>
    </article>
  );
}
