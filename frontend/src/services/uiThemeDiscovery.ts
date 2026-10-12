import { logger } from "../utils/logger";
export interface UIThemeInfo {
    name: string;
    displayTitle: string;
    path: string;
}
export function discoverAvailableUIThemes(): UIThemeInfo[] {
    const knownThemes: Array<{
        name: string;
        displayTitle: string;
    }> = [
        { name: "default", displayTitle: "Default Well Being Quest" },
        { name: "space-adventure", displayTitle: "Space Adventure Quest" },
    ];
    const themes: UIThemeInfo[] = knownThemes.map(theme => ({
        name: theme.name,
        displayTitle: theme.displayTitle,
        path: `/ui-configs/${theme.name}.json`,
    }));
    logger.info("UIThemeDiscovery", `Discovered ${themes.length} UI themes`);
    return themes;
}
export function getThemeByName(name: string, themes?: UIThemeInfo[]): UIThemeInfo | undefined {
    const availableThemes = themes || discoverAvailableUIThemes();
    return availableThemes.find(theme => theme.name === name);
}
export function isValidThemeName(name: string, themes?: UIThemeInfo[]): boolean {
    const availableThemes = themes || discoverAvailableUIThemes();
    return availableThemes.some(theme => theme.name === name);
}
