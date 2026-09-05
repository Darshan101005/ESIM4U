import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureContactSchema } from "@/lib/contact-schema";
import { sendContactEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeRef() {
  return "CT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const subject = String(body.subject || "").trim().slice(0, 150);
    const message = String(body.message || "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Please enter a message (at least 10 characters)." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const ref = makeRef();

    await ensureContactSchema();
    await pool.query(
      `INSERT INTO contact_messages (ref, name, email, subject, message) VALUES ($1, $2, $3, $4, $5)`,
      [ref, name.slice(0, 120), email.slice(0, 200), subject || null, message]
    );

    // Email the team (their reply goes straight to the customer). Never fail the
    // request just because the email hiccups — the message is already stored.
    try {
      await sendContactEmail({ name, email, subject, message, ref });
    } catch (e) {
      console.error("Contact email failed (message still stored):", e);
    }

    return NextResponse.json({ ok: true, ref });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
