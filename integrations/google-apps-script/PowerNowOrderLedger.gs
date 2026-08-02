/**
 * Power NOW paid-order ledger for Google Sheets.
 *
 * Script properties required:
 *   POWER_NOW_SPREADSHEET_ID
 *   POWER_NOW_LEDGER_SECRET
 * Optional:
 *   POWER_NOW_NOTIFICATION_EMAIL
 *
 * Deploy as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Access is protected by the HMAC envelope, not by the public URL alone.
 */

const SHEET_NAME = "Orders";
const HEADERS = [
  "Event ID",
  "Event Type",
  "Order ID",
  "Checkout Session",
  "Payment Intent",
  "Paid At",
  "Payment Status",
  "Currency",
  "Product",
  "Quantity",
  "Unit Price (cents)",
  "Book Subtotal (cents)",
  "Shipping & Handling (cents)",
  "Tax (cents)",
  "Discount (cents)",
  "Amount Paid (cents)",
  "Affiliate",
  "Customer Name",
  "Customer Email",
  "Customer Phone",
  "Ship-to Name",
  "Address Line 1",
  "Address Line 2",
  "City",
  "State",
  "Postal Code",
  "Country",
  "Fulfillment Status",
  "Carrier",
  "Tracking Number",
  "Shipped At",
  "Last Updated"
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: "power-now-order-ledger",
    sheet: SHEET_NAME
  });
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const envelope = JSON.parse(event.postData.contents || "{}");
    const payload = verifyAndDecode(envelope);
    const sheet = getOrderSheet();
    const existingRow = findOrderRow(
      sheet,
      payload.checkoutSessionId,
      payload.eventId
    );
    const now = new Date().toISOString();
    const row = orderToRow(payload, now);

    if (existingRow > 0) {
      sheet
        .getRange(existingRow, 1, 1, HEADERS.length)
        .setValues([row]);
    } else {
      sheet.appendRow(row);
      sendNewOrderNotification(payload);
    }

    return jsonResponse({
      ok: true,
      action: existingRow > 0 ? "updated" : "created",
      checkoutSessionId: payload.checkoutSessionId
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  } finally {
    lock.releaseLock();
  }
}

function getOrderSheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(
    "POWER_NOW_SPREADSHEET_ID"
  );
  if (!spreadsheetId) {
    throw new Error(
      "POWER_NOW_SPREADSHEET_ID is not configured."
    );
  }

  const spreadsheet =
    SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold");
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  return sheet;
}

function verifyAndDecode(envelope) {
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty(
    "POWER_NOW_LEDGER_SECRET"
  );
  if (!secret) {
    throw new Error(
      "POWER_NOW_LEDGER_SECRET is not configured."
    );
  }

  const timestamp = String(envelope.timestamp || "");
  const payloadBase64 = String(
    envelope.payloadBase64 || ""
  );
  const suppliedSignature = String(
    envelope.signature || ""
  );

  if (!timestamp || !payloadBase64 || !suppliedSignature) {
    throw new Error("Incomplete signed envelope.");
  }

  const timestampMs = new Date(timestamp).getTime();
  if (
    !isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) >
      15 * 60 * 1000
  ) {
    throw new Error("Expired or invalid request timestamp.");
  }

  const signatureBytes =
    Utilities.computeHmacSha256Signature(
      timestamp + "." + payloadBase64,
      secret
    );
  const expectedSignature = signatureBytes
    .map(function (byte) {
      const normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    })
    .join("");

  if (!constantTimeEqual(expectedSignature, suppliedSignature)) {
    throw new Error("Invalid ledger signature.");
  }

  const payloadBytes =
    Utilities.base64DecodeWebSafe(payloadBase64);
  const payloadText =
    Utilities.newBlob(payloadBytes).getDataAsString("UTF-8");
  const payload = JSON.parse(payloadText);

  if (!payload.checkoutSessionId || !payload.eventId) {
    throw new Error("Order identity is missing.");
  }

  return payload;
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |=
      left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function findOrderRow(sheet, sessionId, eventId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet
    .getRange(2, 1, lastRow - 1, 4)
    .getValues();

  for (let index = 0; index < values.length; index++) {
    const rowEventId = String(values[index][0] || "");
    const rowSessionId = String(values[index][3] || "");
    if (
      rowSessionId === String(sessionId) ||
      rowEventId === String(eventId)
    ) {
      return index + 2;
    }
  }

  return -1;
}

function orderToRow(order, now) {
  const customer = order.customer || {};
  const shipping = order.shipping || {};
  const address = shipping.address || {};
  const fulfillment = order.fulfillment || {};

  return [
    order.eventId || "",
    order.eventType || "",
    order.orderId || "",
    order.checkoutSessionId || "",
    order.paymentIntentId || "",
    order.paidAt || "",
    order.paymentStatus || "",
    order.currency || "",
    order.productTitle || "",
    Number(order.quantity || 0),
    Number(order.unitPriceCents || 0),
    Number(order.subtotalCents || 0),
    Number(order.shippingCents || 0),
    Number(order.taxCents || 0),
    Number(order.discountCents || 0),
    Number(order.totalCents || 0),
    order.affiliateRef || "",
    customer.name || "",
    customer.email || "",
    customer.phone || "",
    shipping.name || "",
    address.line1 || "",
    address.line2 || "",
    address.city || "",
    address.state || "",
    address.postalCode || "",
    address.country || "",
    fulfillment.status || "READY_TO_FULFILL",
    "",
    "",
    "",
    now
  ];
}

function sendNewOrderNotification(order) {
  const email =
    PropertiesService.getScriptProperties().getProperty(
      "POWER_NOW_NOTIFICATION_EMAIL"
    );
  if (!email) return;

  const customer = order.customer || {};
  const shipping = order.shipping || {};
  const address = shipping.address || {};
  const addressLines = [
    shipping.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.country
  ]
    .filter(Boolean)
    .join("\n");

  const amount = (
    Number(order.totalCents || 0) / 100
  ).toFixed(2);

  MailApp.sendEmail({
    to: email,
    subject:
      "Power NOW paid order ready: " +
      String(order.orderId || order.checkoutSessionId),
    body: [
      "A paid order was added to the Power NOW ledger.",
      "",
      "Order: " +
        String(order.orderId || order.checkoutSessionId),
      "Quantity: " + String(order.quantity || 0),
      "Amount paid: " +
        String(order.currency || "USD") +
        " " +
        amount,
      "Customer: " + String(customer.name || ""),
      "Email: " + String(customer.email || ""),
      "",
      "Ship to:",
      addressLines,
      "",
      "Open the configured Google Sheet to manage fulfillment."
    ].join("\n")
  });
}

function jsonResponse(value) {
  return ContentService.createTextOutput(
    JSON.stringify(value)
  ).setMimeType(ContentService.MimeType.JSON);
}
