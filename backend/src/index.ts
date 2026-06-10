import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import "./env";
import { env } from "./env";
import { auth } from "./auth";
import { sellersRouter } from "./routes/sellers";
import { phonesRouter } from "./routes/phones";
import { dashboardRouter } from "./routes/dashboard";
import { clientsRouter } from "./routes/clients";
import { activityRouter } from "./routes/activity";
import { bootstrapAdmin } from "./bootstrap";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS — same-origin in prod (backend serves the webapp). Only dev origins are allowed.
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  }),
);

app.use("*", logger());

// Attach session to context
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Better Auth catch-all
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check
app.get("/api/health", (c) => c.json({ data: { ok: true } }));

// API routes
app.route("/api/sellers", sellersRouter);
app.route("/api/phones", phonesRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/clients", clientsRouter);
app.route("/api/activity", activityRouter);

// Static webapp (Vite output is copied into ./public by the build step).
// SPA fallback: anything not matched above serves index.html.
const webappDir = env.WEBAPP_DIST_DIR || "./public";
app.use("/*", serveStatic({ root: webappDir }));
app.get("*", serveStatic({ path: `${webappDir}/index.html` }));

const port = Number(process.env.PORT) || 3000;

// Bootstrap the first admin on boot (fire-and-forget, errors logged).
bootstrapAdmin().catch((err) => console.error("[bootstrap] failed:", err));

export default {
  port,
  fetch: app.fetch,
};
