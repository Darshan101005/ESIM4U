import { NextRequest, NextResponse } from "next/server";
import { fetchConsumption } from "@/lib/montyesim";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const orderReference = searchParams.get("order_reference") || undefined;

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const data = await fetchConsumption(orderId, orderReference);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch consumption";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
