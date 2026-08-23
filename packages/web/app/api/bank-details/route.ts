import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getBankDetails } from "@/lib/bank-transfer";

// Current beneficiary bank details for the checkout screen (logged-in users).
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const details = await getBankDetails();
    return NextResponse.json({ details });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load bank details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
