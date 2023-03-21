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
const logLevel:string = loggingSettings.loggingLevel

export const loggerNew = (category:string) => {
	const errorEnabled = logLevel === 'error';
	const warnEnabled = errorEnabled || logLevel === 'warn';
	const infoEnabled = errorEnabled || warnEnabled || logLevel === 'info';
	const debugEnabled = errorEnabled || warnEnabled || infoEnabled || logLevel === 'debug';

	const info = infoEnabled ? (message:unknown) => console.info(`[${category}] ${message}`) : NO_OP;
	const warn = warnEnabled ? (message:unknown) => console.warn(`[${category}] ${message}`) : NO_OP;
	const debug = debugEnabled ? (message:unknown) => console.debug(`[${category}] ${message}`) : NO_OP;
	const error = errorEnabled ? (message:unknown) => console.error(`[${category}] ${message}`) : NO_OP;

	if (process.env.NODE_ENV === 'production') {
		return {
			errorEnabled,
			error: errorEnabled ? (message:unknown) => console.error(`[${category}] ${message}`) : NO_OP,
		}
	} else {
		return {
			debugEnabled,
			infoEnabled,
			warnEnabled,
			errorEnabled,
			info: console.info.bind(info),
			warn: console.warn.bind(warn),
			debug: console.debug.bind(debug),
			error: console.error.bind(error),
		}
	}
}

export class ConsoleLogger implements Logger {
	readonly warn: LogFn;
	readonly error: LogFn;
	readonly debug: LogFn;
	readonly info: LogFn;
	readonly warnEnabled:boolean = false;
	readonly infoEnabled: boolean = false;
	readonly debugEnabled:boolean = false;

	constructor(options?: { buildEnv?: string, level?:string | number }) {
		const { buildEnv, level } = options || {};

		if (buildEnv === 'production') {
			this.warn = NO_OP;
			this.error = NO_OP
			this.debug = NO_OP;
			this.info = NO_OP;
			return;
		}

		this.error = console.error.bind(console);

		if (level === 'error') {
			this.warn = NO_OP;
			this.debug = NO_OP;
			this.info = NO_OP;
			return;
		}

		this.warn = console.warn.bind(console);

		if (level === 'warn') {
			this.info = NO_OP;
			this.debug = NO_OP;
			this.warnEnabled = true;
			return;
		}

		this.info = console.info.bind(console);

		if (level === 'info') {
			this.infoEnabled = true;
			this.debug = NO_OP;
			return;
		}

		this.debug = console.debug.bind(console);
		this.debugEnabled = true;
	}
}

export const getLoggingConfig = () => {
	const loggingLevel = getCookieValue("vuu-logging-level");
	return `const loggingSettings = { loggingLevel: "${loggingLevel}"};`;
}

export const logger = new ConsoleLogger({ buildEnv: process.env.NODE_ENV });

declare global {
	const loggingSettings:loggingSettings;
}
