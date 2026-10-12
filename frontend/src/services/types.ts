import { IRowData } from "../constants";
export enum DataSourceType {
    MOCK_CSV = "MOCK_CSV",
    GOOGLE_SHEETS = "GOOGLE_SHEETS",
    API = "API"
}
export interface QuestDataProvider {
    fetchQuestData(): Promise<IRowData[]>;
}
export interface QuestDataServiceConfig {
    dataSourceType: DataSourceType;
    dataSourceUrl: string;
    pollingIntervalMs?: number;
}
export interface CustomProviderConfig {
    pollingIntervalMs?: number;
}
export interface IQuestDataService {
    getData(): IRowData[];
    startPolling(callback: (data: IRowData[]) => void, onError?: (message: string) => void): void;
    stopPolling(): void;
    fetchData(): Promise<IRowData[]>;
    getConfig(): QuestDataServiceConfig;
}
