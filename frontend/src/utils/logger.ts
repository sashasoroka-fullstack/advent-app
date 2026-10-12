export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export interface LoggerOptions {
    enabled?: boolean;
    minLevel?: LogLevel;
}
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
};
class Logger {
    private enabled: boolean;
    private minLevel: LogLevel;
    constructor(options: LoggerOptions = {}) {
        this.enabled = options.enabled ?? true;
        this.minLevel = options.minLevel ?? LogLevel.INFO;
    }
    private shouldLog(level: LogLevel): boolean {
        if (!this.enabled)
            return false;
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
    }
    private formatMessage(level: LogLevel, context: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [${context}] ${message}`;
    }
    debug(context: string, message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatMessage(LogLevel.DEBUG, context, message), ...args);
        }
    }
    info(context: string, message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage(LogLevel.INFO, context, message), ...args);
        }
    }
    warn(context: string, message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, context, message), ...args);
        }
    }
    error(context: string, message: string, error?: Error | unknown, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(this.formatMessage(LogLevel.ERROR, context, message), errorMessage, ...args);
            if (error instanceof Error && error.stack) {
                console.error("Stack trace:", error.stack);
            }
        }
    }
    group(label: string): void {
        if (this.enabled) {
            console.group(label);
        }
    }
    groupCollapsed(label: string): void {
        if (this.enabled) {
            console.groupCollapsed(label);
        }
    }
    groupEnd(): void {
        if (this.enabled) {
            console.groupEnd();
        }
    }
    setMinLevel(level: LogLevel): void {
        this.minLevel = level;
    }
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
}
export const logger = new Logger({
    enabled: import.meta.env.DEV,
    minLevel: LogLevel.INFO,
});
export function logStartupInfo(_config: {
    mode: "DEV" | "PROD";
    dataProvider: string;
    questName: string;
    taskCount: number;
}): void {
    // Startup diagnostics are disabled in the browser console.
}
