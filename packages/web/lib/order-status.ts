/**
 * Pure, client-safe helpers describing an order's status. No server imports, so
 * both the customer and admin UIs can use them for accurate, consistent display.
 */

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "refund_failed"
  | "cancelled"
  | "pending_verification"
  | "on_hold"
  | "rejected";

/** Statuses where money has actually been taken from the customer. */
const PAID_STATUSES = new Set(["completed", "processing", "refunded", "refund_failed"]);

/** Statuses where the customer is expected to still pay (manual bank transfer). */
const DUE_STATUSES = new Set(["pending_verification", "on_hold"]);

/** Statuses the customer can retry / buy again from. */
const RETRYABLE_STATUSES = new Set(["pending", "failed", "cancelled", "rejected", "refunded", "refund_failed"]);

export function isPaidStatus(status: string): boolean {
  return PAID_STATUSES.has(status);
}

export function isRetryable(status: string): boolean {
  return RETRYABLE_STATUSES.has(status);
}

/** The label for the money figure on an order, honest to its state. */
export function amountLabel(status: string): string {
  if (status === "refunded") return "Amount Refunded";
  if (isPaidStatus(status)) return "Amount Paid";
  if (DUE_STATUSES.has(status)) return "Amount Due";
  return "Order Total";
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending Payment",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    refunded: "Refunded",
    refund_failed: "Refund Failed",
    cancelled: "Cancelled",
    pending_verification: "Pending Verification",
    on_hold: "On Hold",
    rejected: "Rejected",
  };
  return map[status] || status;
}

export function statusPillClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-600";
    case "processing":
      return "bg-blue-50 text-blue-600";
    case "pending":
    case "pending_verification":
      return "bg-amber-50 text-amber-600";
    case "refunded":
      return "bg-blue-50 text-blue-600";
    case "on_hold":
    case "cancelled":
      return "bg-gray-100 text-[#6B7280]";
    case "failed":
    case "refund_failed":
    case "rejected":
      return "bg-red-50 text-red-500";
    default:
      return "bg-gray-100 text-[#6B7280]";
  }
}
