import { NextResponse } from "next/server";
import { getFxRates } from "@/lib/fx";

export async function GET() {
  try {
    const rates = await getFxRates();
    return NextResponse.json({
      base: rates.base,
      date: rates.date,
      rates: rates.rates,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch exchange rates";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
