import { Resend } from "resend";
import {
  getOTPEmailTemplate,
  getVerificationSuccessTemplate,
  getOrderReadyTemplate,
} from "@/lib/email-templates";
import { CURRENCY_SYMBOLS } from "@/lib/fx";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "eSIM4U <no-reply@esim4u.uk>";
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@esim4u.uk";

export async function sendOTPEmail(
  email: string,
  otp: string,
  name: string
) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    to: [email],
    subject: "Verify your email - eSIM4U",
    html: getOTPEmailTemplate(otp, name),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("SEND_FAILED");
  }
}

export async function sendVerificationSuccessEmail(
  email: string,
  name: string,
  dateTime?: string,
  deviceName?: string
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    to: [email],
    subject: "Login Successful - eSIM4U",
    html: getVerificationSuccessTemplate(name, dateTime, deviceName),
  });
}

export interface OrderReadyEmailParams {
  email: string;
  name: string;
  orderReference: string;
  planName: string;
  country?: string;
  dataAmount?: string;
  validity?: string;
  amountUsd: number;
  displayCurrency?: string | null;
  displayRate?: string | number | null;
  smdpAddress?: string | null;
  activationCode?: string | null;
  iccid?: string | null;
  /** Data-URI QR (data:image/png;base64,...) from the completed order. */
  qrDataUrl?: string | null;
  isTopup?: boolean;
}

/** Turns the stored data-URI QR into a Resend attachment (downloadable + inline). */
function qrAttachment(qrDataUrl?: string | null) {
  if (!qrDataUrl) return null;
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(qrDataUrl);
  if (!match) return null;
  return {
    filename: "esim4u-qr.png",
    content: match[3],
    contentType: match[1],
    inlineContentId: "esim-qr",
  };
}

function formatMoney(amountUsd: number, currency?: string | null, rate?: string | number | null): string {
  const cur = (currency || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[cur as keyof typeof CURRENCY_SYMBOLS] ?? "";
  const r = rate != null ? Number(rate) : 1;
  const value = amountUsd * (Number.isFinite(r) && r > 0 ? r : 1);
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * Sends our own branded "eSIM ready" (or "recharged") email with the order
 * details, invoice, activation info, and the QR attached as a PNG. This is the
 * only order email the customer receives — MontyeSIM's is suppressed.
 */
export async function sendOrderReadyEmail(params: OrderReadyEmailParams) {
  const isTopup = Boolean(params.isTopup);
  const attachment = isTopup ? null : qrAttachment(params.qrDataUrl);
  const amountText = formatMoney(params.amountUsd, params.displayCurrency, params.displayRate);

  const html = getOrderReadyTemplate({
    name: params.name,
    orderReference: params.orderReference,
    planName: params.planName,
    country: params.country,
    dataAmount: params.dataAmount,
    validity: params.validity,
    amountText,
    smdpAddress: params.smdpAddress,
    activationCode: params.activationCode,
    iccid: params.iccid,
    isTopup,
    hasQr: Boolean(attachment),
  });

  await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    to: [params.email],
    subject: isTopup ? "Your eSIM has been recharged - eSIM4U" : "Your eSIM is ready - eSIM4U",
    html,
    ...(attachment
      ? {
          attachments: [
            {
              filename: attachment.filename,
              content: attachment.content,
              contentType: attachment.contentType,
              inlineContentId: attachment.inlineContentId,
            },
          ],
        }
      : {}),
  });
}

export interface ContactMessageParams {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  ref: string;
}

/**
 * Sends a guest/contact-form submission to the support inbox. The customer's
 * own email is set as replyTo so the team can reply to them directly from the
 * received email.
 */
export async function sendContactEmail(params: ContactMessageParams) {
  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const subject = params.subject?.trim() || "General enquiry";
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#1A1D20;line-height:1.6">
      <h2 style="color:#FF561E;margin:0 0 12px">New contact message</h2>
      <p style="margin:0 0 4px"><strong>Reference:</strong> ${safe(params.ref)}</p>
      <p style="margin:0 0 4px"><strong>Name:</strong> ${safe(params.name)}</p>
      <p style="margin:0 0 4px"><strong>Email:</strong> ${safe(params.email)}</p>
      <p style="margin:0 0 12px"><strong>Subject:</strong> ${safe(subject)}</p>
      <div style="padding:14px 16px;background:#FFF4F0;border:1px solid #ffd9c9;border-radius:12px;white-space:pre-wrap">${safe(params.message)}</div>
      <p style="margin:16px 0 0;color:#6B7280;font-size:12px">Reply directly to this email to respond to ${safe(params.name)}.</p>
    </div>`;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: params.email,
    to: [EMAIL_REPLY_TO],
    subject: `[Contact] ${subject} — ${params.name}`,
    html,
  });

  if (error) {
    console.error("Resend contact error:", error);
    throw new Error("SEND_FAILED");
  }
}

/**
 * Sends a password-reset verification code. Reuses the OTP look but with
 * reset-specific copy.
 */
export async function sendPasswordResetOTP(email: string, otp: string, name: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1A1D20">
      <div style="text-align:center;padding:24px 0">
        <h1 style="color:#FF561E;margin:0;font-size:22px">eSIM4U</h1>
      </div>
      <div style="background:#fff;border:1px solid #eee;border-radius:16px;padding:28px">
        <h2 style="font-size:18px;margin:0 0 8px">Reset your password</h2>
        <p style="font-size:14px;color:#6B7280;margin:0 0 20px">Hi ${name || "there"}, use this code to reset your eSIM4U password. It expires in 5 minutes.</p>
        <div style="text-align:center;margin:24px 0">
          <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1A1D20;background:#FFF4F0;border:1px solid #ffd9c9;border-radius:12px;padding:16px 24px">${otp}</span>
        </div>
        <p style="font-size:13px;color:#9CA3AF;margin:0">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      </div>
    </div>`;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    to: [email],
    subject: "Your password reset code - eSIM4U",
    html,
  });

  if (error) {
    console.error("Resend reset error:", error);
    throw new Error("SEND_FAILED");
  }
}
