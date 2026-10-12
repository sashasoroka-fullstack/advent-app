import { QuestDataService } from "./QuestDataService";
import { GoogleSheetsProvider, MockCSVProvider, APIProvider } from "./providers";
import { DataSourceType, QuestDataServiceConfig, QuestDataProvider, CustomProviderConfig } from "./types";
import { isDevMode } from "../auth/authConfig";
import { logger } from "../utils/logger";
const POLLING_DISABLED = Number.MAX_SAFE_INTEGER;
const getDataSourceUrl = (): string => {
    const googleSheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL;
    if (googleSheetUrl) {
        return googleSheetUrl;
    }
    logger.info("QuestDataServiceFactory", "No default data source configured - user must provide URL");
    return "";
};
export const getDataSourceType = (): DataSourceType | null => {
    const googleSheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL;
    if (googleSheetUrl) {
        return DataSourceType.GOOGLE_SHEETS;
    }
    return null;
};
const createDataProvider = (dataSourceType: DataSourceType, dataSourceUrl: string, options?: {
    headers?: Record<string, string>;
}): QuestDataProvider => {
    switch (dataSourceType) {
        case DataSourceType.GOOGLE_SHEETS:
            return new GoogleSheetsProvider(dataSourceUrl);
        case DataSourceType.MOCK_CSV:
            return new MockCSVProvider(dataSourceUrl);
        case DataSourceType.API:
            return new APIProvider(dataSourceUrl, options);
        default:
            throw new Error(`Unsupported data source type: ${dataSourceType}`);
    }
};
export const createQuestDataService = (customConfig?: Partial<QuestDataServiceConfig>): QuestDataService | null => {
    const dataSourceType = getDataSourceType();
    const dataSourceUrl = getDataSourceUrl();
    if (!dataSourceType || !dataSourceUrl) {
        logger.info("QuestDataServiceFactory", "No data source configured - service not created");
        return null;
    }
    const config: QuestDataServiceConfig = {
        dataSourceType,
        dataSourceUrl,
        pollingIntervalMs: isDevMode() ? POLLING_DISABLED : undefined,
        ...customConfig,
    };
    const provider = createDataProvider(config.dataSourceType, config.dataSourceUrl);
    if (isDevMode()) {
        logger.info("QuestDataServiceFactory", "DEV mode - polling disabled");
    }
    return new QuestDataService(config, provider);
};
export const createQuestDataServiceWithProvider = (provider: QuestDataProvider, config: CustomProviderConfig = {}): QuestDataService => {
    const fullConfig: QuestDataServiceConfig = {
        dataSourceType: DataSourceType.GOOGLE_SHEETS,
        dataSourceUrl: "",
        pollingIntervalMs: isDevMode() ? POLLING_DISABLED : undefined,
        ...config,
    };
    logger.info("QuestDataServiceFactory", "Creating service with custom provider");
    return new QuestDataService(fullConfig, provider);
};
