import { logger } from "../utils/logger";
import { isBuiltInLocalQuestPreset } from "../constants/localQuestPresets";
import { UIConfigJSON, validateUIConfig, logValidationResults, } from "./uiConfigSchema";
export interface UIConfigLoadResult {
    config: UIConfigJSON | null;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    source: "file" | "default" | "error";
}
export async function loadUIConfig(configKey: string): Promise<UIConfigLoadResult> {
    try {
        const builtInPreset = isBuiltInLocalQuestPreset(configKey);
        if (!builtInPreset) {
        try {
            const { loadThemeFromIndexedDB } = await import("../utils/indexedDBStorage");
            const indexedDBTheme = await loadThemeFromIndexedDB(configKey);
            if (indexedDBTheme) {
                const customConfig = indexedDBTheme.config as UIConfigJSON;
                logger.info("UIConfigLoader", `Loaded config from IndexedDB for "${configKey}"`, {
                    hasBackground: !!indexedDBTheme.backgroundDataURL,
                    hasMap: !!indexedDBTheme.mapDataURL,
                    configMapSvg: customConfig.map?.mapSvg,
                });
                if (indexedDBTheme.backgroundDataURL) {
                    customConfig.map.background = indexedDBTheme.backgroundDataURL;
                }
                if (indexedDBTheme.mapDataURL) {
                    customConfig.map.mapSvg = indexedDBTheme.mapDataURL;
                    logger.info("UIConfigLoader", `Using map from IndexedDB blob for "${configKey}"`);
                }
                else {
                    logger.info("UIConfigLoader", `Using map from config for "${configKey}": ${customConfig.map?.mapSvg || "empty"}`);
                    if (!customConfig.map?.mapSvg) {
                        customConfig.map.mapSvg = "";
                    }
                }
                logger.info("UIConfigLoader", `Loading custom UI config from IndexedDB: ${configKey}`);
                const validation = validateUIConfig(customConfig);
                logValidationResults(validation, configKey);
                try {
                    const { loadConfigEdits, mergeConfigWithEdits } = await import("../utils/localStorageConfig");
                    const savedEdits = loadConfigEdits(configKey);
                    if (savedEdits) {
                        logger.info("UIConfigLoader", `Found saved edits for "${configKey}" in localStorage, merging with IndexedDB config`);
                        const mergedConfig = mergeConfigWithEdits(customConfig, savedEdits, configKey);
                        const savedValidation = validateUIConfig(mergedConfig);
                        if (savedValidation.isValid) {
                            return {
                                config: mergedConfig,
                                isValid: true,
                                errors: [],
                                warnings: savedValidation.warnings.map((w) => w.message),
                                source: "default",
                            };
                        }
                        else {
                            logger.warn("UIConfigLoader", `Merged config for "${configKey}" has validation errors, using IndexedDB config`);
                        }
                    }
                }
                catch (storageError) {
                    logger.warn("UIConfigLoader", `Failed to load saved edits for "${configKey}":`, storageError);
                }
                if (validation.isValid) {
                    return {
                        config: customConfig,
                        isValid: true,
                        errors: [],
                        warnings: validation.warnings.map((w) => w.message),
                        source: "default",
                    };
                }
                else {
                    logger.warn("UIConfigLoader", `IndexedDB config "${configKey}" has validation errors, but using it anyway`);
                    return {
                        config: customConfig,
                        isValid: false,
                        errors: validation.errors.map((e) => e.message),
                        warnings: validation.warnings.map((w) => w.message),
                        source: "default",
                    };
                }
            }
        }
        catch (indexedDBError) {
            logger.warn("UIConfigLoader", `Failed to load from IndexedDB: ${indexedDBError}`);
        }
        const customThemeKey = `uiConfig:${configKey}`;
        const customThemeData = localStorage.getItem(customThemeKey);
        if (customThemeData) {
            try {
                const customConfig = JSON.parse(customThemeData) as UIConfigJSON;
                logger.info("UIConfigLoader", `Loading custom UI config from localStorage: ${configKey}`);
                try {
                    const { loadConfigEdits, mergeConfigWithEdits } = await import("../utils/localStorageConfig");
                    const savedEdits = loadConfigEdits(configKey);
                    if (savedEdits) {
                        logger.info("UIConfigLoader", `Found saved edits for "${configKey}" in localStorage, merging with custom theme config`);
                        const mergedConfig = mergeConfigWithEdits(customConfig, savedEdits);
                        if (!mergedConfig.map.background && customConfig.map.background) {
                            mergedConfig.map.background = customConfig.map.background;
                        }
                        if (!mergedConfig.map.mapSvg && customConfig.map.mapSvg) {
                            mergedConfig.map.mapSvg = customConfig.map.mapSvg;
                        }
                        const mergedValidation = validateUIConfig(mergedConfig);
                        if (mergedValidation.isValid) {
                            return {
                                config: mergedConfig,
                                isValid: true,
                                errors: [],
                                warnings: mergedValidation.warnings.map((w) => w.message),
                                source: "default",
                            };
                        }
                        else {
                            logger.warn("UIConfigLoader", `Merged config for "${configKey}" has validation errors, using custom theme config`);
                        }
                    }
                }
                catch (storageError) {
                    logger.warn("UIConfigLoader", `Failed to load saved edits for "${configKey}":`, storageError);
                }
                const validation = validateUIConfig(customConfig);
                logValidationResults(validation, configKey);
                if (!validation.isValid) {
                    logger.error("UIConfigLoader", `Custom config "${configKey}" is invalid, falling back to file`);
                }
                else {
                    return {
                        config: customConfig,
                        isValid: true,
                        errors: [],
                        warnings: validation.warnings.map((w) => w.message),
                        source: "default",
                    };
                }
            }
            catch (parseError) {
                logger.warn("UIConfigLoader", `Failed to parse custom config from localStorage: ${parseError}`);
            }
        }
        }
        const configUrl = `/ui-configs/${configKey}.json`;
        logger.info("UIConfigLoader", `Loading UI config from: ${configUrl}`);
        const response = await fetch(configUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
                throw new Error(`Received HTML instead of JSON. The config file may not exist at ${configUrl}`);
            }
            throw new Error(`Invalid content type: ${contentType}. Expected application/json`);
        }
        const jsonData = await response.json();
        const validation = validateUIConfig(jsonData);
        logValidationResults(validation, configKey);
        if (!validation.isValid) {
            logger.error("UIConfigLoader", `Loaded config "${configKey}" is invalid, falling back to default`);
            if (configKey !== "default") {
                return await loadDefaultUIConfig();
            }
            return {
                config: null,
                isValid: false,
                errors: validation.errors.map((e) => e.message),
                warnings: validation.warnings.map((w) => w.message),
                source: "error",
            };
        }
        const baseConfig = jsonData as UIConfigJSON;
        try {
            const { loadConfigEdits, mergeConfigWithEdits } = await import("../utils/localStorageConfig");
            const savedEdits = loadConfigEdits(configKey);
            if (savedEdits) {
                logger.info("UIConfigLoader", `Found saved edits for "${configKey}", merging with base config`);
                const mergedConfig = mergeConfigWithEdits(baseConfig, savedEdits, configKey);
                if (!builtInPreset) {
                    if (!mergedConfig.map.background && baseConfig.map.background) {
                        mergedConfig.map.background = baseConfig.map.background;
                    }
                    if (!mergedConfig.map.mapSvg && baseConfig.map.mapSvg) {
                        mergedConfig.map.mapSvg = baseConfig.map.mapSvg;
                    }
                }
                const mergedValidation = validateUIConfig(mergedConfig);
                if (mergedValidation.isValid) {
                    logger.info("UIConfigLoader", `Successfully merged base config with saved edits for "${configKey}"`);
                    return {
                        config: mergedConfig,
                        isValid: true,
                        errors: [],
                        warnings: [...validation.warnings, ...mergedValidation.warnings].map((w) => w.message),
                        source: "file",
                    };
                }
                else {
                    logger.warn("UIConfigLoader", `Merged config for "${configKey}" has validation errors, using base config`);
                }
            }
        }
        catch (storageError) {
            logger.warn("UIConfigLoader", `Failed to load saved edits for "${configKey}":`, storageError);
        }
        logger.info("UIConfigLoader", `Successfully loaded UI config: ${configKey}`);
        return {
            config: baseConfig,
            isValid: true,
            errors: [],
            warnings: validation.warnings.map((w) => w.message),
            source: "file",
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("UIConfigLoader", `Failed to load UI config "${configKey}": ${errorMessage}`);
        if (configKey !== "default") {
            logger.info("UIConfigLoader", "Attempting to load default config as fallback");
            return await loadDefaultUIConfig();
        }
        return {
            config: null,
            isValid: false,
            errors: [`Failed to load config: ${errorMessage}`],
            warnings: [],
            source: "error",
        };
    }
}
export async function loadDefaultUIConfig(): Promise<UIConfigLoadResult> {
    return await loadUIConfig("default");
}
let lastLoggedKey: string | null = null;
export function getUIConfigKey(): string {
    const urlParams = new URLSearchParams(window.location.search);
    const urlConfigKey = urlParams.get("ui");
    if (urlConfigKey) {
        if (urlConfigKey !== lastLoggedKey) {
            logger.info("UIConfigLoader", `UI config key from URL: ${urlConfigKey}`);
            lastLoggedKey = urlConfigKey;
        }
        localStorage.setItem("uiConfig", urlConfigKey);
        return urlConfigKey;
    }
    const storedConfigKey = localStorage.getItem("uiConfig");
    if (storedConfigKey) {
        if (storedConfigKey !== lastLoggedKey) {
            logger.info("UIConfigLoader", `UI config key from localStorage: ${storedConfigKey}`);
            lastLoggedKey = storedConfigKey;
        }
        return storedConfigKey;
    }
    if ("default" !== lastLoggedKey) {
        logger.info("UIConfigLoader", "Using default UI config key");
        lastLoggedKey = "default";
    }
    return "default";
}
export function setUIConfigKey(configKey: string, updateUrl: boolean = false): void {
    localStorage.setItem("uiConfig", configKey);
    logger.info("UIConfigLoader", `Set UI config key to: ${configKey}`);
    if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set("ui", configKey);
        url.searchParams.delete("quest");
        window.history.replaceState({}, "", url.toString());
        logger.info("UIConfigLoader", `Updated URL with UI config key: ${configKey}`);
    }
}
function calculatePointerPosition(cxStep: number, cyStep: number): {
    cxPointers: number;
    cyPointers: number;
} {
    const cxPointers = cxStep;
    const POINTER_OFFSET_ABOVE_STEP = 11;
    const cyPointers = Math.max(0, cyStep - POINTER_OFFSET_ABOVE_STEP);
    return { cxPointers, cyPointers };
}
export function convertUIConfigJSON(json: UIConfigJSON) {
    return {
        name: json.name,
        map: {
            background: json.map.background,
            mapSvg: json.map.mapSvg,
            width: json.map.width || "100%",
            height: json.map.height || "100%",
        },
        steps: {
            images: json.steps.map((step) => step.icon),
            positions: json.steps.map((step) => {
                const pointerPos = step.cxPointers !== undefined && step.cyPointers !== undefined
                    ? { cxPointers: step.cxPointers, cyPointers: step.cyPointers }
                    : calculatePointerPosition(step.cxStep, step.cyStep);
                return {
                    taskNumber: step.taskNumber,
                    label: step.label,
                    cxPointers: pointerPos.cxPointers,
                    cyPointers: pointerPos.cyPointers,
                    cxStep: step.cxStep,
                    cyStep: step.cyStep,
                    color: step.color,
                    size: step.size,
                };
            }),
            shadow: {
                green: json.theme.stepShadow.green,
                purple: json.theme.stepShadow.purple,
                greenThreshold: json.theme.stepShadow.greenThreshold,
            },
        },
        theme: {
            palette: json.theme.palette,
        },
        pointers: {
            maxVisibleInTooltip: json.theme.pointerStyle.maxVisibleInTooltip,
            maxBeforeModal: json.theme.pointerStyle.maxBeforeModal,
            colors: json.theme.pointerStyle.colors,
        },
        animations: json.animations || {
            stars: [],
            clouds: [],
            character: null,
        },
        finishScreens: json.finishScreens,
    };
}
