export interface LogFn {
  (message?: unknown, ...optionalParams: unknown[]): void;
}
export interface AssertLogFn {
  (condition: boolean, message?: unknown, errorMessaage?: unknown): void;
}

export interface TableLogFn {
  (properties?: object): void;
}

export interface Logger {
  log: LogFn;
  warn: LogFn;
  error: LogFn;
  group: LogFn;
  groupCollapsed: LogFn;
  groupEnd: LogFn;
  assert: AssertLogFn;
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  table: TableLogFn;
}

export type BuildEnv = "production" | "development";
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NO_OP: LogFn = () => {};

export class ConsoleLogger implements Logger {
  readonly log: LogFn;
  readonly warn: LogFn;
  readonly error: LogFn;
  readonly group: LogFn;
  readonly groupCollapsed: LogFn;
  readonly groupEnd: LogFn;
  readonly assert: AssertLogFn;
  readonly trace: LogFn;
  readonly debug: LogFn;
  readonly info: LogFn;
  readonly table: TableLogFn;

  constructor(options?: { buildEnv?: string }, level?: string) {
    const { buildEnv } = options || {};

    if (true || buildEnv === "production") {
      this.log = NO_OP;
      this.warn = NO_OP;
      this.error = NO_OP;
      this.group = NO_OP;
      this.groupCollapsed = NO_OP;
      this.groupEnd = NO_OP;
      this.assert = NO_OP;
      this.trace = NO_OP;
      this.debug = NO_OP;
      this.info = NO_OP;
      this.table = NO_OP;

      return;
    }

    this.log = console.log.bind(console);
    this.warn = console.warn.bind(console);
    this.error = console.error.bind(console);
    this.group = console.group.bind(console);
    this.groupEnd = console.groupEnd.bind(console);
    this.groupCollapsed = console.groupCollapsed.bind(console);
    this.assert = console.assert.bind(console);
    this.trace = console.trace.bind(console);
    this.debug = console.debug.bind(console);
    this.info = console.info.bind(console);
    this.table = console.table.bind(console);
  }
}

export const logger = new ConsoleLogger({ buildEnv: process.env.NODE_ENV });
