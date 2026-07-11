# syntax=docker/dockerfile:1
# Multi-stage build for the EYF web app (Next.js standalone output).
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/config/package.json packages/config/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# NEXT_PUBLIC_* are build-time inlined — pass them as build args at image build.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
RUN pnpm --filter @eyf/web build

# ---- runtime: copy only the standalone server + static assets ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN addgroup -S eyf && adduser -S eyf -G eyf
WORKDIR /app
COPY --from=build --chown=eyf:eyf /repo/apps/web/.next/standalone ./
COPY --from=build --chown=eyf:eyf /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=eyf:eyf /repo/apps/web/public ./apps/web/public
USER eyf
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
