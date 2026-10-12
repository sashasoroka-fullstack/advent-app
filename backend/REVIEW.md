# Project Review Guidelines — Advent backend

## Stack
NestJS 11 + TypeScript + TypeORM + PostgreSQL. Modules live under `src/<domain>/` (e.g. `src/quests`, `src/media`).

## NestJS conventions
- Controllers must be thin — no business logic, no DB access. Delegate to services.
- Every service is `@Injectable()` and gets dependencies via constructor injection. No `new SomeService()`.
- Every module declares its own `providers`, `controllers`, and `exports` explicitly. No barrel re-exports of providers.
- Feature modules must not import `AppModule` or reach across domains directly — go through exported providers.

## DTOs and validation
- All request bodies, query params, and route params bind to a DTO class with `class-validator` decorators (`@IsString()`, `@IsUUID()`, `@IsEnum()`, etc.). Flag any raw `any`, `Record<string, any>`, or untyped `@Body()`.
- DTOs live next to the controller they serve (e.g. `src/quests/dto/create-quest.dto.ts`).
- Use `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` — flag DTOs that rely on extra properties slipping through.
- Don't return TypeORM entities directly from controllers when they contain sensitive fields. Map to a response DTO.

## TypeORM
- Entities use explicit column types — no implicit inference for `varchar`/`text`/`numeric` precision. Entity files use `*.entity.ts`.
- Relations declare both sides where it matters and set `onDelete` / `onUpdate` explicitly for cascades.
- Repository access goes through `@InjectRepository(Entity)` — no manual `getRepository()` calls.
- No raw SQL strings concatenated with user input. Use the QueryBuilder with parameter binding or repository methods.
- Migrations (when added) must be reversible — flag `down()` methods that are empty or throw.

## Configuration and secrets
- Read environment variables only via `ConfigService` from `@nestjs/config`. Flag any direct `process.env.X` access outside `main.ts` bootstrap and `src/database/data-source.ts` (TypeORM CLI).
- Never commit secrets, connection strings, or API keys. `.env` files must be gitignored.

## Async and error handling
- Service methods that touch I/O return `Promise<T>` and are `async`. No mixing of callback-style and async/await.
- Throw NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, etc.) — don't return `{ error: '...' }` shapes from controllers.
- Don't swallow errors with empty `catch {}`. Log or rethrow.

## Testing
- New service methods need a unit test in `*.spec.ts` next to the file. New controller routes need an e2e test under `test/`.
- Tests should not hit a real DB unless they're explicitly e2e — use mocked repositories for unit tests.

## Style
- Follow the existing ESLint + Prettier config — flag formatting drift.
- No `console.log` in committed code. Use NestJS `Logger`.
