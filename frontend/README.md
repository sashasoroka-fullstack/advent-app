# Well Being Quest

A gamified wellness tracking application that helps teams visualize and celebrate their wellness journey together. React client for Advent (`frontend/` in this repo); the HTTP API lives in [`../backend`](../backend) (port **3001**). The Vite app is **http://localhost:3000**.

To run frontend and backend together, see the [repository README](../README.md).

## 📖 Table of Contents

- [What is Well Being Quest?](#what-is-well-being-quest)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Authentication Modes](#authentication-modes)
- [Data Layer & Sources](#data-layer--sources)
- [Dynamic configuration](#dynamic-configuration)
- [Quest Logic & Progression](#quest-logic--progression)
- [Observability](#observability)
- [UI Customization](#ui-customization)
- [Project Structure](#project-structure)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)
- [Advanced Topics](#advanced-topics)

---

## What is Well Being Quest?

**Well Being Quest** is an interactive wellness tracking application that transforms daily wellness activities into an engaging quest journey. Users complete wellness tasks (like creating to-do lists, taking walks, practicing gratitude) and their progress is visualized on an animated quest map.

### Key Features

- 🗺️ **Interactive Quest Map** - Visual representation of user progress with animated characters
- 🎯 **Gamified Progress** - Track wellness activities as quest milestones
- 👥 **Social Competition** - See where teammates are on their wellness journey
- 🎨 **Fully Configurable UI** - Replace maps, assets, and animations without code changes
- 🔐 **Flexible Authentication** - Works with or without OIDC (perfect for local development)
- 📊 **Multiple Data Sources** - Supports Google Sheets, mock data, or custom APIs

### Design Goals

After recent refactoring, the application is built with these principles:

✅ **Reusability** - Components and logic can be reused for different quests or brands  
✅ **Configurability** - UI elements, maps, and assets are configurable via central config  
✅ **DEV/PROD Separation** - Works seamlessly in development without external dependencies  
✅ **No Infrastructure Lock-in** - No hard dependency on any specific company's infrastructure  
✅ **Clean Architecture** - Domain logic separated from UI, services abstracted from components

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Components (Map, Quest, FinishScreen, etc.)      │  │
│  │  - Plug-and-play UI components                           │  │
│  │  - Configuration-driven rendering                        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │ Props & Hooks                           │
└───────────────────────┼─────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                       ▼     SERVICE LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  QuestDataService (Factory Pattern)                      │  │
│  │  - Auto-configuration based on environment               │  │
│  │  - Data polling (3-minute intervals)                     │  │
│  │  - Provider abstraction                                  │  │
│  └────────┬──────────────────┬───────────────────┬──────────┘  │
│           │                  │                   │              │
│  ┌────────▼────────┐ ┌──────▼──────┐ ┌─────────▼─────────┐    │
│  │ MockCSVProvider │ │GoogleSheets │ │  APIProvider      │    │
│  │ (Development)   │ │ Provider    │ │  (Custom APIs)    │    │
│  └─────────────────┘ └─────────────┘ └───────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                       ▼     DOMAIN LAYER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  QuestEngine (Pure Business Logic)                       │  │
│  │  - Framework-independent                                 │  │
│  │  - No React, no side effects                             │  │
│  │  - Single source of truth for quest rules               │  │
│  └────────┬─────────────────────────────────────────────────┘  │
│           │                                                     │
│           ▼                                                     │
│     QuestEngine (progress, grouping, finish screens)            │
└─────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                       ▼     CONFIGURATION LAYER                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  quest.config.ts          │  uiConfig.ts                 │  │
│  │  - Task definitions       │  - Map & visual assets       │  │
│  │  - Finish task IDs        │  - Task positions            │  │
│  │  - Quest metadata         │  - Animations                │  │
│  └───────────────────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                       ▼     AUTHENTICATION LAYER                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AuthProvider (Dual-mode)                                │  │
│  │  ┌────────────────┐    ┌──────────────────┐             │  │
│  │  │ DEV Mode       │ OR │ OIDC Mode        │             │  │
│  │  │ (Mock Auth)    │    │ (Production)     │             │  │
│  │  └────────────────┘    └──────────────────┘             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Key Principles:
  → Clean separation of concerns
  → Top-down dependency flow (UI → Services → Domain → Config)
  → Configuration-driven behavior
  → No circular dependencies
```

---

## Quick Start

Vite serves the app at **http://localhost:3000**. The Nest API (`backend/`) defaults to **http://localhost:3001**.

Run these commands from `frontend/`. For the full stack, see the [repository README](../README.md).

### Prerequisites

- Node.js LTS
- For API-backed quests: PostgreSQL + the Nest API in `backend/` running

### Local demo (no Identity Server)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

`.env.example` sets `VITE_DEV_MODE=true`. Open [http://localhost:3000/quest](http://localhost:3000/quest):

- Auto-login as `dev@leobit.com` (privileged)
- Mock progress from `/public/mock-quest-data.csv`
- API calls go to `http://localhost:3001` (optional for the map; required for quest CRUD / media)

To use the HTTP API locally, start `backend/` with `CORS_ORIGIN=http://localhost:3000`. For a full demo without Identity, also set `AUTH_DISABLED=true` in `backend/.env`.

### OIDC + real data

Set `VITE_DEV_MODE=false` and fill OIDC + sheet URL in `.env.local`:

```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://your-oidc-authority.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv
VITE_API_BASE_URL=http://localhost:3001
```

Restart `npm run dev` after any env change.

### Production build

```bash
npm run build
npm run preview
```

Production builds need `VITE_DEV_MODE=false`, OIDC variables, and a data source (`VITE_GOOGLE_SHEET_URL` and/or `VITE_API_BASE_URL`).

---

## Environment Configuration

Copy [`.env.example`](.env.example) to `.env.local`. When `VITE_DEV_MODE=true`, other variables are optional.

### Environment Variables Reference

| Variable | Required | Default (DEV) | Description |
|----------|----------|---------------|-------------|
| `VITE_DEV_MODE` | No | `false` if unset | `true` enables mock auth (`dev@leobit.com`). This is the only switch for DEV vs OIDC. |
| `VITE_APP_AUTH_AUTHORITY` | When `VITE_DEV_MODE` is not `true` | — | OIDC authority URL |
| `VITE_APP_AUTH_REDIRECT_URI` | When `VITE_DEV_MODE` is not `true` | — | OAuth redirect URI (local: `http://localhost:3000`) |
| `VITE_GOOGLE_SHEET_URL` | Production | `/mock-quest-data.csv` | Google Sheets CSV export URL |
| `VITE_API_BASE_URL` | Optional | `http://localhost:3001` in Vite DEV / `VITE_DEV_MODE` | Nest API base URL |

**Nest HTTP API:** the app calls **`http://localhost:3001`** by default in development (`src/services/api/client.ts`). Vite is on **3000** (`vite.config.ts`, `strictPort`). Set `CORS_ORIGIN=http://localhost:3000` in `backend/.env`.

### Configuration Modes

#### 1. DEV mode (recommended locally)

```bash
VITE_DEV_MODE=true
```

**Result:**
- Authentication bypassed (auto-login as `dev@leobit.com`)
- Mock CSV from `/public/mock-quest-data.csv` unless `VITE_GOOGLE_SHEET_URL` is set
- API base URL falls back to `http://localhost:3001`

An empty `.env.local` does **not** enable DEV mode. Unset `VITE_DEV_MODE` means OIDC, which then requires authority + redirect URI.

#### 2. OIDC, mock sheet data

```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://your-oidc.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
# omit VITE_GOOGLE_SHEET_URL to keep mock CSV
```

#### 3. Production-like

```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://your-oidc.com
VITE_APP_AUTH_REDIRECT_URI=https://your-domain.com
VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET/export?format=csv
VITE_API_BASE_URL=https://your-api.example.com
```

### Example .env.local Files

**Minimal (local development):**
```bash
VITE_DEV_MODE=true
```

**OIDC against local Vite:**
```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://dev.auth.example.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
```

**Full configuration:**
```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://auth.example.com
VITE_APP_AUTH_REDIRECT_URI=https://wellbeing.example.com
VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/1ABC.../export?format=csv
VITE_API_BASE_URL=https://api.example.com
```

---

## Authentication Modes

The application features a **dual-mode authentication system** that works reliably in both development and production.

### DEV Mode Authentication

**When it activates:** `VITE_DEV_MODE=true` (see `src/auth/authConfig.ts`). Vite `import.meta.env.DEV` alone is **not** enough.

**How it works:**
- Automatically logs you in as `dev@leobit.com`
- No redirects, no external auth provider
- Same `useAuthContext()` interface as OIDC mode

**Perfect for:** local development, UI work, demos without Identity Server.

### OIDC Mode Authentication

**When it activates:** `VITE_DEV_MODE` is not `true`.

**How it works:**
- OAuth 2.0 / OIDC via `oidc-client-ts` + `react-oidc-context`
- Requires `VITE_APP_AUTH_AUTHORITY` and `VITE_APP_AUTH_REDIRECT_URI`
- Token-based session with the identity provider

**Required for:** production and real users.

### How to Switch Between Modes

**DEV mode:**
```bash
VITE_DEV_MODE=true
```

**OIDC mode:**
```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://your-oidc.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
```

Restart the dev server after changing `.env.local`.

### Authentication Flow

**DEV Mode Flow:**
```
1. App loads
2. MockAuthProvider activates
3. User immediately authenticated as dev@leobit.com
4. Quest page renders
```

**OIDC Mode Flow:**
```
1. App loads
2. User not authenticated → redirect to /login
3. Login initiates OIDC flow
4. Redirect to identity provider
5. User authenticates
6. Redirect back to app with tokens
7. Quest page renders
```

### Configuration Validation

The app validates authentication configuration on startup:

**Valid configuration:**
- App starts normally

**Invalid configuration:**
- OIDC mode enabled but missing required variables
- Shows error screen with clear instructions
- Prevents silent failures

**Error Example:**
```
⚠️ Authentication Configuration Error

OIDC mode is enabled but required environment variables are missing:
  • VITE_APP_AUTH_AUTHORITY
  • VITE_APP_AUTH_REDIRECT_URI

Please set these values in your .env file or switch to DEV mode by setting:
  VITE_DEV_MODE=true
```

---

## Data Layer & Sources

The application uses a **service layer architecture** that abstracts data fetching from UI components.

### Architecture Overview

```
┌─────────────────────┐
│   React Components  │
│   (Quest.tsx, etc.) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   useQuestData Hook │  ← React hook for data access
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ QuestDataService    │  ← Service layer (abstraction)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Data Sources      │
│ • Mock CSV          │
│ • Google Sheets     │
│ • Future: REST API  │
└─────────────────────┘
```

### Supported Data Sources

#### 1. Mock CSV (Development)

**Location:** `/public/mock-quest-data.csv`

**When used:**
- DEV mode when `VITE_GOOGLE_SHEET_URL` is not set
- Automatic fallback for local development

**Advantages:**
- No external dependencies
- Fast and reliable
- Easy to modify for testing
- Perfect for development

#### 2. Google Sheets (Production)

**Configuration:**
```bash
VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv
```

**When used:**
- When `VITE_GOOGLE_SHEET_URL` is configured
- Recommended for production

**Advantages:**
- Non-technical users can update data
- Real-time updates via polling
- No database setup needed

#### 3. API Provider (New!)

**Configuration:**
```bash
# Use via runtime switching or custom provider
# See Dynamic Configuration section below
```

**When used:**
- Via runtime data source switching
- When custom API endpoint is needed
- For advanced integration scenarios

**Advantages:**
- Full control over data format and authentication
- Real-time updates via API polling
- Can integrate with existing HTTP APIs
- Supports custom headers for authentication

**Expected API Response:**
```json
[
  {
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://example.com/avatar.jpg",
    "taskNumber": 5
  }
]
```

#### 4. Future Extensions

The service layer is designed to support additional data sources:
- GraphQL endpoints
- WebSocket for real-time updates
- Local storage / IndexedDB
- Custom database connections

### Data Polling Behavior

The application automatically polls for data updates:

**Default interval:** 3 minutes (180,000ms)

**Polling process:**
1. Initial fetch when component mounts
2. Automatic refetch every 3 minutes
3. Data updates trigger UI re-render
4. Polling stops when component unmounts

**Configuration:**
```typescript
// In src/services/questDataServiceFactory.ts
const DEFAULT_POLLING_INTERVAL = 180000; // 3 minutes
```

### Expected Data Schema

The CSV data must follow this structure:

**Required columns:**
- `Email Address` - User email (must contain @)
- `Full name` - User's full name
- `Social network points` - Social network points (0-3)

**Task columns:**
- `1. Task list` - First task
- `2. List item` - Second task
- `3. Walk outdoors` - Third task
- ... (add more tasks as needed)

**Example CSV:**
```csv
Email Address,Full name,Social network points,1. Task list,2. List item,3. Walk outdoors
dev@leobit.com,Dev User,3,1,1,1
alice@example.com,Alice Cooper,2,1,1,
bob@example.com,Bob Smith,1,1,,
```

The sample file [`public/mock-quest-data.csv`](public/mock-quest-data.csv) in this repo uses Ukrainian column titles for the same roles; your production sheet may use any language as long as your data pipeline matches the headers you configure.

**Data validation:**
- Rows without valid email addresses are filtered out
- Empty task cells (null values) indicate incomplete tasks
- Social network points must be 0-3 (determines pointer color)

### Adding a New Data Source

To add a new data source (e.g., REST API):

1. Update `DataSourceType` enum in `/src/services/types.ts`
2. Add new configuration in `QuestDataService.ts`
3. Implement fetch logic in `fetchData()` method
4. Update factory in `questDataServiceFactory.ts`

---

## Dynamic configuration

Privileged users manage API-backed quests from the **Quest configuration** panel on `/quest`: pick a local preset or API quest, edit steps on the map, and set a Google Sheet URL.

Progress data still comes from the provider layer (`MockCSVProvider`, `GoogleSheetsProvider`, `APIProvider`) via `QuestDataContext`. UI themes load through `UIConfigContext` (`src/config/uiConfig.ts` and `ui-configs/`).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Quest Logic & Progression

This section explains **how the quest works conceptually** - the rules and logic behind user progression, without diving into code.

### How Users Progress

1. **Starting Point** - All users begin at position 0 (the start)
2. **Complete Tasks** - Users complete wellness tasks (tracked in spreadsheet/data source)
3. **Move Forward** - Each completed task moves the user one position forward on the map
4. **Visual Representation** - User's avatar/pointer shows their current position
5. **Reach Finish** - Special screens appear at milestone positions

### Task Completion Rules

**Task counting:**
- Each task column in the data represents one quest step
- Any non-null value in a task column = task completed
- Null/empty value = task not yet completed

**Position calculation:**
- Count all completed tasks (non-null task columns)
- User's position = number of completed tasks
- Position determines where user appears on the map

**Example:**
```
User: alice@example.com
Tasks: [✓, ✓, ✓, -, -]  (3 completed, 2 incomplete)
Position: 3  (appears at task position 3 on map)
```

### User Positioning on Map

**Visual representation:**
- Each task position on the map has coordinates (configured in `uiConfig.ts`)
- Users are grouped by position - all users at position 5 appear together
- User pointers are colored based on social network points (0=red, 1=yellow, 2=cyan, 3=green, etc.)

**Pointer colors:**
The "Social network points" column determines pointer color:
- 0 = Red pointers
- 1 = Yellow pointers
- 2 = Cyan pointers
- 3 = Green pointers

Each color has multiple variants to distinguish users at the same position.

### Special Tasks & Finish States

The quest has **special milestone tasks** that trigger finish screens:

**Task 9 (First Finish):**
- Shows a "finish" screen for the logged-in user
- Celebrates reaching the halfway point
- Other users continue normally

**Task 14 (Final Finish):**
- Shows a "dzen" (zen/meditation) screen
- Indicates quest completion
- Special celebration for completing all tasks

**Logged User Separation:**
- At special tasks (9 and 14), the logged-in user is shown separately
- Creates a personalized experience
- Highlights the user's achievement

### Finish Screen Logic

**When finish screens appear:**
1. User must be logged in (not other users)
2. User must be at a special task position (9 or 14)
3. Appropriate finish screen is displayed based on position

**Screen types:**
- **"finish"** - Position 9-13 (you've reached the finish line!)
- **"dzen"** - Position 14 (final completion, zen state)

### Task Validation

**Valid tasks:**
- Must have a column in the data starting with a number (e.g., "1. Task Name")
- Columns are sorted numerically
- Any non-null value counts as completion

**Ignored data:**
- Rows without valid email addresses
- Columns not matching task pattern
- Metadata columns (name, social points, etc.)

---

## Observability

The application includes comprehensive logging and error handling to help you debug issues and monitor application behavior.

### Logging System

**Location:** `/src/utils/logger.ts`

The application uses a structured logging utility that provides consistent, grouped logging across all components and services.

#### Log Levels

The logger supports four log levels with increasing severity:

- **DEBUG** - Detailed debugging information (disabled by default)
- **INFO** - General informational messages (default level)
- **WARN** - Warning messages for potential issues
- **ERROR** - Error messages with stack traces

#### Using the Logger

Import and use the logger in your code:

```typescript
import { logger } from './utils/logger';

// Info message
logger.info('ComponentName', 'User logged in successfully');

// Warning message
logger.warn('ServiceName', 'Data fetch took longer than expected');

// Error message with error object
logger.error('ComponentName', 'Failed to load data', error);

// Debug message (only shown if DEBUG level enabled)
logger.debug('ServiceName', 'Processing user data', userData);
```

#### Grouped Logging

Use groups to organize related logs:

```typescript
logger.group('🔄 Data Refresh');
logger.info('QuestDataService', 'Starting data fetch...');
logger.info('QuestDataService', 'Data fetched successfully');
logger.groupEnd();
```

#### Configuring Log Levels

**During Development:**

To see all logs including DEBUG:

```typescript
// In your browser console
import { logger, LogLevel } from './utils/logger';
logger.setMinLevel(LogLevel.DEBUG);
```

**Or modify the logger initialization:**

```typescript
// In src/utils/logger.ts
export const logger = new Logger({
  enabled: true,
  minLevel: LogLevel.DEBUG, // Change to DEBUG for development
});
```

**In Production:**

Set to ERROR or WARN to reduce console noise:

```typescript
export const logger = new Logger({
  enabled: true,
  minLevel: LogLevel.ERROR,
});
```

#### Disabling Logging

To completely disable logging (e.g., for production builds):

```typescript
logger.setEnabled(false);
```

### Error Handling

The application uses multiple layers of error handling to provide a robust user experience.

#### Error Boundary

**Location:** `/src/components/ErrorBoundary/ErrorBoundary.tsx`

React Error Boundary catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Features:**
- Catches and logs all React rendering errors
- Displays user-friendly error message
- Shows detailed error information for debugging
- Prevents entire app from crashing

**Usage in components:**

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Custom fallback UI:**

```typescript
<ErrorBoundary fallback={<div>Custom error message</div>}>
  <YourComponent />
</ErrorBoundary>
```

#### Service-Level Error Handling

All services include try-catch blocks and log errors:

```typescript
// Example from QuestDataService
try {
  const data = await fetchData();
  logger.info('QuestDataService', 'Data fetched successfully');
  return data;
} catch (error) {
  logger.error('QuestDataService', 'Failed to fetch data', error);
  throw error; // Re-throw to let components handle it
}
```

#### Configuration Validation

Configuration errors are caught and logged with helpful messages:

```typescript
// Invalid configuration
logger.error(
  'ConfigValidator',
  'Quest configuration is invalid: taskCount must be positive',
  validationError
);
```

### Monitoring Points

Key areas where logging occurs for debugging and monitoring:

#### 1. Application Startup

**Location:** Application initialization in `App.tsx`

```typescript
logger.group('🚀 Application Startup');
logger.info('Startup', 'Mode: DEV');
logger.info('Startup', 'Data Provider: Mock CSV');
logger.info('Startup', 'Quest: Well Being Quest');
logger.info('Startup', 'Task Count: 15');
logger.groupEnd();
```

**Use this to verify:**
- Application mode (DEV vs PROD)
- Data source configuration
- Quest configuration loaded

#### 2. Authentication Flow

**Location:** Auth providers and context

```typescript
logger.info('AuthProvider', 'User authenticated', { email: user.email });
logger.warn('AuthProvider', 'Authentication failed, retrying...');
logger.error('AuthProvider', 'OIDC configuration error', error);
```

**Use this to debug:**
- Login/logout events
- Auth state changes
- OIDC flow issues
- Redirect problems

#### 3. Data Fetching

**Location:** QuestDataService and data providers

```typescript
logger.info('QuestDataService', 'Fetching quest data from Mock CSV');
logger.info('QuestDataService', 'Data fetched: 15 users');
logger.warn('QuestDataService', 'Some data rows invalid, filtered 3 rows');
logger.error('QuestDataService', 'Failed to fetch data', error);
```

**Use this to monitor:**
- Data fetch attempts
- Data source being used
- Number of users/rows loaded
- Data validation issues
- Network errors

#### 4. Quest Logic Processing

**Location:** QuestEngine and domain services

```typescript
logger.debug('QuestEngine', 'Processing user progress', { userId, taskNumber });
logger.warn('QuestEngine', 'Invalid task number detected', { taskNumber, userId });
logger.info('QuestEngine', 'User reached finish task', { userId, taskNumber: 9 });
```

**Use this to verify:**
- User progress calculations
- Task completion logic
- Finish state triggers
- Position grouping

#### 5. Configuration Changes

**Location:** `UIConfigContext` / `uiConfigLoader`

```typescript
logger.info("UIConfigContext", `Loading UI config: ${key}`);
logger.error("UIConfigContext", `Failed to load UI config: ${errorMsg}`);
```

**Use this to debug:**
- Configuration loading
- Validation failures
- Fallback behavior
- Dynamic config changes

### Browser DevTools

#### Console Filtering

Use browser console filters to focus on specific components:

```javascript
// Filter by component/service name
// Type in browser console filter: [QuestDataService]

// Filter by log level
// Type in browser console filter: [ERROR]

// Filter by specific context
// Type in browser console filter: [AuthProvider]
```

#### Network Tab

Monitor data fetching in the Network tab:

- **Mock CSV:** Look for `/mock-quest-data.csv` requests
- **Google Sheets:** Look for `docs.google.com` requests
- **API Provider:** Look for your custom API endpoint requests

Check:
- Request status (200 OK, 404 Not Found, etc.)
- Response data format
- Response time
- CORS issues

#### React DevTools

Install React DevTools browser extension to:

- Inspect component tree
- View component props and state
- Track component re-renders
- Debug context values

### Common Debugging Scenarios

#### Scenario 1: Users Not Appearing on Map

**Check these logs:**

```javascript
// 1. Data fetch logs
[QuestDataService] Fetching quest data...
[QuestDataService] Data fetched: X users

// 2. Data validation logs
[QuestEngine] Processing user progress
[QuestEngine] Invalid email detected (filtered out)

// 3. Position calculation logs
[QuestEngine] User position calculated: taskNumber=5
```

**What to look for:**
- Number of users fetched vs number displayed
- Email validation warnings
- Task number calculation issues

#### Scenario 2: Authentication Issues

**Check these logs:**

```javascript
// 1. Auth mode detection
[AuthProvider] Using DEV mode authentication
// OR
[AuthProvider] Using OIDC authentication

// 2. Auth state changes
[AuthProvider] User authenticated: dev@leobit.com
[AuthProvider] Auth state: authenticated

// 3. Configuration errors
[AuthConfig] Missing OIDC configuration
```

**What to look for:**
- Which auth mode is active
- Auth state transitions
- Configuration validation errors

#### Scenario 3: Configuration Not Loading

**Check these logs:**

```javascript
// 1. Config loading attempt
[UIConfigContext] Loading UI config: default

// 2. Validation
[ConfigValidator] Configuration validation passed
```

**What to look for:**
- File loading errors (404)
- Validation failures
- Which fields are invalid
- Fallback being triggered

### Production Monitoring

#### Recommendations for Production

1. **Set appropriate log level:**
   ```typescript
   // Only log warnings and errors in production
   logger.setMinLevel(LogLevel.WARN);
   ```

2. **Integrate with monitoring service:**
   ```typescript
   // Example: Send errors to external service
   logger.error = (context, message, error) => {
     // Log to console
     console.error(`[${context}] ${message}`, error);
     
     // Send to monitoring service
     if (window.monitoringService) {
       window.monitoringService.captureError(error, { context, message });
     }
   };
   ```

3. **Monitor key metrics:**
   - Authentication success/failure rate
   - Data fetch success/failure rate
   - Average data fetch time
   - JavaScript errors caught by ErrorBoundary
   - Configuration validation failures

4. **Set up alerts for:**
   - Repeated authentication failures
   - Data source connection failures
   - High error rates in browser console
   - Configuration loading failures

### Logging Best Practices

When adding new features or debugging:

1. **Use appropriate log levels:**
   - DEBUG: Detailed state information, variable values
   - INFO: Normal operations, successful actions
   - WARN: Potential issues, fallback behavior
   - ERROR: Failures, exceptions, critical problems

2. **Include context:**
   ```typescript
   // Good - includes context
   logger.info('QuestDataService', 'Data fetched: 15 users');
   
   // Bad - lacks context
   logger.info('QuestDataService', 'Data fetched');
   ```

3. **Use structured data:**
   ```typescript
   // Pass objects as additional arguments
   logger.info('QuestEngine', 'User progress calculated', { 
     userId, 
     taskNumber, 
     position 
   });
   ```

4. **Group related logs:**
   ```typescript
   logger.group('Data Refresh Cycle');
   logger.info('Service', 'Starting refresh...');
   // ... multiple related logs
   logger.groupEnd();
   ```

5. **Log errors with full details:**
   ```typescript
   logger.error('Component', 'Operation failed', error);
   // Logger will automatically include stack trace
   ```

---

## UI Customization

One of the key features after refactoring is **full UI configurability**. You can completely rebrand the application without touching component code.

### Central Configuration File

**Location:** `/src/config/uiConfig.ts`

This single file contains all UI configuration:
- Map SVG and background
- Task positions and coordinates
- Step marker images
- Animation elements (stars, clouds, character)
- Finish screen assets
- Pointer/avatar configurations

### What You Can Customize

#### 🗺️ Map & Background

Replace the quest map with your own SVG:

```typescript
// Import your new map
import MyCustomMap from "../assets/map/MyMap.svg";

// Update configuration
map: {
  background: QuestBackground,  // Background image
  mapSvg: MyCustomMap,           // Your custom map
}
```

#### 📍 Task Positions

Add, remove, or reposition tasks on the map:

```typescript
taskPositions: [
  {
    taskTitle: tasksEnum.initialPosition,
    taskNumber: 0,
    cxPointers: 15.8,   // X coordinate (%) for user pointers
    cyPointers: 21,     // Y coordinate (%) for user pointers
    cxStep: 16.5,       // X coordinate (%) for step marker
    cyStep: 32.5,       // Y coordinate (%) for step marker
  },
  // Add more task positions...
]
```

**Coordinates are percentages** (0-100) relative to the map SVG dimensions.

#### 🎯 Step Markers

Customize the step number images:

```typescript
steps: {
  images: [
    zeroStep,     // Step 0 image
    firstStep,    // Step 1 image
    secondStep,   // Step 2 image
    // ... add more steps
  ],
  shadow: {
    green: GreenStepShadow,      // Shadow for early steps
    purple: PurpleStepShadow,    // Shadow for later steps
    greenThreshold: 10,          // Tasks 0-9 use green, 10+ use purple
  },
}
```

#### ⭐ Animations

Configure stars, clouds, and character animations:

```typescript
animations: {
  stars: [
    { top: "80%", left: "60%", height: "3%", width: "3%", duration: 1.2 },
    { top: "15%", left: "85%", height: "2%", width: "2%", duration: 1.5 },
    // Add more stars...
  ],
  clouds: [
    { 
      top: "25%", left: "70%", height: "5%", width: "5%", 
      duration: 5, translateFrom: "-40%", translateTo: "20%" 
    },
    // Add more clouds...
  ],
  character: {
    image: GirlSvg,
    shadow: Shadow,
    position: { left: "79.3%", bottom: "24.9%" },
    // ... animation settings
  },
}
```

#### 🏆 Finish Screens

Replace finish screen images:

```typescript
finishScreens: {
  finish: FinishScreenSVG,   // Shown at position 9
  dzen: DzenScreenSVG,       // Shown at position 14
}
```

#### 👤 Pointers & Avatars

Configure colored pointers for different social network point levels:

```typescript
pointers: {
  colored: [
    // Social network point level 0
    [zero_red, zero_yellow, zero_cyan, zero_green, zero_orange, zero_purple],
    // Social network point level 1
    [one_red, one_yellow, one_cyan, one_green, one_orange, one_purple],
    // ... more levels
  ],
}
```

### How to Make Changes

**Step 1: Add Your Assets**
Place new images/SVGs in `/src/assets/` directory:
- Maps → `/src/assets/map/`
- Steps → `/src/assets/steps/`
- Animations → `/src/assets/star/`, `/src/assets/clouds/`, etc.

**Step 2: Import Assets**
At the top of `/src/config/uiConfig.ts`:
```typescript
import MyNewAsset from "../assets/folder/MyNewAsset.svg";
```

**Step 3: Update Configuration**
Change the config to use your new asset:
```typescript
map: {
  mapSvg: MyNewAsset,  // Updated
}
```

**Step 4: Test Changes**
```bash
npm run dev
```

Changes are hot-reloaded immediately!

### Reusing for Different Quests

To rebrand for a different quest or organization:

1. **Replace visual assets** - Map, steps, animations, finish screens
2. **Update task positions** - Adjust coordinates for new map layout
3. **Modify task names** - Update `tasksEnum` in `/src/constants/enums.ts`
4. **Update data schema** - Change CSV column headers to match new tasks
5. **Replace colors** - Update pointer colors if needed

**No component code changes required!**

### Advanced Customization

For more advanced UI customization, see:
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Task configuration:** `/src/constants/enums.ts`
- **UI config:** `/src/config/uiConfig.ts` and `/ui-configs/`

---

## Project Structure

Understanding the project structure helps you navigate and extend the application.

### High-Level Directory Structure

```
frontend/
├── public/                  # Static assets
│   └── mock-quest-data.csv  # Mock data for development
├── src/
│   ├── auth/               # Authentication system
│   ├── config/             # UI configuration
│   ├── domain/             # Business logic (framework-independent)
│   ├── services/           # Data service layer
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── assets/             # Images, SVGs, icons
│   ├── constants/          # Enums, row types, local quest presets
│   ├── helpers/            # Utility functions
│   └── router/             # React Router configuration
└── docs/                    # ARCHITECTURE.md, AUTHENTICATION.md
```

### Directory Responsibilities

#### `/src/auth/` - Authentication System

**Purpose:** Handle user authentication in both DEV and OIDC modes

**Key files:**
- `AuthContext.tsx` - Centralized auth state abstraction
- `auth-provider.tsx` - Top-level provider with mode detection
- `dev-auth-provider.tsx` - Mock authentication for DEV mode
- `authConfig.ts` - Configuration validation and mode detection
- `config.ts` - OIDC configuration

**When to modify:**
- Adding new authentication providers
- Changing auth flow behavior
- Adding auth-related features

#### `/src/config/` - UI Configuration

**Purpose:** Central configuration for all UI elements

**Key files:**
- `uiConfig.ts` - Main UI configuration (maps, positions, animations, assets)

**When to modify:**
- Changing visual assets
- Repositioning tasks
- Adding/removing animation elements
- Rebranding the application

#### `/src/domain/` - Business Logic Layer

**Purpose:** Core quest logic, independent of React and UI

**Key files:**
- `quest/QuestEngine.ts` — progress, grouping, finish screens
- `quest/types.ts` — domain aliases for row/map types

**When to modify:**
- Changing quest progression rules
- Adding new task evaluation logic
- Modifying finish screen behavior
- Updating business rules

**Design principle:** Domain layer has **no dependencies** on React, OIDC, or UI frameworks

#### `/src/services/` - Data Service Layer

**Purpose:** Abstract data fetching from components

**Key files:**
- `QuestDataService.ts` - Main data service implementation
- `questDataServiceFactory.ts` - Factory with auto-configuration
- `types.ts` - Service interfaces and types

**When to modify:**
- Adding new data sources
- Changing polling behavior
- Modifying data transformation logic

#### `/src/components/` - React Components

**Purpose:** Reusable UI components

**Structure:**
- Each component in its own directory
- Colocated styles and logic
- Props-based configuration

**When to modify:**
- Adding new UI components
- Updating component behavior
- Styling changes

#### `/src/pages/` - Page Components

**Purpose:** Top-level route pages

**Key pages:**
- `Quest.tsx` - Main quest map page
- `Login.tsx` - Authentication page

**When to modify:**
- Adding new pages/routes
- Changing page-level logic

#### `/src/hooks/` - Custom React Hooks

**Purpose:** Reusable React logic

**Key hooks:**
- `useQuestData.tsx` - Data fetching with polling
- Other custom hooks for shared logic

**When to modify:**
- Adding new shared React logic
- Creating reusable state management

#### `/src/assets/` - Visual Assets

**Purpose:** Images, SVGs, icons, and other static assets

**Structure:**
- `/map/` - Map SVGs
- `/steps/` - Step number images
- `/pointers/` - Colored pointer variants
- `/finish-screens/` - Finish screen images
- `/star/`, `/clouds/` - Animation assets

**When to modify:**
- Replacing visual assets
- Adding new images/icons

#### `/src/constants/` - Constants & Enums

**Purpose:** Application-wide constants and type definitions

**Key files:**
- `enums.ts` - Task names, user data keys, finish types
- `interfaces.ts` - TypeScript interfaces
- `localQuestPresets.ts` - Built-in local quest themes
- `uiAnimations.ts` - Empty animation fallback

**When to modify:**
- Adding new task types
- Updating data structure
- Defining new constants

### Module Dependencies

**Dependency flow (simplified):**
```
Components → Hooks → Services → External APIs
     ↓
  Domain Layer (independent)
```

**Key principles:**
- Components don't directly fetch data (use hooks)
- Hooks use services (not direct API calls)
- Domain layer has no UI dependencies
- Services can be swapped without changing components

---

## Common Issues & Troubleshooting

### Authentication Issues

#### Issue: Redirect Loop After Login

**Symptoms:**
- Browser keeps redirecting between `/login` and `/quest`
- Infinite redirect cycle
- Console errors about navigation

**Causes:**
- Auth state not fully loaded before redirecting
- Multiple components triggering redirects simultaneously

**Solutions:**

1. **Check environment variables:**
   ```bash
   # DEV mode
   VITE_DEV_MODE=true

   # or OIDC — both must be set
   VITE_DEV_MODE=false
   VITE_APP_AUTH_AUTHORITY=https://your-oidc.com
   VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
   ```

2. **Clear browser storage:**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

**Prevention:**
The current architecture prevents redirect loops by:
- Waiting for auth state resolution before redirecting
- Using ref guards to prevent duplicate sign-in attempts
- Using `replace: true` for navigation

#### Issue: "No Authority or MetadataUrl Configured"

**Symptoms:**
- Error screen on app startup
- Message about missing OIDC configuration

**Cause:**
OIDC mode is partially configured (only authority set, not redirect URI, or vice versa)

**Solution:**

**Option 1: Use DEV mode (recommended for development)**
```bash
VITE_DEV_MODE=true
```

**Option 2: Complete OIDC configuration**
```bash
VITE_DEV_MODE=false
VITE_APP_AUTH_AUTHORITY=https://your-oidc.com
VITE_APP_AUTH_REDIRECT_URI=http://localhost:3000
```

Restart dev server after changing `.env.local`.

### Data & Map Issues

#### Issue: Empty Map or No Users Visible

**Symptoms:**
- Map renders but no user pointers appear
- No avatars or progress indicators

**Possible causes:**

1. **No data loaded:**
   - Check browser console for fetch errors
   - Verify `/public/mock-quest-data.csv` exists
   - Check `VITE_GOOGLE_SHEET_URL` is correct

2. **Invalid data format:**
   - Email addresses must contain `@`
   - CSV must have required columns
   - Task columns must start with numbers

**Solutions:**

1. **Verify mock data exists:**
   ```bash
   ls public/mock-quest-data.csv
   ```

2. **Check browser console:**
   - Look for `[QuestDataService]` logs
   - Check for CSV parsing errors

3. **Validate CSV format:**
   ```csv
   Email Address,Full name,Social network points,1. Task list
   test@example.com,Test User,0,1
   ```

4. **Test with simple data:**
   - Replace CSV with minimal example
   - Add one user with one completed task
   - Verify it appears on map

#### Issue: Broken Avatars or Missing Assets

**Symptoms:**
- Missing step numbers
- No pointer images
- Broken map background

**Causes:**
- Asset import errors
- Wrong file paths in `uiConfig.ts`
- Missing asset files

**Solutions:**

1. **Check asset imports in `/src/config/uiConfig.ts`:**
   ```typescript
   // Verify imports resolve correctly
   import MapSvg from "../assets/map/Map.svg";
   ```

2. **Verify asset files exist:**
   ```bash
   ls src/assets/map/
   ls src/assets/steps/
   ls src/assets/pointers/
   ```

3. **Check browser console for 404 errors**

4. **Rebuild application:**
   ```bash
   npm run dev
   ```

### Build & Performance Issues

#### Issue: Build Fails

**Symptoms:**
- `npm run build` fails with TypeScript errors
- Build process stops with errors

**Solutions:**

1. **Check TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

2. **Fix type errors** in reported files

3. **Clean and rebuild:**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

#### Issue: Slow Development Server

**Symptoms:**
- Page loads slowly
- Hot reload is slow

**Solutions:**

1. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Check data polling interval:**
   - Default is 3 minutes
   - Reduce for development if needed (in `questDataServiceFactory.ts`)

### Data Polling Issues

#### Issue: Data Not Updating

**Symptoms:**
- User progress doesn't update
- Changes in Google Sheets not reflected

**Causes:**
- Polling not started
- Fetch errors
- CORS issues with Google Sheets

**Solutions:**

1. **Check polling is active:**
   - Browser console should show periodic fetch logs
   - Look for `[QuestDataService]` messages

2. **Verify Google Sheets URL:**
   ```bash
   # Must end with /export?format=csv
   VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../export?format=csv
   ```

3. **Check CORS configuration:**
   - Google Sheets must be publicly accessible
   - Or properly configured for CORS

4. **Test URL directly:**
   - Open `VITE_GOOGLE_SHEET_URL` in browser
   - Should download CSV file

### Environment Variable Issues

#### Issue: Environment Variables Not Working

**Symptoms:**
- Changes to `.env.local` have no effect
- Variables show as undefined

**Solutions:**

1. **Restart dev server** (required after changing `.env.local`):
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

2. **Verify variable names** start with `VITE_`:
   ```bash
   # ✅ Correct
   VITE_APP_AUTH_AUTHORITY=...
   
   # ❌ Wrong - won't work
   APP_AUTH_AUTHORITY=...
   ```

3. **Check file name** is exactly `.env.local` (not `.env` or `.env.development`)

4. **Verify file location** is in project root (same level as `package.json`)

---

## Advanced Topics

For detailed technical documentation, see the `/docs` folder:

### Detailed Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Layers, data sources, pairing with `backend/`
- **[Authentication](/docs/AUTHENTICATION.md)** - Dual-mode auth, OIDC, troubleshooting

### Development Workflow

**Typical development workflow:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Make changes** to components, config, or domain logic

3. **Test in browser** - Changes hot-reload automatically

4. **Run linter:**
   ```bash
   npm run lint
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Preview production build:**
   ```bash
   npm run preview
   ```

### Extending the Application

#### Adding a New Task

1. Update task enum in `/src/constants/enums.ts`:
   ```typescript
   export enum tasksEnum {
     // ... existing tasks
     newTask = "6. New Task Name",
   }
   ```

2. Add task position in `/src/config/uiConfig.ts`:
   ```typescript
   taskPositions: [
     // ... existing positions
     {
       taskTitle: tasksEnum.newTask,
       taskNumber: 6,
       cxPointers: 50,
       cyPointers: 50,
       cxStep: 51,
       cyStep: 60,
     },
   ]
   ```

3. Add step image to `/src/config/uiConfig.ts`:
   ```typescript
   steps: {
     images: [
       // ... existing steps
       sixthStep,
     ],
   }
   ```

4. Update CSV data structure:
   ```csv
   Email Address,...,6. New Task Name
   user@example.com,...,1
   ```

#### Adding a New Data Source

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and `src/services/providers/` for:
- Creating a custom data provider
- Wiring it in `questDataServiceFactory.ts`

#### Customizing Domain Logic

Quest rules live in `QuestEngine` (`src/domain/quest/QuestEngine.ts`) and thresholds in `src/config/quest.config.ts`. Do not reimplement counting or finish screens in map components.

### Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **react-oidc-context** - OIDC authentication
- **Framer Motion** - Animations
- **PapaParse** - CSV parsing
- **PrimeReact** - UI components
- **React Router** - Routing

### Scripts Reference

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production (outputs to /dist)
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm test             # Unit tests (Vitest)
npm run test:watch   # Vitest watch mode
```

Unit tests cover quest progress (`QuestEngine`), shipped config validation, and the API client (`apiRequest` / media URLs). Run them with `npm test`. Component/e2e tests and CI are not set up yet.

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2015+ support required
- No IE11 support

---

## Contributing

When contributing to this project:

1. Maintain the separation of concerns (UI, domain, services)
2. Keep domain logic independent of React
3. Use the service layer for data access
4. Update documentation when adding features
5. Test in both DEV and OIDC modes
6. Ensure changes work with mock and real data sources

---

## License

[Add your license information here]

---

## Support

For issues, questions, or contributions:
- Open an issue in the repository
- Review documentation in `/docs` folder
- Check troubleshooting section above

---

**Happy Questing! 🎯**
