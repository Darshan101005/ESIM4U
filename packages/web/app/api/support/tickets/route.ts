import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveIncomingAttachments } from "@/lib/support-attachments";
import { createTicket, listTicketsForUser } from "@/lib/support";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return session.user as { id: string; email?: string; name?: string };
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tickets = await listTicketsForUser(user.id);
    return NextResponse.json({ tickets });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load tickets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const title = (body.title || "").toString().trim();
    const message = (body.body || body.message || "").toString().trim();
    if (!title) return NextResponse.json({ error: "Please add a title" }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Please describe your issue" }, { status: 400 });

    const attachments = await resolveIncomingAttachments(body.attachments);

    const ticket = await createTicket({
      userId: user.id,
      userEmail: user.email,
      customerName: user.name,
      title,
      subject: (body.subject || "").toString().trim() || null,
      category: (body.category || "").toString().trim() || null,
      department: (body.department || "").toString().trim() || null,
      body: message,
      attachments,
    });
    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
