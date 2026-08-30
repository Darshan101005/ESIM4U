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
