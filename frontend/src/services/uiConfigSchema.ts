import { logger } from "../utils/logger";
export interface UIConfigValidationError {
    field: string;
    message: string;
    severity: "error" | "warning";
}
export interface UIConfigValidationResult {
    isValid: boolean;
    errors: UIConfigValidationError[];
    warnings: UIConfigValidationError[];
}
export interface UIStepConfig {
    taskNumber: number;
    label?: string;
    cxPointers?: number;
    cyPointers?: number;
    cxStep: number;
    cyStep: number;
    icon: string;
    color?: string;
    size?: string;
    apiStepId?: number;
}
export interface UIStarConfig {
    top: string;
    left: string;
    height: string;
    width: string;
    duration: number;
    image: string;
}
export interface UICloudConfig {
    top: string;
    left: string;
    height: string;
    width: string;
    duration: number;
    translateFrom: string;
    translateTo: string;
    image: string;
}
export interface UICharacterConfig {
    enabled: boolean;
    image: string;
    shadow: string;
    position: {
        left: string;
        top: string;
        height: string;
    };
    shadowPosition: {
        left: string;
        top: string;
        height: string;
    };
    animation: {
        translateFrom: string;
        translateTo: string;
        duration: number;
    };
    shadowAnimation: {
        scaleFrom: number;
        scaleTo: number;
        duration: number;
    };
}
export interface UIPointerColorConfig {
    name: string;
    icons: string[];
}
export interface UIConfigJSON {
    name: string;
    map: {
        background: string;
        mapSvg: string;
        width?: string;
        height?: string;
    };
    steps: UIStepConfig[];
    theme: {
        palette: {
            primary: string;
            secondary: string;
            accent: string;
        };
        pointerStyle: {
            maxVisibleInTooltip: number;
            maxBeforeModal: number;
            colors: UIPointerColorConfig[];
        };
        stepShadow: {
            green: string;
            purple: string;
            greenThreshold: number;
        };
    };
    animations?: {
        stars?: UIStarConfig[];
        clouds?: UICloudConfig[];
        character?: UICharacterConfig;
    };
    finishScreens: {
        finish: string;
        dzen: string;
    };
    googleSheetUrl?: string;
}
export function validateUIConfig(config: unknown): UIConfigValidationResult {
    const errors: UIConfigValidationError[] = [];
    const warnings: UIConfigValidationError[] = [];
    if (!config || typeof config !== "object") {
        errors.push({
            field: "root",
            message: "UI config must be an object",
            severity: "error",
        });
        return { isValid: false, errors, warnings };
    }
    const cfg = config as Partial<UIConfigJSON>;
    if (!cfg.name || typeof cfg.name !== "string") {
        errors.push({
            field: "name",
            message: "UI config must have a name (string)",
            severity: "error",
        });
    }
    if (!cfg.map || typeof cfg.map !== "object") {
        errors.push({
            field: "map",
            message: "UI config must have a map object",
            severity: "error",
        });
    }
    else {
        if (!cfg.map.background || typeof cfg.map.background !== "string") {
            errors.push({
                field: "map.background",
                message: "map.background is required (string)",
                severity: "error",
            });
        }
        if (cfg.map.mapSvg !== undefined && typeof cfg.map.mapSvg !== "string") {
            errors.push({
                field: "map.mapSvg",
                message: "map.mapSvg must be a string if provided",
                severity: "error",
            });
        }
    }
    if (!cfg.steps || !Array.isArray(cfg.steps)) {
        errors.push({
            field: "steps",
            message: "UI config must have a steps array",
            severity: "error",
        });
    }
    else {
        if (cfg.steps.length === 0) {
            warnings.push({
                field: "steps",
                message: "Steps array is empty. You can add steps manually using the Steps Management section.",
                severity: "warning",
            });
        }
        cfg.steps.forEach((step, index) => {
            if (typeof step.taskNumber !== "number") {
                errors.push({
                    field: `steps[${index}].taskNumber`,
                    message: "taskNumber must be a number",
                    severity: "error",
                });
            }
            if (step.cxPointers !== undefined) {
                if (typeof step.cxPointers !== "number" || step.cxPointers < 0 || step.cxPointers > 100) {
                    warnings.push({
                        field: `steps[${index}].cxPointers`,
                        message: "cxPointers is deprecated and will be auto-calculated from cxStep. Value must be a number between 0 and 100 if provided.",
                        severity: "warning",
                    });
                }
            }
            if (step.cyPointers !== undefined) {
                if (typeof step.cyPointers !== "number" || step.cyPointers < 0 || step.cyPointers > 100) {
                    warnings.push({
                        field: `steps[${index}].cyPointers`,
                        message: "cyPointers is deprecated and will be auto-calculated from cyStep. Value must be a number between 0 and 100 if provided.",
                        severity: "warning",
                    });
                }
            }
            if (typeof step.cxStep !== "number" || step.cxStep < 0 || step.cxStep > 100) {
                errors.push({
                    field: `steps[${index}].cxStep`,
                    message: "cxStep must be a number between 0 and 100",
                    severity: "error",
                });
            }
            if (typeof step.cyStep !== "number" || step.cyStep < 0 || step.cyStep > 100) {
                errors.push({
                    field: `steps[${index}].cyStep`,
                    message: "cyStep must be a number between 0 and 100",
                    severity: "error",
                });
            }
            if (!step.icon || typeof step.icon !== "string") {
                errors.push({
                    field: `steps[${index}].icon`,
                    message: "icon must be a string",
                    severity: "error",
                });
            }
        });
    }
    if (!cfg.theme || typeof cfg.theme !== "object") {
        errors.push({
            field: "theme",
            message: "UI config must have a theme object",
            severity: "error",
        });
    }
    else {
        if (!cfg.theme.palette || typeof cfg.theme.palette !== "object") {
            errors.push({
                field: "theme.palette",
                message: "theme must have a palette object",
                severity: "error",
            });
        }
        else {
            if (!cfg.theme.palette.primary || typeof cfg.theme.palette.primary !== "string") {
                errors.push({
                    field: "theme.palette.primary",
                    message: "theme.palette.primary is required (string)",
                    severity: "error",
                });
            }
            if (!cfg.theme.palette.secondary || typeof cfg.theme.palette.secondary !== "string") {
                errors.push({
                    field: "theme.palette.secondary",
                    message: "theme.palette.secondary is required (string)",
                    severity: "error",
                });
            }
            if (!cfg.theme.palette.accent || typeof cfg.theme.palette.accent !== "string") {
                errors.push({
                    field: "theme.palette.accent",
                    message: "theme.palette.accent is required (string)",
                    severity: "error",
                });
            }
        }
        if (!cfg.theme.pointerStyle || typeof cfg.theme.pointerStyle !== "object") {
            errors.push({
                field: "theme.pointerStyle",
                message: "theme must have a pointerStyle object",
                severity: "error",
            });
        }
        else {
            if (!cfg.theme.pointerStyle.colors || !Array.isArray(cfg.theme.pointerStyle.colors)) {
                errors.push({
                    field: "theme.pointerStyle.colors",
                    message: "theme.pointerStyle.colors must be an array",
                    severity: "error",
                });
            }
        }
        if (!cfg.theme.stepShadow || typeof cfg.theme.stepShadow !== "object") {
            errors.push({
                field: "theme.stepShadow",
                message: "theme must have a stepShadow object",
                severity: "error",
            });
        }
    }
    if (!cfg.finishScreens || typeof cfg.finishScreens !== "object") {
        errors.push({
            field: "finishScreens",
            message: "UI config must have a finishScreens object",
            severity: "error",
        });
    }
    else {
        if (!cfg.finishScreens.finish || typeof cfg.finishScreens.finish !== "string") {
            errors.push({
                field: "finishScreens.finish",
                message: "finishScreens.finish is required (string)",
                severity: "error",
            });
        }
        if (!cfg.finishScreens.dzen || typeof cfg.finishScreens.dzen !== "string") {
            errors.push({
                field: "finishScreens.dzen",
                message: "finishScreens.dzen is required (string)",
                severity: "error",
            });
        }
    }
    if (cfg.animations) {
        if (typeof cfg.animations !== "object") {
            warnings.push({
                field: "animations",
                message: "animations should be an object if provided",
                severity: "warning",
            });
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
export function logValidationResults(result: UIConfigValidationResult, configName: string): void {
    if (result.warnings.length > 0) {
        logger.warn("UIConfigValidator", `Validation warnings for ${configName}:`, result.warnings);
    }
    if (!result.isValid) {
        logger.error("UIConfigValidator", `Validation failed for ${configName}:`, result.errors);
    }
    else {
        logger.info("UIConfigValidator", `Successfully validated ${configName}`);
    }
}
