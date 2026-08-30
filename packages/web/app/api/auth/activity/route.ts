import { NextRequest, NextResponse } from "next/server";
import { recordActivity, pruneActivityLogIfDue } from "@/lib/activity";

const VALID_EVENTS = ["signup", "login", "login_failed", "logout", "password_change"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, eventType, clientIpv4, clientIpv6 } = body;

    if (!eventType || !VALID_EVENTS.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }
    if (!userId && !email) {
      return NextResponse.json({ error: "userId or email is required" }, { status: 400 });
    }

    await recordActivity({ req: request, userId, email, eventType, clientIpv4, clientIpv6 });
    // Sliding-window cleanup runs opportunistically alongside logging.
    pruneActivityLogIfDue().catch(() => {});

    return NextResponse.json({ message: "Activity logged" });
  } catch {
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
