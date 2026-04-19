FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci && npm --prefix frontend ci

COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
COPY frontend ./frontend

RUN npm run build && npm run frontend:build

FROM node:22-alpine AS runtime
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3000
ENV SERVE_FRONTEND=true
EXPOSE 3000

CMD ["node", "dist/index.js"]
