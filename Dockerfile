# MaoreTech — single-image deploy (Hono backend serves the Vite webapp).
FROM oven/bun:1.1-alpine AS base
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
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Required for Prisma engines on alpine
RUN apk add --no-cache openssl libc6-compat

COPY --from=build /app/backend ./backend
COPY package.json ./

# Push the schema then start the server.
# Volume is expected to be mounted at /data for SQLite persistence.
CMD ["sh", "-c", "cd backend && bun run prisma:push && bun run start"]

EXPOSE 3000
