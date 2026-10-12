import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useUIConfig } from "../../context/UIConfigContext";
import { getUIConfigKey } from "../../services/uiConfigLoader";
import { logger } from "../../utils/logger";
export const UIConfigURLListener: React.FC = () => {
    const location = useLocation();
    const { configKey, switchConfig } = useUIConfig();
    const lastProcessedKeyRef = useRef<string>(configKey);
    useEffect(() => {
        const newKey = getUIConfigKey();
        if (newKey !== lastProcessedKeyRef.current && newKey !== configKey) {
            logger.info("UIConfigURLListener", `URL changed, switching config from "${configKey}" to "${newKey}"`);
            lastProcessedKeyRef.current = newKey;
            switchConfig(newKey);
        }
    }, [location.search]);
    useEffect(() => {
        lastProcessedKeyRef.current = configKey;
    }, [configKey]);
    return null;
};
