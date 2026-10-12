# Domain layer

Pure TypeScript quest rules. No React, no `fetch`, no `localStorage`.

## Layout

- `quest/QuestEngine.ts` — progress, visibility, grouping, finish screens
- `quest/types.ts` — domain aliases over `src/constants` row/map types
- `index.ts` — re-exports `questEngine`

Avatar URLs are built inside `QuestEngine` (`https://api.employee.leobit.co/photos-small/{id}.png`).

## Usage

```typescript
import { questEngine } from "../domain";

const users = questEngine.evaluateAllUsersProgress(jsonData);
const positions = questEngine.groupUsersByPosition(users, loggedUserId, taskPositions);
```

Change counting, finish thresholds, or grouping here — not in map components. Thresholds that are data live in `src/config/quest.config.ts`.
