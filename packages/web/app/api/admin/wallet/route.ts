import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { getResellerWallet } from "@/lib/montyesim";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  try {
    if (!getAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await getResellerWallet();
    return NextResponse.json({
      balance: wallet.balance ?? 0,
      currency: wallet.currency_code || "USD",
      reseller_name: wallet.reseller_name || "",
      reseller_category: wallet.reseller_category || "",
      credit_limit: wallet.credit_limit ?? 0,
      is_active: wallet.is_active ?? false,
      date_created: wallet.date_created || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch wallet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
