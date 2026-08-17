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
COPY --from=server-builder /app/server/package.json ./package.json
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=client-builder /app/dist ./public
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 CMD wget --spider -q "http://localhost:${PORT:-8080}/api/health" || exit 1
CMD ["node", "dist/index.js"]