import { NextResponse } from "next/server";
import { createAdminUser } from "@/lib/admin-auth";

export async function POST() {
  try {
    const admin = await createAdminUser(
      "darshanvenkatesan2005@gmail.com",
      "Dar.1010",
      "Darshan V",
      "super_admin"
    );

    return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
