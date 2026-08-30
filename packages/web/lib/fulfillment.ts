import QRCode from "qrcode";
import pool from "@/lib/db";
import { assignBundle, fetchOrderById } from "@/lib/montyesim";
import { incrementPromoUsage } from "@/lib/promo";
import { validateAffiliateCode, recordAffiliateSale } from "@/lib/affiliate";
import { stripe, StripePaymentDetails } from "@/lib/stripe";
import { refundPaypalCapture, PaypalPaymentDetails } from "@/lib/paypal";
import { ensureOrderPaymentColumns } from "@/lib/orders-schema";
import { creditWallet } from "@/lib/wallet";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

async function buildQrDataUrl(activationCode: string | null): Promise<string | null> {
  if (!activationCode) return null;
  try {
    return await QRCode.toDataURL(activationCode, { width: 480, margin: 1, errorCorrectionLevel: "M" });
  } catch {
    return null;
  }
}

interface OrderRow {
  id: number;
  user_id: string;
  user_email: string;
  customer_name: string | null;
  bundle_code: string;
  order_reference: string;
  price: string;
  promo_code: string | null;
  affiliate_code: string | null;
  status: string;
  refund_id: string | null;
  [key: string]: unknown;
}

interface AssignmentData {
  montyOrderId: string | null;
  iccid: string | null;
  qrCodeUrl: string | null;
  activationCode: string | null;
  smdpAddress: string | null;
  matchingId: string | null;
  activationOtp: string | null;
  bundleExpiry: string | null;
}

/**
 * Calls MontyeSIM to provision the eSIM for a single order row and gathers the
 * activation details. Shared by both the Stripe and wallet fulfilment paths.
 * Throws if provisioning fails.
 */
async function performAssignment(row: OrderRow): Promise<AssignmentData> {
  const montyResult = await assignBundle({
    bundleCode: row.bundle_code,
    email: row.user_email,
    name: row.customer_name || "Customer",
    orderReference: row.order_reference,
  });

  const montyOrderId = montyResult.order_id || null;
  let activationCode: string | null = null;
  let smdpAddress: string | null = null;
  let matchingId: string | null = null;
  let activationOtp: string | null = null;
  let iccid: string | null = montyResult.iccid || null;
  let bundleExpiry: string | null = null;

  if (montyOrderId) {
    try {
      const order = await fetchOrderById(montyOrderId);
      if (order) {
        activationCode = order.activation_code || null;
        smdpAddress = order.smdp_address || null;
        matchingId = order.matching_id || null;
        activationOtp = order.otp || null;
        iccid = order.iccid || iccid;
        bundleExpiry = order.bundle_expiry_date || null;
      }
    } catch {}
  }

  const qrCodeUrl = await buildQrDataUrl(activationCode);

  return { montyOrderId, iccid, qrCodeUrl, activationCode, smdpAddress, matchingId, activationOtp, bundleExpiry };
}

/** Records the affiliate commission for a completed order, if one applies. */
async function recordAffiliateForRow(row: OrderRow): Promise<void> {
  if (!row.affiliate_code) return;
  try {
    const aff = await validateAffiliateCode(row.affiliate_code, Number(row.price));
    if (aff.valid && aff.affiliateId) {
      await recordAffiliateSale({
        affiliateId: aff.affiliateId,
        affiliateCode: aff.code || row.affiliate_code,
        orderId: row.id,
        orderReference: row.order_reference,
        saleAmount: Number(row.price),
        commissionRate: aff.commissionRate,
      });
    }
  } catch {}
}

/** Increments promo usage once if any item completed. Shared helper. */
async function finalizeSessionSideEffects(
  whereClause: string,
  whereValue: string,
  userId: string,
  hadPending: boolean
): Promise<void> {
  if (!hadPending) return;

  const afterRes = await pool.query(`SELECT status, promo_code FROM orders WHERE ${whereClause} = $1`, [whereValue]);
  const afterRows = afterRes.rows as { status: string; promo_code: string | null }[];
  const anyCompleted = afterRows.some((r) => r.status === "completed");
  const promoCode = afterRows.find((r) => r.promo_code)?.promo_code;
  if (promoCode && anyCompleted) {
    try {
      await incrementPromoUsage(promoCode);
    } catch {}
  }

  // Clear the cart now that the session has been processed.
  await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
}

/**
 * Resolves a paid Checkout Session: assigns each pending eSIM via MontyeSIM,
 * marks each order completed/failed, auto-refunds failed items, clears the cart.
 * Idempotent — only acts on rows still in `pending`.
 */
