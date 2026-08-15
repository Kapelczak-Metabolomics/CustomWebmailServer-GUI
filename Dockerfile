FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10.34.3

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist /app/dist

EXPOSE 3000

CMD ["serve", "/app/dist", "-l", "3000"]