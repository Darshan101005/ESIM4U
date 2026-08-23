import { Resend } from "resend";
import {
  getOTPEmailTemplate,
  getVerificationSuccessTemplate,
} from "@/lib/email-templates";

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
