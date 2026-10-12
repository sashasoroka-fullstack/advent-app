import { logger } from "./logger";
import { UIConfigJSON } from "../services/uiConfigSchema";
import { isBuiltInLocalQuestPreset } from "../constants/localQuestPresets";
const STORAGE_PREFIX = "questConfigEdits:";
function getStorageKey(configKey: string): string {
    return `${STORAGE_PREFIX}${configKey}`;
}
export function saveConfigEdits(configKey: string, config: UIConfigJSON): void {
    try {
        if (!configKey) {
            logger.error("LocalStorageConfig", "Cannot save config: configKey is empty");
            return;
        }
        if (!config) {
            logger.error("LocalStorageConfig", `Cannot save config for "${configKey}": config is null or undefined`);
            return;
        }
        const storageKey = getStorageKey(configKey);
        const mapForStorage = isBuiltInLocalQuestPreset(configKey)
            ? undefined
            : {
                ...config.map,
                background: config.map.background?.startsWith("data:") ? "" : config.map.background,
                mapSvg: config.map.mapSvg?.startsWith("data:") ? "" : config.map.mapSvg,
            };
        const { map: _mapOmitted, ...configWithoutMap } = config;
        const lightweightConfig: UIConfigJSON = isBuiltInLocalQuestPreset(configKey)
            ? (configWithoutMap as UIConfigJSON)
            : {
                ...config,
                map: mapForStorage!,
            };
        let configString: string;
        try {
            configString = JSON.stringify(lightweightConfig);
        }
        catch (stringifyError) {
            logger.error("LocalStorageConfig", `Failed to stringify config for "${configKey}":`, stringifyError);
            return;
        }
        const maxSize = 4 * 1024 * 1024;
        if (configString.length > maxSize) {
            logger.warn("LocalStorageConfig", `Config for "${configKey}" is too large (${configString.length} bytes), not saving to localStorage`);
            return;
        }
        try {
            localStorage.setItem(storageKey, configString);
        }
        catch (setItemError) {
            logger.error("LocalStorageConfig", `localStorage.setItem failed for "${configKey}":`, setItemError);
            throw setItemError;
        }
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            logger.error("LocalStorageConfig", `Failed to verify save for "${configKey}" - data not found in localStorage after save`);
        }
    }
    catch (error) {
        if (error instanceof Error && error.name === "QuotaExceededError") {
            logger.warn("LocalStorageConfig", `Storage quota exceeded for "${configKey}", config edits not saved`);
        }
        else {
            logger.error("LocalStorageConfig", `Failed to save config edits for "${configKey}":`, error);
        }
    }
}
export function loadConfigEdits(configKey: string): UIConfigJSON | null {
    try {
        const storageKey = getStorageKey(configKey);
        const savedData = localStorage.getItem(storageKey);
        if (!savedData) {
            return null;
        }
        const config = JSON.parse(savedData) as UIConfigJSON;
        return config;
    }
    catch (error) {
        logger.error("LocalStorageConfig", `Failed to load config edits for "${configKey}":`, error);
        return null;
    }
}
export function clearConfigEdits(configKey: string): void {
    try {
        const storageKey = getStorageKey(configKey);
        localStorage.removeItem(storageKey);
        logger.info("LocalStorageConfig", `Cleared config edits for "${configKey}"`);
    }
    catch (error) {
        logger.error("LocalStorageConfig", `Failed to clear config edits for "${configKey}":`, error);
    }
}
export function mergeConfigWithEdits(baseConfig: UIConfigJSON, savedEdits: UIConfigJSON, configKey?: string): UIConfigJSON {
    const mergedSteps = savedEdits.steps !== undefined ? savedEdits.steps : baseConfig.steps;
    const preserveOfficialMap = configKey !== undefined && isBuiltInLocalQuestPreset(configKey);
    return {
        ...baseConfig,
        ...savedEdits,
        map: preserveOfficialMap
            ? { ...baseConfig.map }
            : {
                ...baseConfig.map,
                ...savedEdits.map,
            },
        steps: mergedSteps,
        theme: {
            ...baseConfig.theme,
            ...savedEdits.theme,
            palette: {
                ...baseConfig.theme.palette,
                ...savedEdits.theme.palette,
            },
            pointerStyle: {
                ...baseConfig.theme.pointerStyle,
                ...savedEdits.theme.pointerStyle,
            },
            stepShadow: {
                ...baseConfig.theme.stepShadow,
                ...savedEdits.theme.stepShadow,
            },
        },
        animations: {
            ...baseConfig.animations,
            ...savedEdits.animations,
        },
        finishScreens: {
            ...baseConfig.finishScreens,
            ...savedEdits.finishScreens,
        },
    };
}