export async function fulfillSession(stripeSessionId: string, payment?: StripePaymentDetails) {
  await ensureOrderPaymentColumns();

  const res = await pool.query(`SELECT * FROM orders WHERE stripe_session_id = $1 ORDER BY id ASC`, [stripeSessionId]);
  const rows = res.rows as OrderRow[];
  if (rows.length === 0) return [];

  // Atomically claim the pending rows so a concurrent caller (e.g. webhook +
  // confirm-on-return firing together) can't process the same eSIM twice.
  const claim = await pool.query(
    `UPDATE orders SET status = 'processing' WHERE stripe_session_id = $1 AND status = 'pending' RETURNING *`,
    [stripeSessionId]
  );
  const pending = claim.rows as OrderRow[];

  for (const row of pending) {
    try {
      const a = await performAssignment(row);
      await pool.query(
        `UPDATE orders SET monty_order_id = $1, iccid = $2, qr_code_url = $3, lpa_code = $4, smdp_address = $5,
           matching_id = $6, activation_otp = $7, bundle_expiry_date = $8, status = 'completed',
           stripe_payment_intent = $9, stripe_charge_id = $10, card_brand = $11, card_last4 = $12,
           card_wallet = $13, payment_method_type = $14, receipt_url = $15
         WHERE id = $16`,
        [
          a.montyOrderId,
          a.iccid,
          a.qrCodeUrl,
          a.activationCode,
          a.smdpAddress,
          a.matchingId,
          a.activationOtp,
          a.bundleExpiry,
          payment?.paymentIntentId ?? null,
          payment?.chargeId ?? null,
          payment?.cardBrand ?? null,
          payment?.cardLast4 ?? null,
          payment?.cardWallet ?? null,
          payment?.methodType ?? null,
          payment?.receiptUrl ?? null,
          row.id,
        ]
      );

      await recordAffiliateForRow(row);
    } catch (assignError: unknown) {
      const errorMsg = assignError instanceof Error ? assignError.message : "Assignment failed";
      await pool.query(
        `UPDATE orders SET status = 'failed', stripe_payment_intent = $1, stripe_charge_id = $2,
           card_brand = $3, card_last4 = $4, card_wallet = $5, payment_method_type = $6, receipt_url = $7
         WHERE id = $8`,
        [
          payment?.paymentIntentId ?? null,
          payment?.chargeId ?? null,
          payment?.cardBrand ?? null,
          payment?.cardLast4 ?? null,
          payment?.cardWallet ?? null,
          payment?.methodType ?? null,
          payment?.receiptUrl ?? null,
          row.id,
        ]
      );
      console.error(`Fulfilment failed for order ${row.order_reference}: ${errorMsg}`);
    }
  }

  // Auto-refund any failed items that haven't been refunded yet.
  if (pending.length > 0) {
    await refundFailedItems(stripeSessionId, payment);
  }

  await finalizeSessionSideEffects("stripe_session_id", stripeSessionId, rows[0].user_id, pending.length > 0);

  const final = await pool.query(`SELECT * FROM orders WHERE stripe_session_id = $1 ORDER BY id ASC`, [stripeSessionId]);
  return final.rows;
}

/**
 * Refunds (full or partial) the value of any failed items in a Stripe session
 * that haven't been refunded yet, then marks them refunded / refund_failed.
 */
async function refundFailedItems(stripeSessionId: string, payment?: StripePaymentDetails) {
  if (!payment?.paymentIntentId) return;

  const res = await pool.query(`SELECT id, price, status, refund_id FROM orders WHERE stripe_session_id = $1`, [stripeSessionId]);
  const rows = res.rows as { id: number; price: string; status: string; refund_id: string | null }[];

  const failedUnrefunded = rows.filter((r) => r.status === "failed" && !r.refund_id);
  if (failedUnrefunded.length === 0) return;

  const totalUsd = round(rows.reduce((sum, r) => sum + Number(r.price), 0));
  const failedUsd = round(failedUnrefunded.reduce((sum, r) => sum + Number(r.price), 0));

  try {
    let refund;
    if (failedUsd >= totalUsd || payment.chargeTotalMinor == null || totalUsd <= 0) {
      // Everything failed (or we can't compute a proportion) → full refund.
      refund = await stripe.refunds.create({ payment_intent: payment.paymentIntentId });
    } else {
      const amount = Math.round(payment.chargeTotalMinor * (failedUsd / totalUsd));
      refund = await stripe.refunds.create({ payment_intent: payment.paymentIntentId, amount });
    }

    await pool.query(
      `UPDATE orders SET status = 'refunded', refund_id = $1, refund_status = 'succeeded'
       WHERE stripe_session_id = $2 AND status = 'failed' AND refund_id IS NULL`,
      [refund.id, stripeSessionId]
    );
  } catch (refundError: unknown) {
    const msg = refundError instanceof Error ? refundError.message : "Refund failed";
    console.error(`Refund failed for session ${stripeSessionId}: ${msg}`);
    await pool.query(
      `UPDATE orders SET status = 'refund_failed', refund_status = 'failed'
       WHERE stripe_session_id = $1 AND status = 'failed' AND refund_id IS NULL`,
      [stripeSessionId]
    );
  }
}

