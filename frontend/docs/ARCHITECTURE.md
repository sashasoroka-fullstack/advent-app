# Architecture

Well Being Quest is a React SPA (`frontend/`) plus a NestJS API (`backend/`) in this repository.

```
pages / components  →  hooks & React context  →  services  →  domain (QuestEngine)
```

## Frontend layers

| Layer | Path | Role |
|-------|------|------|
| Pages | `src/pages/` | `/login`, `/quest` |
| UI | `src/components/` | Map, steps, pointers, quest admin panel |
| Context | `src/context/` | Auth-independent app state: UI theme, API quests, sheet/CSV data, step editing |
| Services | `src/services/` | I/O: CSV / Google Sheets / API providers, REST client, UI config load |
| Domain | `src/domain/quest/` | Pure TypeScript. `QuestEngine` owns progress, grouping, finish screens |
| Config | `src/config/`, `src/constants/` | Task rules, default map assets, enums, row types |
| Auth | `src/auth/` | `VITE_DEV_MODE=true` → mock user; otherwise OIDC |

Provider order on `/quest` (`QuestProviders`): `UIConfigProvider` → `ApiQuestProvider` → `QuestDataProvider` → `StepEditingProvider`. Login and auth sit outside that tree. Map finish-screen state is local to the map (`MapFinishProvider`).

Privileged users edit API quests from the **Quest configuration** panel on `/quest` (create/select quest, steps, data source, media). There is no separate demo page.

## Data sources

Progress rows come from `QuestDataService` + a provider:

- `MockCSVProvider` — `/public/mock-quest-data.csv`
- `GoogleSheetsProvider` — published sheet CSV URL
- `APIProvider` — JSON from a REST endpoint

Quest definitions and media go through `src/services/api/` to `backend/` (`/quest`, `/media`).

Sheet/CSV columns are typed in `src/constants/interfaces.ts` (Ukrainian headers). Changing a header without updating that mapping breaks progress.

## UI themes

Default visuals: `src/config/uiConfig.ts`. Alternate JSON themes: `ui-configs/` (copied to `public/ui-configs/`). See [ui-configs/README.md](../ui-configs/README.md).

## Backend

NestJS modules under `backend/src/quests`, `backend/src/media`, `backend/src/auth`, `backend/src/health`. Controllers stay thin; services own rules and TypeORM access. Schema via migrations (`npm run migration:run` from `backend/`). JWT from the same Identity issuer as the SPA, with `@Public()` / `@PrivilegedOnly()` — media **writes** are privileged-only. Swagger: `/docs`. Liveness: `/health`. See [backend/README.md](../../backend/README.md).

## Auth

Details: [AUTHENTICATION.md](./AUTHENTICATION.md). Switch: `VITE_DEV_MODE=true` (frontend) and optional `AUTH_DISABLED=true` (backend, non-production only).
