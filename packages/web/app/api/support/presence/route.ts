import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isSupportOnline } from "@/lib/support";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const online = await isSupportOnline();
    return NextResponse.json({ online });
  } catch {
    return NextResponse.json({ online: false });
  }
}
