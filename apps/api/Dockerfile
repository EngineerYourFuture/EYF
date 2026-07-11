# syntax=docker/dockerfile:1
# Multi-stage build for the EYF API (Fastify) and its workers. The final image
# is a pruned, production-only deploy of @eyf/api. Reused for the api server and
# every worker — the process is chosen by the CMD (see docker-compose.prod.yml).
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

# ---- deps: install the whole workspace against the frozen lockfile ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/config/package.json packages/config/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- build: generate Prisma client + compile TS ----
FROM deps AS build
COPY . .
RUN pnpm --filter @eyf/db prisma:generate \
 && pnpm --filter @eyf/api build

# ---- deploy: create a self-contained, prod-only bundle ----
FROM build AS prune
RUN pnpm --filter @eyf/api deploy --prod /out

# ---- runtime ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN addgroup -S eyf && adduser -S eyf -G eyf
WORKDIR /app
COPY --from=prune --chown=eyf:eyf /out .
USER eyf
EXPOSE 4000
# Liveness is /livez; orchestrator readiness should probe /readyz.
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/livez').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
