# Project Review Guidelines — Advent

This repository is a monorepo:

- Changes under `frontend/` → follow [frontend/REVIEW.md](frontend/REVIEW.md)
- Changes under `backend/` → follow [backend/REVIEW.md](backend/REVIEW.md)
- Root files (`.gitlab-ci.yml`, this `README.md`) → keep the frontend GitLab build/deploy working (`cd frontend`, artifacts `frontend/dist/`)

Do not mix NestJS patterns into the React app or React patterns into Nest modules.

---

## Frontend (`frontend/`)

Frontend SPA for a gamified wellness quest map. Review against this stack and layering.

### Stack

- **Runtime:** React 18, TypeScript 5, Vite 5 (ESM, `import.meta.env`)
- **Routing:** `react-router-dom` v6 (`frontend/src/router/`)
- **UI:** PrimeReact, Framer Motion, custom SVG map (`MapRenderer`, `Step`, pointers)
- **Auth:** `oidc-client-ts` + `react-oidc-context` (`frontend/src/auth/`), DEV bypass via `VITE_DEV_MODE`
- **Data:** CSV/Google Sheets providers (PapaParse), optional REST API (`frontend/src/services/api/`)
- **Persistence (browser):** `localStorage`, IndexedDB

### Architecture (enforce layering)

```
Components / pages  →  hooks & React contexts  →  services  →  domain (pure)
```

| Layer | Path | Rules |
|-------|------|--------|
| **Domain** | `frontend/src/domain/` | Pure TS — **no React**, no `fetch`, no `localStorage`. Quest rules live in `QuestEngine`. |
| **Services** | `frontend/src/services/` | I/O, providers, API client, UI config load/validate. |
| **Context** | `frontend/src/context/` | Shared app state; orchestrate services, expose hooks. |
| **Components** | `frontend/src/components/`, `frontend/src/pages/` | Presentation only — no duplicated business rules. |

Flag business logic added only in components when it belongs in `QuestEngine` or an existing domain/service module.

### React & UI conventions

- Prefer **function components** and hooks; keep components focused — split large files when the MR already does.
- **Context:** consume via dedicated hooks (`useQuestDataContext`, `useUIConfig`, etc.). Do not prop-drill quest/API state deeply if context exists.
- **Provider order** in `App.tsx` matters (`UIConfigProvider` → `ApiQuestProvider` → `QuestDataProvider` → `StepEditingProvider`). Flag changes that break nesting or create circular context dependencies.
- **Side effects** belong in `useEffect` / event handlers, not in render. Avoid state updates during render.
- **Keys:** stable list keys (`id`, `taskNumber`) — not array index for dynamic user/step lists.
- **Accessibility:** interactive map steps and modals should remain keyboard-usable; flag `onClick`-only controls without roles/labels on new UI.
- Do not import from `dist/` or bypass public asset paths; static UI configs live under `frontend/public/ui-configs/` and `frontend/ui-configs/`.

### Domain & quest logic

- User progress, finish screens, visibility rules → **`QuestEngine`** / `frontend/src/config/quest.config.ts`. Do not reimplement task counting or finish thresholds in components.
- Raw sheet rows use `IRowData` / `QuestRowData` (`frontend/src/constants/interfaces.ts`) with Ukrainian column names. Flag renames that break CSV/Google Sheets mapping.
- Map positions use `IMapTaskPosition` / `QuestTaskPosition`; users are grouped by `taskNumber`, not array index.
- `questDataScope` helpers: **API quest** (`api:<id>`) vs **local preset** (`local:<key>`) must stay consistent across `QuestDataContext` and storage keys.

### Data layer

- Sources: `MockCSVProvider`, `GoogleSheetsProvider`, `APIProvider`.
- All HTTP via `apiRequest` / `buildApiUrl` in `client.ts` — use `ApiError`, do not duplicate raw `fetch` error parsing.
- Env: `VITE_API_BASE_URL`. New env vars must be prefixed with `VITE_` and declared in `frontend/src/vite-env.d.ts`.
- Only `VITE_*` variables in app code. Never commit `.env`, `.env.local`, tokens, or private keys.

### Authentication

- Production: OIDC via `frontend/src/auth/config.ts`.
- DEV: `VITE_DEV_MODE=true` uses `dev-auth-provider`.
- `ProtectedRoute` must stay enforced for quest routes in non-DEV mode.

### Testing & CI

- Frontend unit tests: Vitest (`npm test` in `frontend/`).
- GitLab frontend build runs from `frontend/` (`npm ci`, `npm run build`). Artifacts: `frontend/dist/`. Do not break that path.

### Style

- Match existing file layout and naming (`PascalCase` components, `camelCase` utilities, `*Context.tsx` for providers).
- Use `logger` from `frontend/src/utils/logger.ts`. Flag new `console.log` in `frontend/src/`.
- Prefer minimal MR scope; no drive-by refactors unrelated to the change.

Full frontend checklist: [frontend/REVIEW.md](frontend/REVIEW.md).

---

## Backend (`backend/`)

NestJS 11 + TypeScript + TypeORM + PostgreSQL. Modules live under `backend/src/<domain>/` (e.g. `backend/src/quests`, `backend/src/media`).

### NestJS conventions

- Controllers must be thin — no business logic, no DB access. Delegate to services.
- Every service is `@Injectable()` and gets dependencies via constructor injection. No `new SomeService()`.
- Every module declares its own `providers`, `controllers`, and `exports` explicitly. No barrel re-exports of providers.
- Feature modules must not import `AppModule` or reach across domains directly — go through exported providers.

### DTOs and validation

- All request bodies, query params, and route params bind to a DTO class with `class-validator` decorators. Flag any raw `any`, `Record<string, any>`, or untyped `@Body()`.
- DTOs live next to the controller they serve (e.g. `backend/src/quests/dto/create-quest.dto.ts`).
- Use `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- Don't return TypeORM entities directly from controllers when they contain sensitive fields. Map to a response DTO.

### TypeORM

- Entities use explicit column types. Entity files use `*.entity.ts`.
- Relations declare both sides where it matters and set `onDelete` / `onUpdate` explicitly for cascades.
- Repository access goes through `@InjectRepository(Entity)` — no manual `getRepository()` calls.
- No raw SQL strings concatenated with user input. Use the QueryBuilder with parameter binding or repository methods.
- Migrations must be reversible — flag `down()` methods that are empty or throw.

### Configuration and secrets

- Read environment variables only via `ConfigService` from `@nestjs/config`. Flag any direct `process.env.X` access outside `main.ts` bootstrap and `backend/src/database/data-source.ts` (TypeORM CLI).
- Never commit secrets, connection strings, or API keys. `.env` files must be gitignored.

### Async and error handling

- Service methods that touch I/O return `Promise<T>` and are `async`.
- Throw NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, etc.) — don't return `{ error: '...' }` shapes from controllers.
- Don't swallow errors with empty `catch {}`. Log or rethrow.

### Testing

- New service methods need a unit test in `*.spec.ts` next to the file. New controller routes need an e2e test under `backend/test/`.
- Tests should not hit a real DB unless they're explicitly e2e — use mocked repositories for unit tests.

### Style

- Follow the existing ESLint + Prettier config in `backend/`.
- No `console.log` in committed code. Use NestJS `Logger`.

Full backend checklist: [backend/REVIEW.md](backend/REVIEW.md).
