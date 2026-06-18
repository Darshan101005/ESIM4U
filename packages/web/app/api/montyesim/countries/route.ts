import { NextResponse } from "next/server";
import { fetchAvailableCountries } from "@/lib/montyesim";

export async function GET() {
  try {
    const data = await fetchAvailableCountries();
    return NextResponse.json({ countries: data.countries || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch countries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
