import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { logger } from "../utils/logger";
import { loadUIConfig, getUIConfigKey, setUIConfigKey, convertUIConfigJSON, } from "../services/uiConfigLoader";
import { UIConfigJSON } from "../services/uiConfigSchema";
interface UIConfigContextType {
    uiConfig: ReturnType<typeof convertUIConfigJSON> | null;
    uiConfigRaw: UIConfigJSON | null;
    isLoading: boolean;
    error: string | null;
    configKey: string;
    switchConfig: (newConfigKey: string) => Promise<void>;
    reloadConfig: () => Promise<void>;
    applyConfig: (config: UIConfigJSON) => void;
}
const UIConfigContext = createContext<UIConfigContextType | undefined>(undefined);
interface UIConfigProviderProps {
    children: ReactNode;
}
export const UIConfigProvider: React.FC<UIConfigProviderProps> = ({ children }) => {
    const [uiConfig, setUIConfig] = useState<ReturnType<typeof convertUIConfigJSON> | null>(null);
    const [uiConfigRaw, setUIConfigRaw] = useState<UIConfigJSON | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [configKey, setConfigKey] = useState<string>(getUIConfigKey());
    const loadConfig = async (key: string) => {
        setIsLoading(true);
        setError(null);
        try {
            logger.info("UIConfigContext", `Loading UI config: ${key}`);
            const result = await loadUIConfig(key);
            if (!result.config) {
                const errorMsg = result.errors.join(", ") || "UI config not found";
                setError(errorMsg);
                logger.error("UIConfigContext", `Failed to load UI config: ${errorMsg}`);
                setIsLoading(false);
                return;
            }
            if (!result.isValid && result.errors.length > 0) {
                logger.warn("UIConfigContext", `Config has validation errors but will be used: ${result.errors.join(", ")}`);
            }
            setUIConfigRaw(result.config);
            setUIConfig(convertUIConfigJSON(result.config));
            setConfigKey(key);
            setError(null);
            logger.info("UIConfigContext", `Successfully loaded UI config: ${key}`);
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error loading UI config";
            setError(errorMsg);
            logger.error("UIConfigContext", `Error loading UI config: ${errorMsg}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const switchConfig = async (newConfigKey: string) => {
        logger.info("UIConfigContext", `Switching UI config to: ${newConfigKey}`);
        setUIConfigKey(newConfigKey, true);
        await loadConfig(newConfigKey);
    };
    const reloadConfig = async () => {
        logger.info("UIConfigContext", "Reloading current UI config");
        await loadConfig(configKey);
    };
    const applyConfig = (config: UIConfigJSON) => {
        logger.info("UIConfigContext", "Applying UI config directly");
        try {
            setUIConfigRaw(config);
            setUIConfig(convertUIConfigJSON(config));
            setError(null);
            logger.info("UIConfigContext", "Successfully applied UI config");
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error applying UI config";
            setError(errorMsg);
            logger.error("UIConfigContext", `Error applying UI config: ${errorMsg}`);
        }
    };
    useEffect(() => {
        const currentKey = getUIConfigKey();
        if (currentKey !== configKey) {
            setConfigKey(currentKey);
            loadConfig(currentKey);
        }
        else {
            loadConfig(configKey);
        }
    }, []);
    useEffect(() => {
        const handlePopState = () => {
            const newKey = getUIConfigKey();
            if (newKey !== configKey) {
                setConfigKey(newKey);
                loadConfig(newKey);
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [configKey]);
    const value: UIConfigContextType = {
        uiConfig,
        uiConfigRaw,
        isLoading,
        error,
        configKey,
        switchConfig,
        reloadConfig,
        applyConfig,
    };
    return (<UIConfigContext.Provider value={value}>
      {children}
    </UIConfigContext.Provider>);
};
export const useUIConfig = (): UIConfigContextType => {
    const context = useContext(UIConfigContext);
    if (context === undefined) {
        throw new Error("useUIConfig must be used within a UIConfigProvider");
    }
    return context;
};
