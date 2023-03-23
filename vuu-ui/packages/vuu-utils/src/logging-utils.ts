import { getCookieValue } from "./cookie-utils";

export interface LogFn {
  (message?: unknown, ...optionalParams: unknown[]): void;
}
export interface AssertLogFn {
  (condition: boolean, message?: unknown, errorMessaage?: unknown): void;
}

export interface TableLogFn {
  (properties?: object): void;
}

type loggingSettings = {
  loggingLevel: LogLevel;
};

export interface Logger {
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
  info: LogFn;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export type BuildEnv = "production" | "development";

const NO_OP = () => undefined;

const DEFAULT_DEBUG_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "error" : "info";

const { loggingLevel = DEFAULT_DEBUG_LEVEL } =
  typeof loggingSettings !== "undefined" ? loggingSettings : {};

export const logger = (category: string) => {
  const debugEnabled = loggingLevel === "debug";
  const infoEnabled = debugEnabled || loggingLevel === "info";
  const warnEnabled = infoEnabled || loggingLevel === "warn";
  const errorEnabled = warnEnabled || loggingLevel === "error";

  const info = infoEnabled
    ? (message: string) => console.info(`[${category}] ${message}`)
    : NO_OP;
  const warn = warnEnabled
    ? (message: string) => console.warn(`[${category}] ${message}`)
    : NO_OP;
  const debug = debugEnabled
    ? (message: string) => console.debug(`[${category}] ${message}`)
    : NO_OP;
  const error = errorEnabled
    ? (message: string) => console.error(`[${category}] ${message}`)
    : NO_OP;

  if (process.env.NODE_ENV === "production") {
    return {
      errorEnabled,
      error,
    };
  } else {
    return {
      debugEnabled,
      infoEnabled,
      warnEnabled,
      errorEnabled,
      info,
      warn,
      debug,
      error,
    };
  }
};

export const getLoggingConfig = () => {
  const loggingLevel = getCookieValue("vuu-logging-level");
  return `const loggingSettings = { loggingLevel: "${loggingLevel}"};`;
};
declare global {
  const loggingSettings: loggingSettings;
}
