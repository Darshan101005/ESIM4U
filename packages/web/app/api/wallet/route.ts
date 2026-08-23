import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getWalletBalanceUsd, getWalletHistory } from "@/lib/wallet";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const [balanceUsd, history] = await Promise.all([getWalletBalanceUsd(userId), getWalletHistory(userId, 100)]);

    return NextResponse.json({ balanceUsd, history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load wallet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
