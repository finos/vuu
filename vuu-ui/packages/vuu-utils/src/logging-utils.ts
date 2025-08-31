import { getCookieValue } from "./cookie-utils";

declare global {
  const loggingSettings: loggingSettings;
}

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

export type LogLevel = keyof Logger;

const logLevels = ["error", "warn", "info", "debug"];
const isValidLogLevel = (value: unknown): value is LogLevel =>
  typeof value === "string" && logLevels.includes(value);

const DEFAULT_LOG_LEVEL: LogLevel = "error";

export type BuildEnv = "production" | "development";

const NO_OP = () => undefined;

const DEFAULT_DEBUG_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "error" : "info";

const { loggingLevel = DEFAULT_DEBUG_LEVEL } = getLoggingSettings();
// typeof loggingSettings !== "undefined" ? loggingSettings : {};
// const { loggingLevel = DEFAULT_DEBUG_LEVEL } =
//   typeof loggingSettings !== "undefined" ? loggingSettings : {};

export const logger = (category: string) => {
  const debugEnabled = loggingLevel === "debug";
  const infoEnabled = debugEnabled || loggingLevel === "info";
  const warnEnabled = infoEnabled || loggingLevel === "warn";
  const errorEnabled = warnEnabled || loggingLevel === "error";

  const info = infoEnabled
    ? (message: string) =>
        console.info(`${Date.now()} [${category}] ${message}`)
    : NO_OP;
  const warn = warnEnabled
    ? (message: string) => console.warn(`[${category}] ${message}`)
    : NO_OP;
  const debug = debugEnabled
    ? (message: string) =>
        console.debug(`${Date.now()} [${category}] ${message}`)
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

function getLoggingSettings() {
  if (typeof loggingSettings !== "undefined") {
    return loggingSettings;
  } else {
    return {
      loggingLevel: getLoggingLevelFromCookie(),
    };
  }
}

function getLoggingLevelFromCookie(): LogLevel {
  const value = getCookieValue("vuu-logging-level");
  if (isValidLogLevel(value)) {
    return value;
  } else {
    return DEFAULT_LOG_LEVEL;
  }
}

export const getLoggingConfigForWorker = () => {
  return `const loggingSettings = { loggingLevel: "${getLoggingLevelFromCookie()}"};`;
};

export const logUnhandledMessage = (
  message: never,
  context = "[logUnhandledStruct]",
) => {
  console.log(`${context}  ${JSON.stringify(message)}`);
};
