import { Resend } from "resend";
import {
  getOTPEmailTemplate,
  getVerificationSuccessTemplate,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(
  email: string,
  otp: string,
  name: string
) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "eSIM4U <onboarding@resend.dev>",
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
  name: string
) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "eSIM4U <onboarding@resend.dev>",
    to: [email],
    subject: "Email verified successfully - eSIM4U",
    html: getVerificationSuccessTemplate(name),
  });
}
