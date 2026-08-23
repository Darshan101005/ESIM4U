import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { getFxRates, SupportedCurrency, SUPPORTED_CURRENCIES } from "@/lib/fx";
import { getWalletBalanceUsd, getWalletHistory, creditWallet, debitWallet, WalletError, WalletReason } from "@/lib/wallet";

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

// View a customer's wallet balance + history.
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    const [balanceUsd, history] = await Promise.all([getWalletBalanceUsd(userId), getWalletHistory(userId, 100)]);
    return NextResponse.json({ balanceUsd, history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load wallet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Credit (e.g. refund / goodwill) or debit a customer's wallet.
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const userId = (body.userId || "").trim();
    const amount = Number(body.amount);
    const rawCurrency = body.currency || "USD";
    const displayCurrency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(rawCurrency as SupportedCurrency)
      ? (rawCurrency as SupportedCurrency)
      : "USD";
    const direction = body.direction === "debit" ? "debit" : "credit";
    const note = (body.note || "").trim() || null;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
    }

    // Convert the admin-entered amount (in the chosen currency) to canonical USD.
    let displayRate = 1;
    try {
      const fx = await getFxRates();
      displayRate = fx.rates[displayCurrency] ?? 1;
    } catch {
      if (displayCurrency !== "USD") {
        return NextResponse.json({ error: "Currency rates are temporarily unavailable" }, { status: 503 });
      }
    }
    const amountUsd = round(amount / displayRate);

    const reason: WalletReason =
      body.reason === "refund" ? "refund" : direction === "debit" ? "admin_debit" : "admin_credit";

    const mutate = direction === "debit" ? debitWallet : creditWallet;
    const balanceUsd = await mutate({
      userId,
      amountUsd,
      reason,
      reference: null,
      description: note || (reason === "refund" ? "Refund to wallet" : direction === "debit" ? "Adjustment (debit)" : "Credit added by support"),
      displayCurrency,
      displayAmount: amount,
      displayRate,
      createdBy: admin.email || String(admin.id),
    });

    return NextResponse.json({ balanceUsd });
  } catch (error: unknown) {
    if (error instanceof WalletError && error.code === "INSUFFICIENT_FUNDS") {
      return NextResponse.json({ error: "Customer balance is too low for this debit" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update wallet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
