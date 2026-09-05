import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { getAffiliateStats, listPayouts, createPayout, updatePayoutStatus, deletePayout } from "@/lib/affiliate";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const affiliateId = Number(new URL(request.url).searchParams.get("affiliateId"));
  if (!affiliateId) return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
  try {
    const [stats, payouts] = await Promise.all([getAffiliateStats(affiliateId), listPayouts(affiliateId)]);
    return NextResponse.json({ stats, payouts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load payouts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const affiliateId = Number(body.affiliateId);
    const amount = Number(body.amount);
    const status = body.status === "completed" ? "completed" : "pending";
    if (!affiliateId || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "A valid affiliate and amount are required" }, { status: 400 });
    }
    const payout = await createPayout({
      affiliateId,
      amount,
      status,
      method: body.method ? String(body.method) : null,
      note: body.note ? String(body.note) : null,
    });
    return NextResponse.json({ payout }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record payout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const id = Number(body.id);
    const status = body.status === "completed" ? "completed" : "pending";
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await updatePayoutStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update payout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!getAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  try {
    await deletePayout(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete payout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
