# apps/web/Dockerfile
FROM node:20-alpine AS builder
RUN npm i -g bun
WORKDIR /repo
COPY . .
WORKDIR /repo/apps/web
RUN bun install --ci
RUN bun run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# App
COPY --from=builder /repo/apps/web/.next ./.next
COPY --from=builder /repo/apps/web/public ./public
COPY --from=builder /repo/apps/web/package.json ./package.json
COPY --from=builder /repo/apps/web/node_modules ./node_modules
# Drizzle migrations
COPY --from=builder /repo/drizzle ./drizzle
# Migrate then start
COPY apps/web/migrate.mjs ./migrate.mjs
EXPOSE 3000
CMD ["sh", "-c", "node migrate.mjs && node node_modules/next/dist/bin/next start -p 3000 -H 0.0.0.0"]
