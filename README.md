# Advent (Well Being Quest)

Monorepo for the Advent wellness quest: a React SPA and a NestJS HTTP API.

```
frontend/   React + Vite client     http://localhost:3000
backend/    NestJS + PostgreSQL     http://localhost:3001
```

Package details: [frontend/README.md](frontend/README.md), [backend/README.md](backend/README.md). Architecture: [frontend/docs/ARCHITECTURE.md](frontend/docs/ARCHITECTURE.md).

## Prerequisites

- Node.js LTS
- PostgreSQL with an empty database named `advent` (needed for API-backed quests)

## Run locally (frontend + backend)

Use two terminals from the repository root.

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` if your Postgres credentials differ from the defaults (`postgres` / `postgres`, database `advent`). For a local demo without Identity Server, add:

```bash
AUTH_DISABLED=true
```

`CORS_ORIGIN=http://localhost:3000` is already set in `.env.example`.

Then:

```bash
npm install
npm run migration:run
npm run start:dev
```

API: [http://localhost:3001](http://localhost:3001)  
Swagger: [http://localhost:3001/docs](http://localhost:3001/docs)  
Health: [http://localhost:3001/health](http://localhost:3001/health)

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

`.env.example` sets `VITE_DEV_MODE=true` and `VITE_API_BASE_URL=http://localhost:3001`.

App: [http://localhost:3000/quest](http://localhost:3000/quest)

- Auto-login as `dev@leobit.com` (privileged)
- Mock progress from `frontend/public/mock-quest-data.csv`
- Quest CRUD and media require the backend from step 1

Restart `npm run dev` after any env change.

### Ports

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:3000 |
| Backend (Nest) | http://localhost:3001 |

## Local demo without Identity Server

Backend `backend/.env`:

```bash
AUTH_DISABLED=true
CORS_ORIGIN=http://localhost:3000
```

Frontend `frontend/.env.local`:

```bash
VITE_DEV_MODE=true
VITE_API_BASE_URL=http://localhost:3001
```

`AUTH_DISABLED` is ignored when `NODE_ENV=production`. Do not use it in production.

## OIDC (production-like)

Frontend `frontend/.env.local`:

```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://your-oidc-authority.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3001
```

Backend `backend/.env`: leave `AUTH_DISABLED` unset and point `AUTH_ISSUER` at the same authority.

## Scripts

From `frontend/`:

```bash
npm run dev      # Vite, http://localhost:3000
npm run build
npm run preview
npm test
npm run lint
```

From `backend/`:

```bash
npm run start:dev
npm run build
npm run start:prod
npm test
npm run lint
npm run migration:run
npm run db:reset-quests
```

## Environment files

| Path | Purpose |
|------|---------|
| `frontend/.env.example` | Copy to `frontend/.env.local` |
| `backend/.env.example` | Copy to `backend/.env` |

Do not commit `.env` or `.env.local`.
