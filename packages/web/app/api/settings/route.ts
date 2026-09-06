import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

// Public, read-only settings used by the website (footer socials, contact info,
// feature toggles). No auth — only non-sensitive fields live in SiteSettings.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}
