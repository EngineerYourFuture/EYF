FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci && npm --prefix frontend ci

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY frontend ./frontend

RUN npx prisma generate && npm run build && npm run frontend:build

FROM node:22-alpine AS runtime
WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=10000
ENV SERVE_FRONTEND=false
EXPOSE 10000

CMD ["node", "dist/index.js"]
