# apps/ws/Dockerfile
FROM oven/bun:1
WORKDIR /repo
COPY . .
WORKDIR /repo/apps/ws
RUN bun install --ci
EXPOSE 4001
CMD ["bun", "run", "start"]
