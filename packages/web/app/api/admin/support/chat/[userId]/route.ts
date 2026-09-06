import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import { resolveIncomingAttachments } from "@/lib/support-attachments";
import { sendSupportReplyToTelegram } from "@/lib/telegram";
import {
  listChatMessages,
  sendChatMessage,
  markChatRead,
  getConversation,
  resolveConversation,
  reopenConversation,
  deleteChatMessage,
  deleteConversation,
} from "@/lib/support";

function getAdmin(request: NextRequest) {
  const token = request.cookies.get(getAdminCookieName())?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId } = await params;

    const [messages, conversation] = await Promise.all([listChatMessages(userId, "admin"), getConversation(userId)]);
    await markChatRead(userId, "admin");
    return NextResponse.json({ messages, conversation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId } = await params;

    const body = await request.json().catch(() => ({}));
    const attachments = await resolveIncomingAttachments(body.attachments);
    const replyToId = Number.isInteger(body.reply_to_id) ? body.reply_to_id : null;

    const message = await sendChatMessage({
      userId,
      sender: "admin",
      senderName: admin.name || "Support",
      body: (body.body || "").toString(),
      attachments,
      replyToId,
    });
    // Mirror the reply to the customer's linked Telegram, if any (best-effort).
    void sendSupportReplyToTelegram(userId, (body.body || "").toString());
    return NextResponse.json({ message });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "EMPTY_MESSAGE") {
      return NextResponse.json({ error: "Message is empty" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId } = await params;

    const body = await request.json().catch(() => ({}));
    if (body.action === "resolve") {
      await resolveConversation(userId, admin.name || "Support");
    } else if (body.action === "reopen") {
      await reopenConversation(userId);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update chat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = getAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId } = await params;

    const body = await request.json().catch(() => ({}));
    // With a messageId => delete a single message; without => delete the whole chat.
    if (body.messageId != null) {
      const messageId = Number(body.messageId);
      const scope = body.scope === "everyone" ? "everyone" : "me";
      if (!Number.isInteger(messageId)) return NextResponse.json({ error: "Missing message" }, { status: 400 });
      await deleteChatMessage({ userId, messageId, scope, side: "admin" });
    } else {
      await deleteConversation(userId);
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOT_OWN_MESSAGE") {
      return NextResponse.json({ error: "You can only delete your own messages for everyone" }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
