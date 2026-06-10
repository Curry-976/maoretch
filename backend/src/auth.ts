import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";
import { env } from "./env";

const isProd = process.env.NODE_ENV === "production";

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

  // Email + password is the only login method. Public sign-up is disabled —
  // only an authenticated admin can create new users.
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
    disableSignUp: true,
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
      secure: isProd,
    },
  },
});

export type Auth = typeof auth;
