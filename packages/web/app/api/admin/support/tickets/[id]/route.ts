import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { resolveIncomingAttachments } from "@/lib/support-attachments";
import { getTicket, replyTicket, setTicketStatus, markTicketRead } from "@/lib/support";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const data = await getTicket(id);
    if (!data) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    await markTicketRead(data.ticket.id, "admin");
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const data = await getTicket(id);
    if (!data) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const attachments = await resolveIncomingAttachments(body.attachments);

    await replyTicket({
      ticketId: data.ticket.id,
      sender: "admin",
      senderName: admin.name || "Support",
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const data = await getTicket(id);
    if (!data) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const status = (body.status || "").toString();
    const allowed = ["open", "answered", "resolved", "closed"];
    if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    await setTicketStatus(data.ticket.id, status);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
