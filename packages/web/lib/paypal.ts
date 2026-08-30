/**
 * PayPal REST (Orders v2) helper. Mirrors the role lib/stripe.ts plays for
 * Stripe: create an order, capture it after the buyer approves, refund a
 * capture, and expose the details we persist on each order row.
 */

const MODE = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
const BASE = MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export const PAYPAL_ENABLED = Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
export const PAYPAL_MODE = MODE;

export interface PaypalPaymentDetails {
  orderId: string;
  captureId: string | null;
  payerEmail: string | null;
  /** Gross amount actually captured (major units) + currency, when available. */
  capturedValue: string | null;
  capturedCurrency: string | null;
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PayPal authentication failed (${res.status})`);
  }
  const data = await res.json();
  return data.access_token as string;
}

interface CreateOrderInput {
  amount: string; // major units, 2dp string e.g. "7.91"
  currency: string; // e.g. "GBP"
  reference: string; // our internal grouping reference
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}

/** Creates a CAPTURE-intent order and returns its id + the buyer approval URL. */
export async function createPaypalOrder(input: CreateOrderInput): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.reference,
          description: input.description || "eSIM4U order",
          amount: { currency_code: input.currency, value: input.amount },
        },
      ],
      application_context: {
        brand_name: "eSIM4U",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to create PayPal order");
  }
  const approveUrl = (data.links || []).find((l: { rel: string; href: string }) => l.rel === "approve")?.href;
  if (!data.id || !approveUrl) {
    throw new Error("PayPal did not return an approval link");
  }
  return { id: data.id, approveUrl };
}

interface PaypalOrderInfo {
  id: string;
  status: string;
  reference: string | null;
  amount: string | null;
  currency: string | null;
  payerEmail: string | null;
}

/** Retrieves an order (used to validate status/amount before capture). */
export async function getPaypalOrder(orderId: string): Promise<PaypalOrderInfo> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to load PayPal order");
  }
  const pu = data?.purchase_units?.[0];
  return {
    id: data.id,
    status: data.status,
    reference: pu?.reference_id ?? null,
    amount: pu?.amount?.value ?? null,
    currency: pu?.amount?.currency_code ?? null,
    payerEmail: data?.payer?.email_address ?? null,
  };
}

/** Captures an approved order. Returns the details we persist. */
export async function capturePaypalOrder(orderId: string): Promise<{ status: string; details: PaypalPaymentDetails }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to capture PayPal payment");
  }
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: data.status,
    details: {
      orderId: data.id,
      captureId: capture?.id ?? null,
      payerEmail: data?.payer?.email_address ?? null,
      capturedValue: capture?.amount?.value ?? null,
      capturedCurrency: capture?.amount?.currency_code ?? null,
    },
  };
}

/**
 * Verifies a webhook event signature with PayPal. Returns true only on a
 * confirmed SUCCESS. If PAYPAL_WEBHOOK_ID isn't configured, returns false so
 * callers fall back to re-checking the order status via the API.
 */
export async function verifyPaypalWebhook(headersObj: Record<string, string | null>, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  try {
    const token = await getAccessToken();
    const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: headersObj["paypal-auth-algo"],
        cert_url: headersObj["paypal-cert-url"],
        transmission_id: headersObj["paypal-transmission-id"],
        transmission_sig: headersObj["paypal-transmission-sig"],
        transmission_time: headersObj["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
      cache: "no-store",
    });
    const data = await res.json();
    return data?.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}

/**
 * Refunds a capture (full, or a partial amount). Used when an eSIM fails to
 * provision after the buyer has already paid.
 */
export async function refundPaypalCapture(
  captureId: string,
  amount?: { value: string; currency: string }
): Promise<{ id: string; status: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: amount ? JSON.stringify({ amount: { value: amount.value, currency_code: amount.currency } }) : "{}",
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to refund PayPal capture");
  }
  return { id: data.id, status: data.status };
}
