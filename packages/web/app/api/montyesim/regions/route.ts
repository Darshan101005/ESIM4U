import { NextResponse } from "next/server";
import { fetchAvailableRegions } from "@/lib/montyesim";

export async function GET() {
  try {
    const data = await fetchAvailableRegions();
    return NextResponse.json({ regions: data.regions || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch regions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
