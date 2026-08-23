import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import pool from "@/lib/db";
import {
  getBankTransfers,
  getBankTransferById,
  setBankTransferStatus,
  BankTransferStatus,
} from "@/lib/bank-transfer";
import { fulfillBankTransferSession, rejectBankTransferOrders, holdBankTransferOrders } from "@/lib/fulfillment";

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// List bank-transfer submissions (optionally filtered by status), each with its
// linked order rows so the admin can see exactly what will be provisioned.
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const status = request.nextUrl.searchParams.get("status") as BankTransferStatus | "all" | null;
    const transfers = await getBankTransfers(status || "all");

    const refs = transfers.map((t) => t.reference);
    let ordersByRef: Record<string, unknown[]> = {};
    if (refs.length > 0) {
      const ordersRes = await pool.query(
        `SELECT id, order_reference, bundle_name, country, country_code, data_amount, validity, price, status, bank_transfer_reference
         FROM orders WHERE bank_transfer_reference = ANY($1) ORDER BY id ASC`,
        [refs]
      );
      ordersByRef = ordersRes.rows.reduce((acc: Record<string, unknown[]>, row: { bank_transfer_reference: string }) => {
        (acc[row.bank_transfer_reference] ||= []).push(row);
        return acc;
      }, {});
    }

    const result = transfers.map((t) => ({ ...t, orders: ordersByRef[t.reference] || [] }));
    return NextResponse.json({ transfers: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load bank transfers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Approve / reject / hold / retry a submission.
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = Number(body.id);
    const action = String(body.action || "");
    const adminNote = (body.note || "").trim() || null;
    const reviewedBy = admin.email || String(admin.id);

    if (!Number.isFinite(id)) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const transfer = await getBankTransferById(id);
    if (!transfer) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    switch (action) {
      case "approve":
      case "retry": {
        // Provision the eSIMs. No auto-refund — failures are marked for retry.
        const orders = await fulfillBankTransferSession(transfer.reference);
        const anyFailed = orders.some((o) => o.status === "failed");
        const allCompleted = orders.length > 0 && orders.every((o) => o.status === "completed");
        const finalStatus: BankTransferStatus = allCompleted ? "completed" : anyFailed ? "failed" : "processing";
        await setBankTransferStatus(id, finalStatus, reviewedBy, adminNote);
        return NextResponse.json({ status: finalStatus });
      }
      case "reject": {
        await rejectBankTransferOrders(transfer.reference);
        await setBankTransferStatus(id, "rejected", reviewedBy, adminNote);
        return NextResponse.json({ status: "rejected" });
      }
      case "on_hold": {
        await holdBankTransferOrders(transfer.reference);
        await setBankTransferStatus(id, "on_hold", reviewedBy, adminNote);
        return NextResponse.json({ status: "on_hold" });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update bank transfer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
