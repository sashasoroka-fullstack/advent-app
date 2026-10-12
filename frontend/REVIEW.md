# Project Review Guidelines — Advent frontend (Well Being Quest)

Frontend SPA for a gamified wellness quest map (`frontend/` in this monorepo). Review MRs against this stack and layering. Backend guidelines: [../backend/REVIEW.md](../backend/REVIEW.md).

## Stack

- **Runtime:** React 18, TypeScript 5, Vite 5 (ESM, `import.meta.env`)
- **Routing:** `react-router-dom` v6 (`src/router/`)
- **UI:** PrimeReact, Framer Motion, custom SVG map (`MapRenderer`, `Step`, pointers)
- **Auth:** `oidc-client-ts` + `react-oidc-context` (`src/auth/`), DEV bypass via `VITE_DEV_MODE`
- **Data:** CSV/Google Sheets providers (PapaParse), optional REST API (`src/services/api/`)
- **Persistence (browser):** `localStorage`, IndexedDB (`src/utils/indexedDBStorage.ts`, `localStorageConfig.ts`)

## Architecture (enforce layering)

```
Components / pages  →  hooks & React contexts  →  services  →  domain (pure)
```

| Layer | Path | Rules |
|-------|------|--------|
| **Domain** | `src/domain/` | Pure TS — **no React**, no `fetch`, no `localStorage`. Quest rules live in `QuestEngine` (`src/domain/quest/QuestEngine.ts`). |
| **Services** | `src/services/` | I/O, providers, API client, UI config load/validate. |
| **Context** | `src/context/` | Shared app state; orchestrate services, expose hooks. |
| **Components** | `src/components/`, `src/pages/` | Presentation only — no duplicated business rules. |

Flag business logic added only in components when it belongs in `QuestEngine` or an existing domain/service module.

## React & UI conventions

- Prefer **function components** and hooks; keep components focused — split large files when the MR already does.
- **Context:** consume via dedicated hooks (`useQuestDataContext`, `useUIConfig`, etc.). Do not prop-drill quest/API state deeply if context exists.
- **Provider order** in `App.tsx` matters (`UIConfigProvider` → `ApiQuestProvider` → `QuestDataProvider` → `StepEditingProvider`). Flag changes that break nesting or create circular context dependencies.
- **Side effects** belong in `useEffect` / event handlers, not in render. Avoid state updates during render.
- **Keys:** stable list keys (`id`, `taskNumber`) — not array index for dynamic user/step lists.
- **Accessibility:** interactive map steps and modals should remain keyboard-usable; flag `onClick`-only controls without roles/labels on new UI.
- Do not import from `dist/` or bypass public asset paths; static UI configs live under `public/ui-configs/` and `ui-configs/`.

## Domain & quest logic

- User progress, finish screens, visibility rules → **`QuestEngine`** / `src/config/quest.config.ts`. Do not reimplement task counting or finish thresholds in components.
- Raw sheet rows use `IRowData` / `QuestRowData` (`src/constants/interfaces.ts`) with Ukrainian column names (`Email Address`, task keys like `1. Список справ`). Flag renames that break CSV/Google Sheets mapping.
- Map positions use `IMapTaskPosition` / `QuestTaskPosition`; users are grouped by `taskNumber`, not array index.
- `questDataScope` helpers (`src/utils/questDataScope.ts`): **API quest** (`api:<id>`) vs **local preset** (`local:<key>`) must stay consistent across `QuestDataContext` and storage keys.

## Data layer

### Quest progress data (`QuestDataContext`)

- Sources: `MockCSVProvider`, `GoogleSheetsProvider`, `APIProvider` (`src/services/providers/`).
- Factory: `src/services/questDataServiceFactory.ts` — respect env defaults and polling.
- Per-quest `localStorage` keys: `questGoogleSheetUrl:<theme>`, `questDataSourceType:<theme>`, `questDataCleared:<theme>`. Flag global keys that ignore active quest/theme.
- Polling callbacks must not leak intervals — `stopPolling()` on unmount/switch/clear.

### REST API (`src/services/api/`)

