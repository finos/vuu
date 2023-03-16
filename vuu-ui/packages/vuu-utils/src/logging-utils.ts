// export {}
// (function formatter() {
// 	let bridge = null,
// 	defaultBridge = {
// 		getLogger: function (category) {
// 			return {
// 				isLevelEnabled: function (level) { return false },
// 				log: function () {}
// 			}
// 		},
// 		getImpl: function () { return this }
// 	}
// 	return {
// 		getLogger: getLogger,
// 		use: use
// 	}

// 	const getBridge = () => {
// 		return bridge ? bridge : defaultBridge
// 	}

// 	const getLogger = (category) => {
// 		if (!bridge) console.warn('WARN: No logging implementation has been registered for category=' + category);
// 		return {
// 			isErrorEnabled: isLevelEnabled.bind(null, category, 'error'),
// 			isDebugEnabled: isLevelEnabled.bind(null, category, 'debug'),
// 			isInfoEnabled: isLevelEnabled.bind(null, category, 'info'),
// 			isWarnEnabled: isLevelEnabled.bind(null, category, 'warn'),
// 			error: log.bind(null, category, 'error'),
// 			debug: log.bind(null, category, 'debug'),
// 			info: log.bind(null, category, 'info'),
// 			warn: log.bind(null, category, 'warn'),
// 		}
// 	}
// })






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
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NO_OP: LogFn = () => {};

// const getLogger = (category: any) => {
// 	return {
// 		isLevelEnabled: function (level:any) { return false},
// 		log: function () {}
// 	}
// }

// const isLevelEnabled = (category:unknown, level:LogLevel) => {
// 	return getLogger(category).isLevelEnabled(level);
// } 

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
	console.log(loggingLevel);
	// return `${(loggingLevel)}\n`
	return `const loggingSettings = { loggingLevel: "${loggingLevel}"};`;
}

export const logger = new ConsoleLogger({ buildEnv: process.env.NODE_ENV });

declare global {
	const loggingSettings:loggingSettings;
}
