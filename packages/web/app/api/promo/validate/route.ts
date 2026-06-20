import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { validatePromoCode } from "@/lib/promo";
import { validateAffiliateCode } from "@/lib/affiliate";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const code = (body.code || "").trim();
    const subtotal = Number(body.subtotal);

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }
    if (Number.isNaN(subtotal) || subtotal <= 0) {
      return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 });
    }

    const promo = await validatePromoCode(code, subtotal);
    if (promo.valid) {
      return NextResponse.json({
        type: "promo",
        code: promo.code,
        discountAmount: promo.discountAmount,
      });
    }

    const affiliate = await validateAffiliateCode(code, subtotal);
    if (affiliate.valid) {
      return NextResponse.json({
        type: "affiliate",
        code: affiliate.code,
        discountAmount: affiliate.discountAmount,
      });
    }

    return NextResponse.json({ error: promo.reason || "Invalid code" }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to validate code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
