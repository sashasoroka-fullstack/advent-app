import Papa from "papaparse";
import { IRowData } from "../../constants";
import { logger } from "../../utils/logger";
const REQUIRED_EMAIL_FIELD = "Email Address";
function isValidRow(row: unknown): row is IRowData {
    if (!row || typeof row !== "object") {
        return false;
    }
    const rowData = row as Record<string, unknown>;
    let emailValue: unknown = rowData[REQUIRED_EMAIL_FIELD];
    if (!emailValue || typeof emailValue !== "string" || emailValue.length === 0) {
        const allKeys = Object.keys(rowData);
        for (const key of allKeys) {
            const cleanKey = key.trim().replace(/^["']|["']$/g, '');
            if (cleanKey === REQUIRED_EMAIL_FIELD) {
                emailValue = rowData[key];
                if (emailValue && typeof emailValue === "string" && emailValue.length > 0) {
                    break;
                }
            }
        }
    }
    return (emailValue !== undefined &&
        emailValue !== null &&
        typeof emailValue === "string" &&
        emailValue.trim().length > 0 &&
        emailValue.includes("@"));
}
function sanitizeData(data: unknown[]): IRowData[] {
    const validRows: IRowData[] = [];
    let invalidRowCount = 0;
    data.forEach((row) => {
        if (row && typeof row === "object") {
            const rowObj = row as Record<string, unknown>;
            const cleanedRow: Record<string, unknown> = {};
            const seenKeys = new Set<string>();
            Object.keys(rowObj).forEach(key => {
                const cleanKey = key.trim().replace(/^["']|["']$/g, '');
                if (!seenKeys.has(cleanKey)) {
                    seenKeys.add(cleanKey);
                    cleanedRow[cleanKey] = rowObj[key];
                }
            });
            Object.assign(rowObj, cleanedRow);
        }
        if (isValidRow(row)) {
            validRows.push(row);
        }
        else {
            invalidRowCount++;
        }
    });
    if (invalidRowCount > 0) {
        logger.warn("CSVParser", `Filtered out ${invalidRowCount} invalid/empty rows`);
    }
    return validRows;
}
export const parseCSV = (csvData: string): Promise<IRowData[]> => {
    return new Promise((resolve, reject) => {
        if (!csvData || csvData.trim().length === 0) {
            logger.warn("CSVParser", "Empty CSV data provided");
            resolve([]);
            return;
        }
        Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => {
                return header.trim().replace(/^["']|["']$/g, '');
            },
            complete: (result) => {
                if (result.errors && result.errors.length > 0) {
                    logger.warn("CSVParser", `Parse warnings: ${result.errors.length} issues found`);
                    result.errors.forEach((error) => {
                        logger.debug("CSVParser", `Parse error at row ${error.row}: ${error.message}`);
                    });
                }
                const sanitizedData = sanitizeData(result.data);
                logger.info("CSVParser", `Parsed ${sanitizedData.length} valid rows from CSV`);
                resolve(sanitizedData);
            },
            error: (error: Error) => {
                logger.error("CSVParser", "Error parsing CSV", error);
                reject(error);
            },
        });
    });
};
