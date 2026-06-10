import { Resend } from "resend";
import { env } from "../env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const FROM = env.RESEND_FROM || "Maore-Tech <onboarding@resend.dev>";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendMail({ to, subject, html, replyTo }: SendMailInput) {
  if (!resend) {
    // Dev fallback: print to server console.
    console.log(`\n📧 [DEV] Email to ${to}\n   Subject: ${subject}\n`);
    return { ok: true, dev: true };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    replyTo,
  });

  if (error) {
    console.error("[mail] Resend error:", error);
    throw new Error(error.message || "Échec de l'envoi de l'email");
  }
  return { ok: true, dev: false, id: data?.id };
}
