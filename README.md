# EYF Full-Stack Application

EYF is a full-stack TypeScript application with:
- **Backend API** (`Express`, `src/`)
- **Frontend SPA** (`React + Vite`, `frontend/`)

## Local development

1. Copy env templates:
   - `cp .env.example .env`
   - `cp frontend/.env.example frontend/.env`
2. Install dependencies:
   - `npm ci`
   - `npm --prefix frontend ci`
3. Run backend:
   - `npm run dev`
4. Run frontend:
   - `npm run frontend:dev`

## Build checks

- Backend typecheck: `npm run typecheck`
- Full build: `npm run build:all`
- CI-equivalent check: `npm run ci:check`

## Production container run

1. Copy production env:
   - `cp .env.production.example .env.production`
2. Fill strong secrets and production URLs in `.env.production`.
3. Build and start:
   - `docker compose up --build -d`
4. App endpoint:
   - `http://localhost:3000`

## Production runtime hardening

- Security headers via `helmet`
- CORS allow-list (`CORS_ALLOWED_ORIGINS`)
- Compression enabled
- Request logging (`morgan`) with request IDs
- Auth rate limiting on `/api/v1/auth/*`
- Health probes:
  - `/api/v1/live`
  - `/api/v1/ready`
  - `/api/v1/health`
- Graceful shutdown on `SIGINT` / `SIGTERM`
