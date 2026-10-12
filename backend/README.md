# advent-backend

HTTP API for Advent (Well Being Quest), built with [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/), and PostgreSQL. Lives in `backend/` of this repository. Pair it with the React client in [`../frontend`](../frontend).

To run frontend and backend together, see the [repository README](../README.md).

## Quick start

1. PostgreSQL running locally, empty database `advent`.
2. From this directory (`backend/`), copy env, install, migrate, start:

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

3. Open [http://localhost:3001/docs](http://localhost:3001/docs) (Swagger) and [http://localhost:3001/health](http://localhost:3001/health).
4. Start the frontend from `frontend/` on [http://localhost:3000](http://localhost:3000) and open `/quest`.

Local demo without Identity Server: set `AUTH_DISABLED=true` in `.env` (ignored when `NODE_ENV=production`). Schema is applied with **migrations** (`npm run migration:run`). TypeORM `synchronize` stays **off** unless you set `DB_SYNCHRONIZE=true`.

## Stack

- Node.js (LTS), TypeScript
- NestJS 11
- TypeORM + PostgreSQL
- File uploads (media) to disk
- OpenAPI (Swagger UI)

## Configuration

Copy [`.env.example`](.env.example) to `.env`. Do not commit `.env`.

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP server port (default `3001`) |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default `5432`) |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `MEDIA_STORAGE_ROOT` | Path relative to `cwd` for stored files (default `uploads/media` if unset) |
| `MEDIA_PUBLIC_BASE_URL` | Base URL for public media links (no trailing `/`) |
| `APP_PUBLIC_URL` | Fallback if `MEDIA_PUBLIC_BASE_URL` is not set |
| `CORS_ORIGIN` | Allowed frontend origin (use `http://localhost:3000` with the Vite client) |
| `AUTH_ISSUER` | OIDC issuer URL (default `https://test.identity.leobit.co`) — JWKS + JWT signature |
| `AUTH_AUDIENCE` | Optional comma-separated JWT `aud` values. Leave empty to skip audience checks. |
| `AUTH_DISABLED` | `true` disables JWT checks locally; sets `createdBy` to `dev@local`. Blocked in production. |
| `AUTH_ROLE_CLAIM` | Comma-separated JWT claim keys for user role (default `role,Role,roles`) |
| `AUTH_PRIVILEGED_ROLES` | Roles that can manage quests **and media writes** (default `HR`) |
| `AUTH_HR_ROLE` | Deprecated alias for a single privileged role; use `AUTH_PRIVILEGED_ROLES` |
| `DB_SYNCHRONIZE` | `true` — TypeORM syncs schema from entities (local prototype only). Default **false**. Prefer migrations. |

Default API port **3001** matches the frontend fallback in `frontend/`. Vite runs on **3000**.

### Authentication

The API expects `Authorization: Bearer <access_token>` unless a route is marked `@Public()` or `AUTH_DISABLED=true`.

| Area | Reads | Writes (create / update / delete) |
|------|--------|-------------------------------------|
| `/quest` | JWT required. Non-privileged users may only read the **active** quest and its steps. | Privileged roles only (`@PrivilegedOnly()`, default `HR`) |
| `/media` | **Public** (`GET /media`, `GET /media/:id`, `GET /media/:id/file`) | Privileged roles only (`@PrivilegedOnly()`). `createdBy` is taken from the JWT. SVG files are downloaded as attachments (not inline). |

- `sub` from the token identifies the user; `createdBy` is set to `email`, then `name`, then `sub` on create.
- If a valid-looking token fails validation, decode it at [jwt.io](https://jwt.io) and set `AUTH_AUDIENCE` to the `aud` claim.
- Do not use `AUTH_DISABLED=true` in production (`NODE_ENV=production` blocks it).

### First-time database setup

Apply migrations (creates `media`, `quest`, `quest_step`):

```bash
npm run migration:run
```

Fallback without the CLI: [`sql/001_init_schema.sql`](sql/001_init_schema.sql).

```bash
psql -h localhost -p 5432 -U postgres -d advent -f sql/001_init_schema.sql
```

### Troubleshooting: `column "name" of relation "quest" contains null values`

That happens when **synchronize** changes `quest` but existing rows would leave new `NOT NULL` columns as `NULL`.

**Local dev (you can discard quest data):** drop the quest tables, then re-apply schema.

If `DB_SYNCHRONIZE=true`, restart Nest after the drop and TypeORM recreates tables. Otherwise run `npm run migration:run` (or the SQL fallback) after the drop.

**Option A — without `psql`:** from `backend/`:

```bash
npm run db:reset-quests
```

Reads `.env` and drops `quest_step`, then `quest` (does not touch `media`).

**Option B — `psql`:**

```bash
psql -h localhost -p 5432 -U postgres -d advent -f sql/dev_reset_quest_tables.sql
```

[`sql/dev_reset_quest_tables.sql`](sql/dev_reset_quest_tables.sql) is the same drop as `npm run db:reset-quests`.

Then run `npm run start:dev` again.

## Install and run

```bash
npm install
npm run start:dev
```

Other scripts:

```bash
npm run build
npm run start
npm run start:prod
npm run lint
npm run test
npm run migration:run
npm run db:reset-quests
```

Unit tests (`npm test`, Jest) cover the pieces that are easy to get wrong: quest access rules (`QuestsService`), JWT/`AUTH_DISABLED` and privileged-role guards, role claim parsing, and media `findOne`. No GitLab/GitHub CI yet.

## API docs (Swagger)

[http://localhost:3001/docs](http://localhost:3001/docs) when `PORT` is unset.

## Modules and routes

| Prefix | Description |
|--------|-------------|
| `/health` | Liveness (`HealthModule`) — public |
| `/quest` | Quests and quest steps (`QuestsModule`) |
| `/media` | Media upload and serving (`MediaModule`) |

Global `ValidationPipe` uses `transform`, `whitelist`, and `forbidNonWhitelisted`.

## `src` layout

- `app.module.ts` — root module, config, TypeORM
- `config/` — typed env (`configuration.ts`, Joi schema)
- `database/` — TypeORM DataSource and migrations
- `health/` — liveness
- `auth/` — JWT/OIDC guards and role checks
- `quests/` — quest domain
- `media/` — media files domain
- `common/` — shared utilities

## License

UNLICENSED (private project).
