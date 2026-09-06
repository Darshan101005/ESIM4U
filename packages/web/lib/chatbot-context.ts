import pool from "@/lib/db";
import { getWalletBalanceUsd } from "@/lib/wallet";
import { getReferralBalanceUsd } from "@/lib/referral";
import { fetchConsumption } from "@/lib/montyesim";
import { toMb, formatData } from "@/lib/data-units";

/**
 * Builds a compact, safe summary of a logged-in customer's account to inject
 * into the assistant's system prompt. Only non-sensitive, useful facts (plans,
 * statuses, balances, usage) — never secrets. Best-effort: any part that fails
 * is simply omitted so the chat still works.
 */

interface EsimRow {
  id: number;
  bundle_name: string | null;
  country: string | null;
  data_amount: string | null;
  validity: string | null;
  status: string;
  monty_order_id: string | null;
  order_reference: string | null;
  bundle_expiry_date: string | null;
  created_at: string;
}

async function usageLine(e: EsimRow): Promise<string> {
  if (!e.monty_order_id) return "";
  try {
    const c = await fetchConsumption(e.monty_order_id, e.order_reference || undefined);
    if (!c) return "";
    if (c.unlimited) {
      const used = formatData(toMb(c.data_used, c.data_unit), "GB");
      return ` — usage: unlimited plan, ${used} used${c.plan_status ? `, ${c.plan_status}` : ""}`;
    }
    const remaining = formatData(toMb(c.data_remaining, c.data_unit), "GB");
    const total = formatData(toMb(c.data_allocated, c.data_unit), "GB");
    return ` — usage: ${remaining} left of ${total}${c.plan_status ? `, ${c.plan_status}` : ""}`;
  } catch {
    return "";
  }
}

export async function buildUserContext(
  userId: string,
  name?: string | null,
  email?: string | null
): Promise<string> {
  const lines: string[] = [];
  lines.push(`The user is LOGGED IN. Name: ${name || "(unknown)"}. Email: ${email || "(unknown)"}.`);

  // Balances (parallel, best-effort).
  const [wallet, referral] = await Promise.all([
    getWalletBalanceUsd(userId).catch(() => null),
    getReferralBalanceUsd(userId).catch(() => null),
  ]);
  if (wallet != null) lines.push(`Wallet balance: $${wallet.toFixed(2)}.`);
  if (referral != null) lines.push(`Referral credit: $${referral.toFixed(2)}.`);

  // eSIMs / orders.
  let rows: EsimRow[] = [];
  try {
    const r = await pool.query(
      `SELECT id, bundle_name, country, data_amount, validity, status, monty_order_id,
              order_reference, bundle_expiry_date, created_at
       FROM orders
       WHERE user_id = $1 AND deleted_scope IS DISTINCT FROM 'all'
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    rows = r.rows as EsimRow[];
  } catch {
    rows = [];
  }

  if (rows.length === 0) {
    lines.push(`The user has no eSIMs or orders yet.`);
    return lines.join("\n");
  }

  // Live usage for up to the 3 most recent completed eSIMs (parallel, guarded).
  const active = rows.filter((r) => r.status === "completed" && r.monty_order_id).slice(0, 3);
  const usageMap = new Map<number, string>();
  const results = await Promise.allSettled(active.map((e) => usageLine(e)));
  results.forEach((res, i) => {
    if (res.status === "fulfilled" && res.value) usageMap.set(active[i].id, res.value);
  });

  lines.push(`The user's eSIMs / recent orders (most recent first):`);
  for (const e of rows) {
    const parts = [
      e.bundle_name || e.country || "eSIM",
      e.data_amount ? `(${e.data_amount}${e.validity ? `, ${e.validity}` : ""})` : "",
      `status: ${e.status}`,
      e.order_reference ? `ref ${e.order_reference}` : "",
      e.bundle_expiry_date ? `expires ${new Date(e.bundle_expiry_date).toLocaleDateString("en-GB")}` : "",
    ].filter(Boolean);
    lines.push(`- ${parts.join(", ")}${usageMap.get(e.id) || ""}`);
  }

  return lines.join("\n");
}
