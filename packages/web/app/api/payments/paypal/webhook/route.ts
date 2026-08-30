import { NextRequest, NextResponse } from "next/server";
import {
  PAYPAL_ENABLED,
  verifyPaypalWebhook,
  getPaypalOrder,
  capturePaypalOrder,
} from "@/lib/paypal";
import { fulfillPaypalSession, cancelPaypalSession } from "@/lib/fulfillment";

/**
 * PayPal webhook — a safety net behind the confirm-on-return flow.
 *
 * Security: we verify the PayPal signature when PAYPAL_WEBHOOK_ID is set, and
 * regardless we ALWAYS re-fetch the order from PayPal's API and require a
 * COMPLETED status before provisioning. That server-to-server check means a
 * forged event cannot trigger fulfilment without a real payment.
 */
function extractOrderId(resource: Record<string, unknown>): string | null {
  // For an order resource the id is the order id; for a capture resource the
  // order id lives under supplementary_data.related_ids.order_id.
  const supp = resource?.supplementary_data as { related_ids?: { order_id?: string } } | undefined;
  if (supp?.related_ids?.order_id) return supp.related_ids.order_id;
  if (typeof resource?.id === "string" && resource?.status !== undefined && "purchase_units" in resource) {
    return resource.id as string;
  }
  return (resource?.id as string) || null;
}

export async function POST(request: NextRequest) {
  if (!PAYPAL_ENABLED) {
    return NextResponse.json({ error: "PayPal is not configured" }, { status: 503 });
  }

  const rawBody = await request.text();

  const headersObj: Record<string, string | null> = {
    "paypal-auth-algo": request.headers.get("paypal-auth-algo"),
    "paypal-cert-url": request.headers.get("paypal-cert-url"),
    "paypal-transmission-id": request.headers.get("paypal-transmission-id"),
    "paypal-transmission-sig": request.headers.get("paypal-transmission-sig"),
    "paypal-transmission-time": request.headers.get("paypal-transmission-time"),
  };

  // Signature check (best-effort). We still verify via the API below, so this
  // being false does not by itself allow fulfilment without a real payment.
  await verifyPaypalWebhook(headersObj, rawBody);

  let event: { event_type?: string; resource?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const type = event.event_type || "";
    const resource = event.resource || {};

    switch (type) {
      case "CHECKOUT.ORDER.APPROVED": {
        // Buyer approved but may have closed the tab before returning. Capture
        // now if still needed, then fulfil.
        const orderId = (resource.id as string) || null;
        if (!orderId) break;
        const info = await getPaypalOrder(orderId);
        if (info.status === "APPROVED") {
          try {
            const { status, details } = await capturePaypalOrder(orderId);
            if (status === "COMPLETED") await fulfillPaypalSession(orderId, details);
          } catch {
            // Likely already captured by the return flow — re-check and fulfil.
            const after = await getPaypalOrder(orderId);
            if (after.status === "COMPLETED") {
              await fulfillPaypalSession(orderId, {
                orderId,
                captureId: null,
                payerEmail: after.payerEmail,
                capturedValue: after.amount,
                capturedCurrency: after.currency,
              });
            }
          }
        } else if (info.status === "COMPLETED") {
          await fulfillPaypalSession(orderId, {
            orderId,
            captureId: null,
            payerEmail: info.payerEmail,
            capturedValue: info.amount,
            capturedCurrency: info.currency,
          });
        }
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId = extractOrderId(resource);
        if (!orderId) break;
        // Re-verify with PayPal before provisioning.
        const info = await getPaypalOrder(orderId);
        if (info.status === "COMPLETED") {
          await fulfillPaypalSession(orderId, {
            orderId,
            captureId: (resource.id as string) || null,
            payerEmail: info.payerEmail,
            capturedValue: info.amount,
            capturedCurrency: info.currency,
          });
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED": {
        const orderId = extractOrderId(resource);
        if (orderId) await cancelPaypalSession(orderId);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    // Return 500 so PayPal retries later.
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error(`PayPal webhook error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
