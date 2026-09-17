import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";
import { env } from "./env";

const stripSlash = (u?: string) => u?.replace(/\/$/, "");

// Cookies "secure" seulement si on sert en HTTPS (sinon le navigateur les jette
// en HTTP → connexion qui "boucle" sur la page de login).
const isHttps = (stripSlash(env.BACKEND_URL) ?? "").startsWith("https://");

const trustedOrigins = Array.from(
  new Set(
    [
      "http://localhost:*",
      "http://127.0.0.1:*",
      stripSlash(env.BACKEND_URL),
    ].filter((v): v is string => Boolean(v)),
  ),
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: stripSlash(env.BACKEND_URL),
  trustedOrigins,

  // Email + password is the only login method. We keep sign-up technically
  // enabled at the API level so the server can create users programmatically
  // (bootstrap admin + the admin plugin's createUser). The webapp doesn't
  // expose any sign-up UI, so this is invisible to end users.
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },

  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],

  advanced: {
    trustedProxyHeaders: true,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isHttps,
    },
  },
});

export type Auth = typeof auth;
