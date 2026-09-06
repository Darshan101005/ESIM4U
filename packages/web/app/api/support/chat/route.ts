import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveIncomingAttachments } from "@/lib/support-attachments";
import {
  listChatMessages,
  sendChatMessage,
  markChatRead,
  getConversation,
  reopenConversation,
  isSupportOnline,
  pruneOldChatsIfDue,
  deleteChatMessage,
} from "@/lib/support";
import { notifyAdminsOfCustomerMessage } from "@/lib/telegram";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return session.user as { id: string; email?: string; name?: string };
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await pruneOldChatsIfDue();
    const [messages, conversation, online] = await Promise.all([
      listChatMessages(user.id, "user"),
      getConversation(user.id),
      isSupportOnline(),
    ]);
    // Viewing the thread marks the admin's messages as read.
    await markChatRead(user.id, "user");

    return NextResponse.json({ messages, conversation, online });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const attachments = await resolveIncomingAttachments(body.attachments);
    const text = typeof body.body === "string" ? body.body : "";
    const replyToId = Number.isInteger(body.reply_to_id) ? body.reply_to_id : null;

    const message = await sendChatMessage({
      userId: user.id,
      sender: "user",
      senderName: user.name || "Customer",
      body: text,
      attachments,
      replyToId,
      userEmail: user.email,
      customerName: user.name,
    });
    // Notify admins in Telegram (live if watching, otherwise a ping with count).
    void notifyAdminsOfCustomerMessage(user.id, user.name || "Customer", text);
    return NextResponse.json({ message });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "EMPTY_MESSAGE") {
      return NextResponse.json({ error: "Message is empty" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    // Customers may only reopen a chat — resolving is an admin-only action.
    if (body.action === "reopen") {
      await reopenConversation(user.id);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const messageId = Number(body.messageId);
    const scope = body.scope === "everyone" ? "everyone" : "me";
    if (!Number.isInteger(messageId)) return NextResponse.json({ error: "Missing message" }, { status: 400 });

    await deleteChatMessage({ userId: user.id, messageId, scope, side: "user" });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOT_OWN_MESSAGE") {
      return NextResponse.json({ error: "You can only delete your own messages for everyone" }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
