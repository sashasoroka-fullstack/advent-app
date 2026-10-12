import { IRowData } from "../constants";
import { IQuestDataService, QuestDataServiceConfig, QuestDataProvider } from "./types";
import { logger } from "../utils/logger";
const DEFAULT_POLLING_INTERVAL_MS = 180000;
export class QuestDataService implements IQuestDataService {
    private config: QuestDataServiceConfig;
    private provider: QuestDataProvider;
    private currentData: IRowData[] = [];
    private pollingIntervalId: number | null = null;
    private onDataUpdateCallback: ((data: IRowData[]) => void) | null = null;
    private onErrorCallback: ((message: string) => void) | null = null;
    constructor(config: QuestDataServiceConfig, provider: QuestDataProvider) {
        this.config = {
            ...config,
            pollingIntervalMs: config.pollingIntervalMs || DEFAULT_POLLING_INTERVAL_MS,
        };
        this.provider = provider;
        logger.info("QuestDataService", `Initialized with ${config.dataSourceType} provider`);
    }
    getData(): IRowData[] {
        return this.currentData;
    }
    getConfig(): QuestDataServiceConfig {
        return { ...this.config };
    }
    async fetchData(): Promise<IRowData[]> {
        const data = await this.provider.fetchQuestData();
        if (!data || data.length === 0) {
            logger.warn("QuestDataService", "Provider returned empty dataset");
        }
        return data;
    }
    startPolling(callback: (data: IRowData[]) => void, onError?: (message: string) => void): void {
        this.onDataUpdateCallback = callback;
        this.onErrorCallback = onError ?? null;
        logger.info("QuestDataService", "Starting data polling");
        this.fetchData()
            .then((data) => {
            this.currentData = data;
            logger.info("QuestDataService", `Initial fetch complete: ${data.length} records`);
            this.onDataUpdateCallback?.(data);
        })
            .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            logger.error("QuestDataService", "Error during initial fetch", error);
            this.onErrorCallback?.(message);
            this.onDataUpdateCallback?.([]);
        });
        const isPollingEnabled = this.config.pollingIntervalMs &&
            this.config.pollingIntervalMs < Number.MAX_SAFE_INTEGER;
        if (isPollingEnabled) {
            this.pollingIntervalId = window.setInterval(() => {
                this.fetchData()
                    .then((data) => {
                    this.currentData = data;
                    logger.debug("QuestDataService", `Poll complete: ${data.length} records`);
                    this.onDataUpdateCallback?.(data);
                })
                    .catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    logger.error("QuestDataService", "Error during polling fetch", error);
                    this.onErrorCallback?.(message);
                });
            }, this.config.pollingIntervalMs);
            logger.info("QuestDataService", `Polling enabled: every ${this.config.pollingIntervalMs}ms`);
        }
        else {
            logger.info("QuestDataService", "Polling disabled");
        }
    }
    stopPolling(): void {
        if (this.pollingIntervalId !== null) {
            clearInterval(this.pollingIntervalId);
            this.pollingIntervalId = null;
            logger.info("QuestDataService", "Polling stopped");
        }
        this.onDataUpdateCallback = null;
        this.onErrorCallback = null;
    }
}
