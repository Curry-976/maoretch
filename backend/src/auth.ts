import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { env } from "./env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const FROM = env.RESEND_FROM || "MaoreTech <onboarding@resend.dev>";

async function sendOtpEmail(email: string, otp: string) {
  if (!resend) {
    // Dev fallback when no key is set: print to server console.
    console.log(`\n  📧  [DEV] OTP pour ${email} → ${otp}\n`);
    return;
  }
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Votre code MaoreTech",
    html: `
<!doctype html>
<html lang="fr"><body style="margin:0;padding:0;background:#0b1220;font-family:'DM Sans',system-ui,sans-serif;color:#e8eaf0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#121a2a;border:1px solid #1f2a44;border-radius:20px;padding:32px">
        <tr><td>
          <div style="font-family:'Bebas Neue','Arial Narrow',sans-serif;letter-spacing:0.04em;font-size:28px;color:#f5b400;text-transform:uppercase">MaoreTech</div>
          <div style="height:1px;background:#1f2a44;margin:20px 0"></div>
          <p style="margin:0 0 8px 0;font-size:14px;color:#94a0bc">Votre code de connexion</p>
          <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:42px;letter-spacing:0.4em;font-weight:700;color:#fff;margin:10px 0 4px 0">${otp}</div>
          <p style="margin:16px 0 0 0;font-size:13px;color:#94a0bc">Ce code expire dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim(),
  });
  if (error) {
    console.error("[Resend]", error);
    throw new Error(error.message || "Échec de l'envoi de l'email");
  }
}

const isProd = process.env.NODE_ENV === "production";

// Railway sets RAILWAY_PUBLIC_DOMAIN automatically (e.g. "maoretch-production.up.railway.app").
// Trust it so we don't depend on BACKEND_URL being a perfect string match.
const railwayPublic = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : undefined;

const stripSlash = (u?: string) => u?.replace(/\/$/, "");

const trustedOrigins = Array.from(
  new Set(
    [
      "http://localhost:*",
      "http://127.0.0.1:*",
      "https://*.up.railway.app",
      stripSlash(env.BACKEND_URL),
      stripSlash(railwayPublic),
    ].filter((v): v is string => Boolean(v)),
  ),
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: stripSlash(env.BACKEND_URL),
  trustedOrigins,
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "sign-in") return;
        await sendOtpEmail(email, String(otp));
      },
    }),
  ],
  advanced: {
    trustedProxyHeaders: true,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProd,
    },
  },
});