/**
 * Fulfils a set of orders paid for with wallet balance. The wallet has already
 * been debited by the caller for the full amount, so any items that fail to
 * provision are refunded straight back to the wallet. Idempotent — only acts on
 * rows still in `pending` for this wallet reference.
 */
export async function fulfillWalletSession(walletReference: string) {
  await ensureOrderPaymentColumns();

  const res = await pool.query(`SELECT * FROM orders WHERE wallet_reference = $1 ORDER BY id ASC`, [walletReference]);
  const rows = res.rows as OrderRow[];
  if (rows.length === 0) return [];

  const claim = await pool.query(
    `UPDATE orders SET status = 'processing' WHERE wallet_reference = $1 AND status = 'pending' RETURNING *`,
    [walletReference]
  );
  const pending = claim.rows as OrderRow[];

  for (const row of pending) {
    try {
      const a = await performAssignment(row);
      await pool.query(
        `UPDATE orders SET monty_order_id = $1, iccid = $2, qr_code_url = $3, lpa_code = $4, smdp_address = $5,
           matching_id = $6, activation_otp = $7, bundle_expiry_date = $8, status = 'completed',
           payment_method_type = 'wallet'
         WHERE id = $9`,
        [a.montyOrderId, a.iccid, a.qrCodeUrl, a.activationCode, a.smdpAddress, a.matchingId, a.activationOtp, a.bundleExpiry, row.id]
      );

      await recordAffiliateForRow(row);
    } catch (assignError: unknown) {
      const errorMsg = assignError instanceof Error ? assignError.message : "Assignment failed";
      await pool.query(`UPDATE orders SET status = 'failed', payment_method_type = 'wallet' WHERE id = $1`, [row.id]);
      console.error(`Wallet fulfilment failed for order ${row.order_reference}: ${errorMsg}`);
    }
  }

  if (pending.length > 0) {
    await refundFailedItemsToWallet(walletReference, rows[0].user_id);
  }

  await finalizeSessionSideEffects("wallet_reference", walletReference, rows[0].user_id, pending.length > 0);

  const final = await pool.query(`SELECT * FROM orders WHERE wallet_reference = $1 ORDER BY id ASC`, [walletReference]);
  return final.rows;
}

/**
 * Credits the value of any failed wallet-paid items back to the customer's
 * wallet, then marks them refunded. No external gateway involved.
 */
async function refundFailedItemsToWallet(walletReference: string, userId: string) {
  const res = await pool.query(
    `SELECT id, price, status, refund_id, display_currency, display_rate FROM orders WHERE wallet_reference = $1`,
    [walletReference]
  );
  const rows = res.rows as {
    id: number;
    price: string;
    status: string;
    refund_id: string | null;
    display_currency: string | null;
    display_rate: string | null;
  }[];

  const failedUnrefunded = rows.filter((r) => r.status === "failed" && !r.refund_id);
  if (failedUnrefunded.length === 0) return;

  const refundUsd = round(failedUnrefunded.reduce((sum, r) => sum + Number(r.price), 0));
  if (refundUsd <= 0) return;

  const displayCurrency = failedUnrefunded[0].display_currency;
  const displayRate = failedUnrefunded[0].display_rate != null ? Number(failedUnrefunded[0].display_rate) : null;
  const refundId = `WALLET-${Date.now().toString(36).toUpperCase()}`;

  try {
    await creditWallet({
      userId,
      amountUsd: refundUsd,
      reason: "refund",
      reference: walletReference,
      description: "Refund for eSIM that could not be activated",
      displayCurrency,
      displayAmount: displayRate != null ? round(refundUsd * displayRate) : null,
      displayRate,
    });

    await pool.query(
      `UPDATE orders SET status = 'refunded', refund_id = $1, refund_status = 'succeeded'
       WHERE wallet_reference = $2 AND status = 'failed' AND refund_id IS NULL`,
      [refundId, walletReference]
    );
  } catch (refundError: unknown) {
    const msg = refundError instanceof Error ? refundError.message : "Wallet refund failed";
    console.error(`Wallet refund failed for ${walletReference}: ${msg}`);
    await pool.query(
      `UPDATE orders SET status = 'refund_failed', refund_status = 'failed'
       WHERE wallet_reference = $1 AND status = 'failed' AND refund_id IS NULL`,
      [walletReference]
    );
  }
}

