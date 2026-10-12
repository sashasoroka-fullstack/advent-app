# MapRenderer Component

## Overview

`MapRenderer` is a pure, configuration-driven map rendering component that is completely independent of quest-specific logic, task order, or finish rules.

## Purpose

This component was created to make the map UI reusable and configuration-driven. It separates the **pure rendering logic** from **quest-specific business logic**.

### What MapRenderer Knows

- How to render a map image
- How to position elements at specified coordinates
- How to show/hide loading states
- How to render children and overlays

### What MapRenderer Does NOT Know

- ❌ Task count or task order
- ❌ Quest rules or finish logic
- ❌ User authentication or data fetching
- ❌ Specific quest implementation details

## Usage

### Basic Example

```tsx
import { MapRenderer } from "./components/MapRenderer";

const MyMap = () => {
  const positions = [
    { id: 0, cxPointers: 15, cyPointers: 20, cxStep: 16, cyStep: 30 },
    { id: 1, cxPointers: 25, cyPointers: 35, cxStep: 26, cyStep: 45 },
  ];

  return (
    <MapRenderer
      mapImage="/path/to/map.svg"
      positions={positions}
      renderAtPointers={({ position, index }) => (
        <div>User pointers at position {index}</div>
      )}
      renderAtSteps={({ position, index }) => (
        <div>Step marker at position {index}</div>
      )}
    >
      {/* Optional decorative elements */}
      <Stars />
      <Clouds />
    </MapRenderer>
  );
};
```

### Advanced Example with All Props

```tsx
<MapRenderer
  mapImage={uiConfig.map.mapSvg}
  positions={positions}
  loading={isLoading}
  loadingIndicator={<CustomSpinner />}
  overlayContent={<FinishScreen />}
  renderAtPointers={({ position, index }) => (
    <UserPointers position={position} />
  )}
  renderAtSteps={({ position, index }) => (
    <StepMarker position={position} />
  )}
>
  <Stars />
  <Clouds />
  <Character />
</MapRenderer>
```

## Props

### MapRendererProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mapImage` | `string` | Yes | Map image/SVG source path |
| `positions` | `MapPosition[]` | Yes | Array of position configurations |
| `loading` | `boolean` | No | Loading state (default: false) |
| `children` | `ReactNode` | No | Children to render over map (e.g., animations) |
| `overlayContent` | `ReactNode` | No | Content to render as overlay (e.g., finish screens) |
| `loadingIndicator` | `ReactNode` | No | Custom loading indicator component |
| `renderAtPointers` | `(props: PositionRenderProps) => ReactNode` | No | Callback to render content at pointer positions |
| `renderAtSteps` | `(props: PositionRenderProps) => ReactNode` | No | Callback to render content at step positions |

### MapPosition

```typescript
interface MapPosition {
  id: string | number;      // Unique identifier
  cxPointers: number;       // X coordinate for pointers (%)
  cyPointers: number;       // Y coordinate for pointers (%)
  cxStep: number;           // X coordinate for step marker (%)
  cyStep: number;           // Y coordinate for step marker (%)
}
```

### PositionRenderProps

```typescript
interface PositionRenderProps {
  position: MapPosition;    // Position configuration
  index: number;            // Index in positions array
}
```

## Integration with Quest Logic

The quest-specific wrapper component (e.g., `SVGMap`) handles:

1. **Data transformation** - Converting quest data to `MapPosition` format
2. **Quest rules** - Finish screen logic, user filtering, task evaluation
3. **Business logic** - Authentication, data fetching, user progress
4. **Interactivity** - Hover states, modals, click handlers

Example integration:

```tsx
// Quest-specific wrapper (SVGMap)
export const SVGMap: FC<IProps> = ({ tableData, setIsGameButtonVisible }) => {
  // Quest-specific state and logic
  const [finishScreenType, setFinishScreenType] = useState("");
  const { loading } = useLoading();

  // Transform quest data to generic positions
  const positions: MapPosition[] = tableData
    ? tableData.map((group) => ({
        id: `${group.taskNumber}`,
        cxPointers: group.cxPointers,
        cyPointers: group.cyPointers,
        cxStep: group.cxStep,
        cyStep: group.cyStep,
      }))
    : [];

  return (
    <MapRenderer
      mapImage={uiConfig.map.mapSvg}
      positions={positions}
      loading={loading}
      overlayContent={
        finishScreenType ? <FinishScreen type={finishScreenType} /> : undefined
      }
      renderAtPointers={({ index }) => {
        const group = tableData[index];
        return <StackedPointers group={group} />;
      }}
      renderAtSteps={({ index }) => {
        const group = tableData[index];
        return <Step group={group} />;
      }}
    >
      <Stars />
      <Clouds />
      <Girl />
    </MapRenderer>
  );
};
```

## Benefits

### 1. Reusability
- Can be used for any quest or map-based application
- No coupling to specific quest implementation
- Easy to swap maps and assets

### 2. Configurability
- All visual elements controlled via props
- No hardcoded quest logic
- Easy to customize rendering behavior

### 3. Testability
- Pure component with clear inputs/outputs
- Easy to test in isolation
- No dependencies on external services

### 4. Maintainability
- Clear separation of concerns
- Quest logic stays in quest wrapper
- Rendering logic stays in MapRenderer

## Architecture

```
┌─────────────────────────────────────┐
│   Quest Page (quest.tsx)           │
│   - Data fetching                   │
│   - User authentication            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   SVGMap (Quest Wrapper)            │
│   - Quest-specific logic            │
│   - Finish screens                  │
│   - User filtering                  │
│   - Data transformation             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MapRenderer (Pure Component)      │
│   - Map rendering                   │
│   - Position-based layout           │
│   - Loading states                  │
│   - Children composition            │
└─────────────────────────────────────┘
```

## Future Enhancements

Potential improvements for MapRenderer:

1. **Touch/mobile support** - Better touch interactions
2. **Zoom/pan** - Interactive map navigation
3. **Accessibility** - ARIA labels and keyboard navigation
4. **Performance** - Virtual scrolling for many positions
5. **Animations** - Built-in transition support

## Related Components

- `SVGMap` - Quest-specific wrapper using MapRenderer
- `Step` - Renders step markers at positions
- `StackedPointers` - Renders user pointers at positions
- `Stars`, `Clouds`, `Girl` - Decorative animation components

## See Also

- [Architecture](../../docs/ARCHITECTURE.md)
- [Quest Configuration](../config/quest.config.ts)
- [UI Configuration](../config/uiConfig.ts)
