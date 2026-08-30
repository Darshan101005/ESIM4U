import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveIncomingAttachments } from "@/lib/support-attachments";
import { getTicket, replyTicket, markTicketRead } from "@/lib/support";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return session.user as { id: string; email?: string; name?: string };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const data = await getTicket(id, user.id);
    if (!data) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    await markTicketRead(data.ticket.id, "user");
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const data = await getTicket(id, user.id);
    if (!data) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const attachments = await resolveIncomingAttachments(body.attachments);

    await replyTicket({
      ticketId: data.ticket.id,
      sender: "user",
      senderName: user.name || "Customer",
      body: (body.body || "").toString(),
      attachments,
    });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "EMPTY_MESSAGE") {
      return NextResponse.json({ error: "Message is empty" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
