# MaoreTech — single-image deploy (Hono backend serves the Vite webapp).
# Debian (glibc) base: Prisma's query engine panics under Alpine/musl,
# so we stay on the standard oven/bun image.
FROM oven/bun:1.1 AS base
WORKDIR /app

# ---------- Install all deps ----------
FROM base AS deps
COPY backend/package.json backend/bun.lock ./backend/
COPY webapp/package.json webapp/bun.lock ./webapp/
RUN cd backend && bun install --frozen-lockfile || bun install
RUN cd webapp && bun install --frozen-lockfile || bun install

# ---------- Build webapp ----------
FROM deps AS build
COPY backend ./backend
COPY webapp ./webapp
COPY package.json ./
RUN cd webapp && bun run build
RUN rm -rf backend/public && mv webapp/dist backend/public
RUN cd backend && bun run prisma:generate

# ---------- Runtime ----------
FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production
# OpenSSL is needed by the Prisma engines.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/backend ./backend
COPY package.json ./

# Push the schema then start the server.
# Volume is expected to be mounted at /data for SQLite persistence.
CMD ["sh", "-c", "cd backend && bun run prisma:push && bun run start"]

EXPOSE 3000
