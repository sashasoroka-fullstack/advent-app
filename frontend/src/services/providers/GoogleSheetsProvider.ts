import { IRowData } from "../../constants";
import { QuestDataProvider } from "../types";
import { parseCSV } from "./csvParser";
import { logger } from "../../utils/logger";
const DEFAULT_TIMEOUT_MS = 30000;
function convertToCSVExportUrl(url: string): string {
    if (url.includes('/export?format=csv')) {
        return url;
    }
    if (url.includes('/spreadsheets/d/e/')) {
        if (url.includes('output=csv') || url.includes('format=csv')) {
            logger.info("GoogleSheetsProvider", `Published URL already has CSV format: ${url}`);
            return url;
        }
        const urlObj = new URL(url);
        urlObj.searchParams.set('output', 'csv');
        urlObj.searchParams.set('single', 'true');
        if (!urlObj.searchParams.has('gid')) {
            const gidMatch = url.match(/[?&]gid=(\d+)/);
            if (gidMatch) {
                urlObj.searchParams.set('gid', gidMatch[1]);
            }
            else {
                urlObj.searchParams.set('gid', '0');
            }
        }
        const csvExportUrl = urlObj.toString();
        logger.info("GoogleSheetsProvider", `Converted published URL: ${url} -> ${csvExportUrl}`);
        return csvExportUrl;
    }
    const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch || !sheetIdMatch[1]) {
        logger.warn("GoogleSheetsProvider", `Could not extract sheet ID from URL: ${url}`);
        return url;
    }
    const sheetId = sheetIdMatch[1];
    const gidMatch = url.match(/[#&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    logger.info("GoogleSheetsProvider", `Converted URL: ${url} -> ${csvExportUrl}`);
    return csvExportUrl;
}
export class GoogleSheetsProvider implements QuestDataProvider {
    private dataSourceUrl: string;
    private timeout: number;
    constructor(dataSourceUrl: string, timeout: number = DEFAULT_TIMEOUT_MS) {
        this.dataSourceUrl = convertToCSVExportUrl(dataSourceUrl);
        this.timeout = timeout;
    }
    async fetchQuestData(): Promise<IRowData[]> {
        if (!this.dataSourceUrl) {
            logger.error("GoogleSheetsProvider", "No data source URL provided");
            return [];
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            logger.info("GoogleSheetsProvider", `Fetching data from: ${this.dataSourceUrl}`);
            const response = await fetch(this.dataSourceUrl, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                logger.error("GoogleSheetsProvider", `HTTP error: ${response.status} ${response.statusText}`);
                return [];
            }
            const csvData = await response.text();
            if (!csvData || csvData.trim().length === 0) {
                logger.warn("GoogleSheetsProvider", "Received empty CSV data");
                return [];
            }
            const parsedData = await parseCSV(csvData);
            logger.info("GoogleSheetsProvider", `Successfully fetched ${parsedData.length} records`);
            return parsedData;
        }
        catch (error: unknown) {
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    logger.error("GoogleSheetsProvider", `Request timed out after ${this.timeout}ms`, error);
                }
                else {
                    logger.error("GoogleSheetsProvider", "Error fetching CSV", error);
                }
            }
            return [];
        }
    }
}
