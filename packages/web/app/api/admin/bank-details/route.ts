import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { getBankDetails, updateBankDetails } from "@/lib/bank-transfer";
import { BankDetails } from "@/lib/bank-details";

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const details = await getBankDetails();
    return NextResponse.json({ details });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load bank details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

    const details: BankDetails = {
      accountName: clean(body.accountName),
      bankName: clean(body.bankName),
      accountHolder: clean(body.accountHolder),
      accountNumber: clean(body.accountNumber),
      sortCode: clean(body.sortCode),
      swift: clean(body.swift),
      iban: clean(body.iban),
    };

    // Required fields — SWIFT/IBAN may be blank (IBAN often supplied later).
    if (!details.accountName || !details.bankName || !details.accountHolder || !details.accountNumber || !details.sortCode) {
      return NextResponse.json({ error: "Account name, bank, holder, account number and sort code are required" }, { status: 400 });
    }

    await updateBankDetails(details);
    return NextResponse.json({ details });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update bank details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
