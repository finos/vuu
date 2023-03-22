import { getCookieValue } from "./cookie-utils";

export interface LogFn {
	(message?: unknown, ...optionalParams: unknown[]): void;
}
export interface AssertLogFn {
	(condition: boolean, message?: unknown, errorMessaage?: unknown): void;
}

export interface TableLogFn {
	(properties?: object): void
}

type loggingSettings = {
	loggingLevel: string;
}

export interface Logger {
	warn: LogFn;
	error: LogFn;
	debug: LogFn;
	info: LogFn;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type BuildEnv = 'production' | 'development';

const NO_OP = () => undefined;

export const logger = (category:string) => {
	const logLevel:string = loggingSettings.loggingLevel
	const debugEnabled = logLevel === 'debug';
	const infoEnabled = debugEnabled || logLevel === 'info';
	const warnEnabled = debugEnabled || infoEnabled || logLevel === 'warn';
	const errorEnabled = debugEnabled || infoEnabled || warnEnabled || logLevel === 'error';

	const info = infoEnabled ? (message:unknown) => console.info(`[${category}] ${message}`) : NO_OP;
	const warn = warnEnabled ? (message:unknown) => console.warn(`[${category}] ${message}`) : NO_OP;
	const debug = debugEnabled ? (message:unknown) => console.debug(`[${category}] ${message}`) : NO_OP;
	const error = errorEnabled ? (message:unknown) => console.error(`[${category}] ${message}`) : NO_OP;

	if (process.env.NODE_ENV === 'production') {
		return {
			errorEnabled,
			error: error,
		}
	} else {
		return {
			debugEnabled,
			infoEnabled,
			warnEnabled,
			errorEnabled,
			info: info,
			warn: warn,
			debug: debug,
			error: error,
		}
	}
}

export const getLoggingConfig = () => {
	const loggingLevel = getCookieValue("vuu-logging-level");
	return `const loggingSettings = { loggingLevel: "${loggingLevel}"};`;
}
declare global {
	const loggingSettings:loggingSettings;
}