/**
 * Provisions the eSIMs for an admin-approved bank transfer. The customer paid
 * by manual bank transfer, so there is NO automatic refund — any item that
 * fails to provision is marked `failed` for the admin to retry or refund
 * manually. Claims rows still in `pending_verification` or `failed`, so this
 * doubles as the "retry failed items" action. Returns the final order rows.
 */
export async function fulfillBankTransferSession(bankTransferReference: string) {
  await ensureOrderPaymentColumns();

  const res = await pool.query(`SELECT * FROM orders WHERE bank_transfer_reference = $1 ORDER BY id ASC`, [
    bankTransferReference,
  ]);
  const rows = res.rows as OrderRow[];
  if (rows.length === 0) return [];

  const claim = await pool.query(
    `UPDATE orders SET status = 'processing'
     WHERE bank_transfer_reference = $1 AND status IN ('pending_verification', 'failed') RETURNING *`,
    [bankTransferReference]
  );
  const pending = claim.rows as OrderRow[];

  for (const row of pending) {
    try {
      const a = await performAssignment(row);
      await pool.query(
        `UPDATE orders SET monty_order_id = $1, iccid = $2, qr_code_url = $3, lpa_code = $4, smdp_address = $5,
           matching_id = $6, activation_otp = $7, bundle_expiry_date = $8, status = 'completed',
           payment_method_type = 'bank_transfer'
         WHERE id = $9`,
        [a.montyOrderId, a.iccid, a.qrCodeUrl, a.activationCode, a.smdpAddress, a.matchingId, a.activationOtp, a.bundleExpiry, row.id]
      );

      await recordAffiliateForRow(row);
    } catch (assignError: unknown) {
      const errorMsg = assignError instanceof Error ? assignError.message : "Assignment failed";
      await pool.query(`UPDATE orders SET status = 'failed', payment_method_type = 'bank_transfer' WHERE id = $1`, [row.id]);
      console.error(`Bank-transfer fulfilment failed for order ${row.order_reference}: ${errorMsg}`);
    }
  }

  await finalizeSessionSideEffects("bank_transfer_reference", bankTransferReference, rows[0].user_id, pending.length > 0);

  const final = await pool.query(`SELECT * FROM orders WHERE bank_transfer_reference = $1 ORDER BY id ASC`, [
    bankTransferReference,
  ]);
  return final.rows as OrderRow[];
}

/**
 * Marks an admin-rejected bank transfer's orders as `rejected`. No provisioning,
 * no refund (money handled manually / not received).
 */
export async function rejectBankTransferOrders(bankTransferReference: string) {
  await ensureOrderPaymentColumns();
  await pool.query(
    `UPDATE orders SET status = 'rejected'
     WHERE bank_transfer_reference = $1 AND status IN ('pending_verification', 'on_hold')`,
    [bankTransferReference]
  );
}

/** Puts an admin-held bank transfer's pending orders into `on_hold`. */
export async function holdBankTransferOrders(bankTransferReference: string) {
  await ensureOrderPaymentColumns();
  await pool.query(
    `UPDATE orders SET status = 'on_hold'
     WHERE bank_transfer_reference = $1 AND status IN ('pending_verification', 'rejected')`,
    [bankTransferReference]
  );
}

/**
 * Resolves a captured PayPal order: assigns each pending eSIM, marks each
 * completed/failed, auto-refunds failed items back to PayPal, clears the cart.
 * Idempotent — only acts on rows still in `pending`.
 */
