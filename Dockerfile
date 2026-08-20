FROM node:22-alpine AS client-builder
WORKDIR /app
RUN npm install -g pnpm@10.34.3
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:22-alpine AS server-builder
WORKDIR /app/server
RUN npm install -g pnpm@10.34.3
COPY server/package.json server/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY server/src ./src
COPY server/prisma ./prisma
COPY server/tsconfig.json ./
RUN pnpm prisma generate
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm@10.34.3
RUN apk add --no-cache wget

# Copy server runtime
COPY --from=server-builder /app/server/package.json ./package.json
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma

# Copy built client
COPY --from=client-builder /app/dist ./public

# Create data and uploads directories
RUN mkdir -p /app/data /app/uploads

# Default env
ENV NODE_ENV=production
ENV PORT=18300
ENV APP_HOST=0.0.0.0
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mail?schema=public
ENV REDIS_URL=redis://localhost:6379
ENV CLIENT_URL=http://localhost:18300

EXPOSE 18300

# Persistent data volumes
VOLUME ["/app/data", "/app/uploads"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --spider -q "http://localhost:${PORT:-18300}/api/health" || exit 1

CMD ["sh", "-c", "mkdir -p /app/data /app/uploads && ./node_modules/.bin/prisma migrate deploy && node dist/scripts/seed.js && node dist/index.js"]
