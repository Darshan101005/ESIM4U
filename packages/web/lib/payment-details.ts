import { isPaidStatus } from "@/lib/order-status";

/**
 * Builds the dynamic list of payment detail rows for an order. Only fields that
 * actually apply to the order's method + status are returned, so nothing shows
 * empty or misleading. `audience` controls verbosity: customers see the useful,
 * human-friendly fields; admins additionally see the raw gateway identifiers.
 */

export interface PaymentOrderLike {
  status: string;
  discount_amount?: string | null;
  payment_method_type?: string | null;
  payment_source?: string | null;
  order_reference?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent?: string | null;
  stripe_charge_id?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;
  card_wallet?: string | null;
  receipt_url?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  bank_transfer_reference?: string | null;
  refund_id?: string | null;
  refund_status?: string | null;
  promo_code?: string | null;
  affiliate_code?: string | null;
  status_reason?: string | null;
}

export interface PaymentRow {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
}

function cap(s?: string | null): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function pretty(s?: string | null): string {
  return s ? s.split(/[_-]/).map(cap).join(" ") : "";
}

const isPaypal = (o: PaymentOrderLike) => o.payment_method_type === "paypal" || o.payment_source === "paypal";
const isWallet = (o: PaymentOrderLike) => o.payment_method_type === "wallet" || o.payment_source === "wallet";
const isBank = (o: PaymentOrderLike) => o.payment_method_type === "bank_transfer" || o.payment_source === "bank_transfer";

/** Human label for the payment method, including the card/wallet used for Stripe. */
export function paymentMethodLabel(o: PaymentOrderLike): string {
  if (isBank(o)) return "Bank Transfer · Monzo";
  if (isWallet(o)) return "eSIM4U Wallet";
  if (isPaypal(o)) return "PayPal";

  let method = "";
  if (o.card_wallet) {
    method = pretty(o.card_wallet);
    if (o.card_brand && o.card_last4) method += ` (${cap(o.card_brand)} •••• ${o.card_last4})`;
  } else if (o.card_brand) {
    method = `${cap(o.card_brand)} •••• ${o.card_last4 || "••••"}`;
  } else if (o.payment_method_type) {
    method = pretty(o.payment_method_type);
  }
  const gateway = o.stripe_payment_intent || o.stripe_session_id ? "Stripe" : null;
  if (method && gateway) return `${method} · ${gateway}`;
  return method || gateway || "—";
}

export function buildPaymentRows(o: PaymentOrderLike, audience: "customer" | "admin"): PaymentRow[] {
  const rows: PaymentRow[] = [];
  const paid = isPaidStatus(o.status);
  const admin = audience === "admin";

  rows.push({ label: "Payment Method", value: paymentMethodLabel(o) });
  if (o.order_reference) rows.push({ label: "Order ID", value: o.order_reference, mono: true });

  // Gateway transaction identifiers — proof money moved, so only when paid.
  if (paid) {
    if (isPaypal(o)) {
      if (o.paypal_capture_id) rows.push({ label: "PayPal Transaction ID", value: o.paypal_capture_id, mono: true });
      if (admin && o.paypal_order_id) rows.push({ label: "PayPal Order ID", value: o.paypal_order_id, mono: true });
    } else if (isWallet(o)) {
      // Paid from internal balance — no external transaction id.
    } else if (isBank(o)) {
      if (admin && o.bank_transfer_reference) rows.push({ label: "Bank Reference", value: o.bank_transfer_reference, mono: true });
    } else {
      if (o.stripe_payment_intent) rows.push({ label: "Stripe Transaction ID", value: o.stripe_payment_intent, mono: true });
      if (admin && o.stripe_charge_id) rows.push({ label: "Charge ID", value: o.stripe_charge_id, mono: true });
      if (admin && o.stripe_session_id) rows.push({ label: "Checkout Session ID", value: o.stripe_session_id, mono: true });
    }
  }

  // Bank reference is useful to admins even while awaiting verification.
  if (admin && !paid && isBank(o) && o.bank_transfer_reference) {
    rows.push({ label: "Bank Reference", value: o.bank_transfer_reference, mono: true });
  }

  if (admin) {
    if (o.promo_code) rows.push({ label: "Promo Code", value: o.promo_code });
    if (o.affiliate_code) rows.push({ label: "Affiliate Code", value: o.affiliate_code });
    if (o.discount_amount && Number(o.discount_amount) > 0) {
      rows.push({ label: "Discount", value: `$${Number(o.discount_amount).toFixed(2)}` });
    }
  }

  if (o.refund_id) rows.push({ label: "Refund ID", value: o.refund_id, mono: true });
  if (o.refund_status) rows.push({ label: "Refund Status", value: pretty(o.refund_status) });

  if (o.receipt_url) rows.push({ label: "Receipt", value: "View receipt", href: o.receipt_url });

  // Failure/hold reason where relevant (never for a paid/successful order).
  if (!paid && o.status_reason) rows.push({ label: "Reason", value: o.status_reason });

  return rows;
}