export async function fulfillPaypalSession(paypalOrderId: string, payment: PaypalPaymentDetails) {
  await ensureOrderPaymentColumns();

  const res = await pool.query(`SELECT * FROM orders WHERE paypal_order_id = $1 ORDER BY id ASC`, [paypalOrderId]);
  const rows = res.rows as OrderRow[];
  if (rows.length === 0) return [];

  const claim = await pool.query(
    `UPDATE orders SET status = 'processing' WHERE paypal_order_id = $1 AND status = 'pending' RETURNING *`,
    [paypalOrderId]
  );
  const pending = claim.rows as OrderRow[];

  for (const row of pending) {
    try {
      const a = await performAssignment(row);
      await pool.query(
        `UPDATE orders SET monty_order_id = $1, iccid = $2, qr_code_url = $3, lpa_code = $4, smdp_address = $5,
           matching_id = $6, activation_otp = $7, bundle_expiry_date = $8, status = 'completed',
           paypal_capture_id = $9, payment_method_type = 'paypal'
         WHERE id = $10`,
        [
          a.montyOrderId,
          a.iccid,
          a.qrCodeUrl,
          a.activationCode,
          a.smdpAddress,
          a.matchingId,
          a.activationOtp,
          a.bundleExpiry,
          payment.captureId,
          row.id,
        ]
      );

      await recordAffiliateForRow(row);
    } catch (assignError: unknown) {
      const errorMsg = assignError instanceof Error ? assignError.message : "Assignment failed";
      await pool.query(
        `UPDATE orders SET status = 'failed', paypal_capture_id = $1, payment_method_type = 'paypal' WHERE id = $2`,
        [payment.captureId, row.id]
      );
      console.error(`PayPal fulfilment failed for order ${row.order_reference}: ${errorMsg}`);
    }
  }

  if (pending.length > 0) {
    await refundFailedPaypalItems(paypalOrderId, payment);
  }

  await finalizeSessionSideEffects("paypal_order_id", paypalOrderId, rows[0].user_id, pending.length > 0);

  const final = await pool.query(`SELECT * FROM orders WHERE paypal_order_id = $1 ORDER BY id ASC`, [paypalOrderId]);
  return final.rows as OrderRow[];
}

/** Refunds the value of failed PayPal-paid items back to the buyer's PayPal. */
async function refundFailedPaypalItems(paypalOrderId: string, payment: PaypalPaymentDetails) {
  if (!payment.captureId) return;

  const res = await pool.query(
    `SELECT id, price, status, refund_id, display_currency, display_rate FROM orders WHERE paypal_order_id = $1`,
    [paypalOrderId]
  );
  const rows = res.rows as {
    id: number;
    price: string;
    status: string;
    refund_id: string | null;
    display_currency: string | null;
    display_rate: string | null;
  }[];

  const failedUnrefunded = rows.filter((r) => r.status === "failed" && !r.refund_id);
  if (failedUnrefunded.length === 0) return;

  const totalUsd = round(rows.reduce((sum, r) => sum + Number(r.price), 0));
  const failedUsd = round(failedUnrefunded.reduce((sum, r) => sum + Number(r.price), 0));

  // Refund in the currency the customer was charged (display currency/rate).
  const currency = failedUnrefunded[0].display_currency || payment.capturedCurrency || "USD";
  const rate = failedUnrefunded[0].display_rate != null ? Number(failedUnrefunded[0].display_rate) : 1;

  try {
    let refund;
    if (failedUsd >= totalUsd) {
      // All items failed — full refund (no amount = full).
      refund = await refundPaypalCapture(payment.captureId);
    } else {
      const value = (Math.round(failedUsd * rate * 100) / 100).toFixed(2);
      refund = await refundPaypalCapture(payment.captureId, { value, currency });
    }
    await pool.query(
      `UPDATE orders SET status = 'refunded', refund_id = $1, refund_status = 'succeeded'
       WHERE paypal_order_id = $2 AND status = 'failed' AND refund_id IS NULL`,
      [refund.id, paypalOrderId]
    );
  } catch (refundError: unknown) {
    const msg = refundError instanceof Error ? refundError.message : "Refund failed";
    console.error(`PayPal refund failed for order ${paypalOrderId}: ${msg}`);
    await pool.query(
      `UPDATE orders SET status = 'refund_failed', refund_status = 'failed'
       WHERE paypal_order_id = $1 AND status = 'failed' AND refund_id IS NULL`,
      [paypalOrderId]
    );
  }
}

/**
 * Marks a session's still-pending orders as cancelled (expired / abandoned /
 * async payment failed). No money was captured, so nothing to refund. The cart
 * is left intact so the customer can retry.
 */
export async function cancelSession(stripeSessionId: string) {
  await ensureOrderPaymentColumns();
  await pool.query(`UPDATE orders SET status = 'cancelled' WHERE stripe_session_id = $1 AND status = 'pending'`, [stripeSessionId]);
}

/** Cancels a PayPal order's still-pending rows (buyer abandoned / not captured). */
export async function cancelPaypalSession(paypalOrderId: string) {
  await ensureOrderPaymentColumns();
  await pool.query(`UPDATE orders SET status = 'cancelled' WHERE paypal_order_id = $1 AND status = 'pending'`, [paypalOrderId]);
}
