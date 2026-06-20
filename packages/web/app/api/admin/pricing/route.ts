import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { loadPricingRules, upsertPricingRule, deletePricingRule, ScopeType, MarkupType } from "@/lib/pricing";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

const VALID_SCOPES: ScopeType[] = ["bundle", "country", "region", "global"];
const VALID_MARKUPS: MarkupType[] = ["percent", "fixed"];

export async function GET(request: NextRequest) {
  try {
    if (!getAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await loadPricingRules();
    return NextResponse.json({ rules });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!getAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { scope_type, scope_code, markup_type, markup_value } = body;

    if (!VALID_SCOPES.includes(scope_type)) {
      return NextResponse.json({ error: "Invalid scope_type" }, { status: 400 });
    }
    if (!VALID_MARKUPS.includes(markup_type)) {
      return NextResponse.json({ error: "Invalid markup_type" }, { status: 400 });
    }
    if (scope_type !== "global" && !scope_code) {
      return NextResponse.json({ error: "scope_code is required" }, { status: 400 });
    }

    const value = Number(markup_value);
    if (Number.isNaN(value) || value < 0) {
      return NextResponse.json({ error: "Invalid markup_value" }, { status: 400 });
    }

    const rule = await upsertPricingRule(scope_type, scope_code || "", markup_type, value);
    return NextResponse.json({ rule });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!getAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scopeType = searchParams.get("scope_type") as ScopeType | null;
    const scopeCode = searchParams.get("scope_code") || "";

    if (!scopeType || !VALID_SCOPES.includes(scopeType) || scopeType === "global") {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }

    await deletePricingRule(scopeType, scopeCode);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