- All HTTP via `apiRequest` / `buildApiUrl` in `client.ts` — use `ApiError`, do not duplicate raw `fetch` error parsing.
- DTOs: `ApiQuest`, `ApiQuestStep`, `ApiMedia` in `questsApi.ts` / `mediaApi.ts`. Keep request/response types explicit; avoid `any` on API payloads.
- Media URLs: use `resolveApiMediaUrl()` for relative paths from the API.
- Env: `VITE_API_BASE_URL` (see `client.ts`). New env vars must be prefixed with `VITE_` and declared in `src/vite-env.d.ts`.

### UI configuration

- Schema: `src/services/uiConfigSchema.ts`; validation: `src/utils/configValidator.ts`.
- Loaded via `uiConfigLoader.ts` (static JSON → IndexedDB → localStorage edits). Large images go to **IndexedDB**, not `localStorage`.
- Edits prefix: `questConfigEdits:<configKey>` (`localStorageConfig.ts`). Do not store full base64 maps in `localStorage`.

## Authentication

- Production: OIDC via `src/auth/config.ts` (`WebStorageStateStore` → `localStorage`).
- DEV: `VITE_DEV_MODE=true` uses `dev-auth-provider` — no real tokens required.
- Read auth settings through `src/configUtils.ts` / `authConfig.ts`, not scattered `import.meta.env` reads in components.
- `ProtectedRoute` must stay enforced for quest routes in non-DEV mode.

## TypeScript

- Strict typing for props, context values, and API types. Flag `any`, unchecked `as` casts, and non-null assertions without guards.
- Prefer existing types/enums in `src/constants/` (`tasksEnum`, `userDataKeys`, `finishScreenTypes`).
- Re-export patterns: use `src/domain/quest/index.ts`, `src/services/index.ts` where already established.

## Configuration & secrets

- Only `VITE_*` variables in app code (`import.meta.env`). Never commit `.env`, `.env.local`, tokens, or private keys.
- `.env.example` documents optional vars — keep it in sync when adding new `VITE_` flags.
- CI build uses injected `APP_ENV_VARIABLES` — do not hardcode production URLs in source.

## Error handling & logging

- Use `logger` from `src/utils/logger.ts` with a **context string** (e.g. `"QuestDataContext"`). Flag new `console.log` / `console.debug` in `src/` (except Vite plugin build scripts).
- User-facing errors: surface via context `error` state or UI messages; do not swallow fetch/parser failures silently.
- `ErrorBoundary` wraps the app — new top-level trees should remain inside it.

## Performance & bundles

- Avoid loading entire CSV/API payloads into React state more than once; respect existing polling dedup (`prevDataRef` serialized compare).
- Defer heavy work (large JSON parse, image blob conversion) out of hot render paths.
- Framer Motion: prefer existing animation patterns in `src/components/Animation/` and UI config `animations` block.

## Testing & CI (scope for this repo)

- Unit tests use Vitest (`npm test` in `frontend/`). Keep existing tests green; add tests when changing `QuestEngine`, config validation, or the API client.
- `npm run build` (`tsc && vite build`) and `npm run lint` must pass. Flag TypeScript errors and ESLint violations in changed `ts`/`tsx` files.
- GitLab: `build-test` on MRs to `develop`; do not break artifact `frontend/dist/` output.

## Out of scope / ignore in review

- `dist/`, `node_modules/`, lockfile-only churn unless it breaks install
- Generated or copied assets under `public/assets/` from Vite `copy-assets` plugin
- `docs/` unless the MR changes behavior documented there
- Backend/NestJS/TypeORM patterns — apply [../backend/REVIEW.md](../backend/REVIEW.md) to `backend/` changes

## Style

- Match existing file layout and naming (`PascalCase` components, `camelCase` utilities, `*Context.tsx` for providers).
- ESLint: `@typescript-eslint/recommended`, `react-hooks` (note: `exhaustive-deps` is off project-wide — do not mass-enable in unrelated files).
- Prefer minimal MR scope; no drive-by refactors unrelated to the change.
