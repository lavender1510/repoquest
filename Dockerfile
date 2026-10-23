FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY src/server/db/schema.prisma ./src/server/db/schema.prisma
RUN npm install --no-audit --no-fund
COPY . .
ENV DATABASE_URL="file:./build.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/repoquest.db"
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/server/db/schema.prisma ./src/server/db/schema.prisma
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p /app/data
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["sh", "-c", "./node_modules/.bin/prisma db push --schema src/server/db/schema.prisma && node server.js"]
