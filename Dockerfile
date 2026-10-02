# PARxCON Ops Production Multi-Stage Dockerfile
# Stage 1: Build Frontend and Server
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite frontend assets
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create persistent data folder
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
