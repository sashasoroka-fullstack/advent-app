import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from "react";
import { IRowData } from "../constants";
import { DataSourceType, QuestDataProvider as IQuestDataProvider } from "../services/types";
import { MockCSVProvider, GoogleSheetsProvider, APIProvider } from "../services/providers";
import { createQuestDataService, createQuestDataServiceWithProvider } from "../services/questDataServiceFactory";
import { IQuestDataService } from "../services/types";
import { useUIConfig } from "./UIConfigContext";
import { useApiQuestContext } from "./ApiQuestContext";
import { logger } from "../utils/logger";
import { getQuestDataScopeKey, isApiQuestDataScope, getLocalQuestStorageKey, } from "../utils/questDataScope";
export interface DataSourceConfig {
    type: DataSourceType;
    url: string;
    headers?: Record<string, string>;
    pollingIntervalMs?: number;
}
interface QuestDataContextState {
    data: IRowData[];
    isLoading: boolean;
    error: string | null;
    currentSourceType: DataSourceType | null;
    switchDataSource: (config: DataSourceConfig) => Promise<void>;
    refreshData: () => Promise<void>;
    clearData: () => void;
}
const QuestDataContext = createContext<QuestDataContextState | undefined>(undefined);
interface QuestDataProviderProps {
    children: ReactNode;
}
function readLocalGoogleSheetUrl(localConfigKey: string): string {
    if (!localConfigKey) {
        return "";
    }
    return localStorage.getItem(`questGoogleSheetUrl:${localConfigKey}`)?.trim() || "";
}
export const QuestDataProvider: React.FC<QuestDataProviderProps> = ({ children }) => {
    const [data, setData] = useState<IRowData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSourceType, setCurrentSourceType] = useState<DataSourceType | null>(null);
    const serviceRef = useRef<IQuestDataService | null>(null);
    const prevDataRef = useRef<string>("");
    const lastDataSourceUrlRef = useRef<string>("");
    const lastQuestUrlRef = useRef<string>("");
    const prevDataScopeRef = useRef<string>("");
    const { configKey: currentUITheme } = useUIConfig();
    const { selectedQuestId, selectedQuest, activeLocalConfigKey } = useApiQuestContext();
    const isApiQuest = isApiQuestDataScope(selectedQuestId, activeLocalConfigKey);
    const dataScopeKey = useMemo(() => getQuestDataScopeKey(selectedQuestId, activeLocalConfigKey, currentUITheme), [selectedQuestId, activeLocalConfigKey, currentUITheme]);
    const localStorageKey = useMemo(() => getLocalQuestStorageKey(activeLocalConfigKey || currentUITheme), [activeLocalConfigKey, currentUITheme]);
    const savedUrl = useMemo(() => {
        if (isApiQuest) {
            return selectedQuest?.googleSheetUrl?.trim() || "";
        }
        return readLocalGoogleSheetUrl(localStorageKey);
    }, [isApiQuest, selectedQuest?.googleSheetUrl, localStorageKey]);
    const createProvider = useCallback((config: DataSourceConfig): IQuestDataProvider => {
        switch (config.type) {
            case DataSourceType.MOCK_CSV:
                return new MockCSVProvider(config.url);
            case DataSourceType.GOOGLE_SHEETS:
                return new GoogleSheetsProvider(config.url);
            case DataSourceType.API:
                return new APIProvider(config.url, {
                    headers: config.headers,
                    timeout: config.pollingIntervalMs,
                });
            default:
                throw new Error(`Unsupported data source type: ${config.type}`);
        }
    }, []);
    const stopActiveService = useCallback(() => {
        if (serviceRef.current) {
            serviceRef.current.stopPolling();
            serviceRef.current = null;
        }
    }, []);
    const startPollingFromUrl = useCallback((url: string, sourceType: DataSourceType) => {
        const questUrlKey = `${dataScopeKey}:${url}`;
        stopActiveService();
        const provider = createProvider({ type: sourceType, url });
        const service = createQuestDataServiceWithProvider(provider, {});
        serviceRef.current = service;
        setCurrentSourceType(sourceType);
        lastDataSourceUrlRef.current = url;
        lastQuestUrlRef.current = questUrlKey;
        setIsLoading(true);
        setError(null);
        service.startPolling((fetchedData: IRowData[]) => {
            const serialized = JSON.stringify(fetchedData);
            if (serialized !== prevDataRef.current) {
                prevDataRef.current = serialized;
                setData(fetchedData);
                logger.info("QuestDataContext", `Data updated for scope "${dataScopeKey}": ${fetchedData.length} records`);
            }
            setIsLoading(false);
        }, (message) => {
            setError(message);
            setIsLoading(false);
        });
    }, [createProvider, dataScopeKey, stopActiveService]);
    useEffect(() => {
        if (!dataScopeKey) {
            return;
        }
        const scopeChanged = prevDataScopeRef.current !== dataScopeKey;
        if (scopeChanged) {
            logger.info("QuestDataContext", `Data scope changed from "${prevDataScopeRef.current}" to "${dataScopeKey}"`);
            prevDataScopeRef.current = dataScopeKey;
        }
        const clearedKey = `questDataCleared:${dataScopeKey}`;
        const wasCleared = !isApiQuest && localStorage.getItem(clearedKey) === "true";
        const questUrlKey = savedUrl ? `${dataScopeKey}:${savedUrl}` : "";
        if (wasCleared) {
            logger.info("QuestDataContext", `Data was cleared for scope "${dataScopeKey}"`);
            stopActiveService();
            setData([]);
            setCurrentSourceType(null);
            setError(null);
            setIsLoading(false);
            lastQuestUrlRef.current = "";
            lastDataSourceUrlRef.current = "";
            return;
        }
        if (savedUrl) {
            const isAlreadyLoading = !scopeChanged &&
                lastQuestUrlRef.current === questUrlKey &&
                lastDataSourceUrlRef.current === savedUrl &&
                serviceRef.current;
            if (isAlreadyLoading) {
                return;
            }
            const sourceTypeKey = `questDataSourceType:${localStorageKey}`;
            const savedSourceType = (isApiQuest
                ? DataSourceType.GOOGLE_SHEETS
                : (localStorage.getItem(sourceTypeKey) as DataSourceType | null)) || DataSourceType.GOOGLE_SHEETS;
            logger.info("QuestDataContext", `Auto-loading data for scope "${dataScopeKey}"`);
            startPollingFromUrl(savedUrl, savedSourceType);
            return;
        }
        if (scopeChanged) {
            stopActiveService();
            setData([]);
            setCurrentSourceType(null);
            setError(null);
            setIsLoading(false);
            lastQuestUrlRef.current = "";
            lastDataSourceUrlRef.current = "";
            prevDataRef.current = "";
        }
        if (isApiQuest) {
            logger.info("QuestDataContext", `API quest "${dataScopeKey}" has no data source URL`);
            return;
        }
        if (!serviceRef.current) {
            const service = createQuestDataService();
            if (service) {
                serviceRef.current = service;
                setCurrentSourceType(service.getConfig().dataSourceType);
                setIsLoading(true);
                setError(null);
                service.startPolling((fetchedData: IRowData[]) => {
                    const serialized = JSON.stringify(fetchedData);
                    if (serialized !== prevDataRef.current) {
                        prevDataRef.current = serialized;
                        setData(fetchedData);
                    }
                    setIsLoading(false);
                }, (message) => {
                    setError(message);
                    setIsLoading(false);
                });
            }
        }
    }, [
        dataScopeKey,
        savedUrl,
        isApiQuest,
        localStorageKey,
        startPollingFromUrl,
        stopActiveService,
    ]);
    const switchDataSource = useCallback(async (config: DataSourceConfig): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            stopActiveService();
            logger.info("QuestDataContext", `Switching to ${config.type} for scope ${dataScopeKey}`);
            const urlToUse = config.url.trim();
            if (!isApiQuest) {
                const clearedKey = `questDataCleared:${dataScopeKey}`;
                localStorage.removeItem(clearedKey);
                localStorage.setItem(`questGoogleSheetUrl:${localStorageKey}`, urlToUse);
                localStorage.setItem(`questDataSourceType:${localStorageKey}`, config.type);
            }
            startPollingFromUrl(urlToUse, config.type);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            setIsLoading(false);
            logger.error("QuestDataContext", "Failed to switch data source", err);
            lastDataSourceUrlRef.current = "";
            lastQuestUrlRef.current = "";
        }
    }, [dataScopeKey, isApiQuest, localStorageKey, startPollingFromUrl, stopActiveService]);
    const refreshData = useCallback(async (): Promise<void> => {
        if (!serviceRef.current) {
            logger.warn("QuestDataContext", "No active data source to refresh");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fetchedData = await serviceRef.current.fetchData();
            setData(fetchedData);
            logger.info("QuestDataContext", `Data refreshed: ${fetchedData.length} records`);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            logger.error("QuestDataContext", "Failed to refresh data", err);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const clearData = useCallback((): void => {
        logger.info("QuestDataContext", `Clearing quest data for scope: ${dataScopeKey}`);
        stopActiveService();
        setData([]);
        setCurrentSourceType(null);
        setError(null);
        setIsLoading(false);
        prevDataRef.current = "";
        lastDataSourceUrlRef.current = "";
        lastQuestUrlRef.current = "";
        if (!isApiQuest && dataScopeKey) {
            localStorage.setItem(`questDataCleared:${dataScopeKey}`, "true");
        }
    }, [dataScopeKey, isApiQuest, stopActiveService]);
    const value: QuestDataContextState = useMemo(() => ({
        data,
        isLoading,
        error,
        currentSourceType,
        switchDataSource,
        refreshData,
        clearData,
    }), [data, isLoading, error, currentSourceType, switchDataSource, refreshData, clearData]);
    return <QuestDataContext.Provider value={value}>{children}</QuestDataContext.Provider>;
};
export const useQuestDataContext = (): QuestDataContextState => {
    const context = useContext(QuestDataContext);
    if (context === undefined) {
        throw new Error("useQuestDataContext must be used within a QuestDataProvider");
    }
    return context;
};
