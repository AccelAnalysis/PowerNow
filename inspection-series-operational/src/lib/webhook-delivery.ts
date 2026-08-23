import { createHmac, timingSafeEqual } from "node:crypto";

export type SignedEnvelope<T> = {
  timestamp: string;
  payloadBase64: string;
  signature: string;
};

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function createSignedEnvelope<T>(
  payload: T,
  secret: string
): SignedEnvelope<T> {
  const timestamp = new Date().toISOString();
  const payloadBase64 = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payloadBase64}`)
    .digest("hex");

  return { timestamp, payloadBase64, signature };
}

export function verifySignedEnvelope<T>(
  envelope: SignedEnvelope<T>,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(`${envelope.timestamp}.${envelope.payloadBase64}`)
    .digest("hex");
  const supplied = envelope.signature;

  if (expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function postSignedPayload<T>(options: {
  name: string;
  url: string;
  secret: string;
  payload: T;
  idempotencyKey: string;
}): Promise<void> {
  const { name, url, secret, payload, idempotencyKey } = options;
  if (!url) return;
  if (!secret) {
    throw new Error(`${name} is configured without its signing secret.`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "power-now-fulfillment/1.0"
    },
    body: JSON.stringify(createSignedEnvelope(payload, secret)),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000)
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `${name} rejected the order (${response.status}): ${message.slice(0, 300)}`
    );
  }
}
