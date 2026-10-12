# UI Configuration Files

This directory contains UI configuration files that define the visual appearance of the application.

## File Structure

Each UI config is a JSON file that defines:
- Map background and SVG
- Step positions and icons
- Theme colors and styles
- Animation configurations
- Finish screen assets

## Asset Paths

Asset paths in JSON configs must reference files in one of two ways:

1. **Public folder**: Place assets in `/public` and reference them with paths like `/assets/mymap.svg`
2. **External URLs**: Use absolute URLs like `https://example.com/assets/mymap.svg`

**Note**: The default config uses assets from `/src/assets` which are bundled by Vite. External JSON configs cannot reference these bundled assets directly.

## Example Config Structure

```json
{
  "name": "My Custom Theme",
  "map": {
    "background": "/assets/backgrounds/my-background.svg",
    "mapSvg": "/assets/maps/my-map.svg"
  },
  "steps": [
    {
      "taskNumber": 0,
      "cxPointers": 15.8,
      "cyPointers": 21,
      "cxStep": 16.5,
      "cyStep": 32.5,
      "icon": "/assets/steps/step-0.svg"
    }
  ],
  "theme": {
    "palette": {
      "primary": "#6366F1",
      "secondary": "#8B5CF6",
      "accent": "#EC4899"
    }
  }
}
```

## Loading Custom Configs

### Via URL Parameter
Add `?ui=myconfig` to the URL (loads `/ui-configs/myconfig.json`)

### Via localStorage
The selected config is saved to localStorage automatically

### Programmatically
```javascript
import { useUIConfig } from './context/UIConfigContext';

const { switchConfig } = useUIConfig();
await switchConfig('myconfig');
```

## Validation

All configs are validated against the schema defined in `src/services/uiConfigSchema.ts`.

Required fields:
- `name`: string
- `map.background`: string
- `map.mapSvg`: string
- `steps`: array (at least one step with coordinates 0-100)
- `theme.palette.primary`: string
- `theme.palette.secondary`: string
- `theme.palette.accent`: string
- `theme.pointerStyle.colors`: array
- `finishScreens.finish`: string
- `finishScreens.dzen`: string
