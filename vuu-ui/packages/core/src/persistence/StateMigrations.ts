import {
  type EntryMetadata,
  type JsonValue,
  type NotCarriedForwardRecord,
  type StateDocument,
  cloneJson,
  cloneStateDocument,
  findNonJsonValue,
  isValidKey,
} from "./StateDocument";

const REJECTED = Symbol("vuu.state-migration.rejected");

/** Returned from `entry.reject()`; tells `update` to drop the entry. */
export interface Rejected {
  readonly [REJECTED]: true;
  readonly reason: string;
}

export interface MigrationEntry {
  /** Removes the entry and records it in notCarriedForward. */
  reject(reason: string): Rejected;
  /** Keeps the entry, and tells the user something changed. */
  notify(message: string): void;
}

export interface MigratableState {
  readonly fromVersion: number;
  readonly toVersion: number;
  keys(): readonly string[];
  has(key: string): boolean;
  get<T extends JsonValue = JsonValue>(key: string): T | undefined;
  set<T extends JsonValue>(
    key: string,
    value: T,
    metadata?: EntryMetadata,
  ): void;
  /** Transforms one entry. A missing key is skipped; an error rejects only this entry. */
  update<T extends JsonValue>(
    key: string,
    fn: (value: T, entry: MigrationEntry) => T | Rejected,
  ): void;
  rename(from: string, to: string): void;
  remove(key: string): void;
}

export interface StateMigration {
  /** The application version this migration upgrades to. */
  version: number;
  description?: string;
  migrate(state: MigratableState): void | Promise<void>;
}

export interface StateMigrationResult {
  document: StateDocument;
  notifications: readonly string[];
}

/** Thrown when a migration fails outside `update`, aborting carry-forward. */
export class StateMigrationError extends Error {
  readonly version: number;
  constructor(message: string, version: number, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "StateMigrationError";
    this.version = version;
  }
}

export const isRejected = (value: unknown): value is Rejected =>
  typeof value === "object" && value !== null && REJECTED in value;

const FAILED_REASON = "It couldn't be updated for the new version";

/**
 * Checks that migration versions are unique integers, no higher than the
 * application's current version. Throws StateMigrationError otherwise.
 */
export const validateStateMigrations = (
  migrations: readonly StateMigration[],
  currentVersion: number,
) => {
  const seen = new Set<number>();
  for (const migration of migrations) {
    const { version } = migration ?? {};
    if (!Number.isInteger(version)) {
      throw new StateMigrationError(
        "State migration version must be an integer",
        Number.NaN,
      );
    }
    if (typeof migration.migrate !== "function") {
      throw new StateMigrationError(
        `State migration for version ${version} has no migrate function`,
        version,
      );
    }
    if (seen.has(version)) {
      throw new StateMigrationError(
        `Duplicate state migration for version ${version}`,
        version,
      );
    }
    if (version > currentVersion) {
      throw new StateMigrationError(
        `State migration for version ${version} is higher than the application version ${currentVersion}`,
        version,
      );
    }
    seen.add(version);
  }
};

const assertJson = (key: string, value: unknown) => {
  const problem = findNonJsonValue(value);
  if (problem) {
    throw TypeError(`Migrated value for "${key}" is not JSON: ${problem}`);
  }
};

class MigratableStateImpl implements MigratableState {
  fromVersion: number;
  toVersion: number;

  constructor(
    private document: StateDocument,
    private sourceVersion: number,
    private rejected: NotCarriedForwardRecord[],
    private notifications: string[],
    private now: string,
    fromVersion: number,
    toVersion: number,
  ) {
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
  }

  keys() {
    return Object.keys(this.document.entries);
  }

  has(key: string) {
    return Object.hasOwn(this.document.entries, key);
  }

  get<T extends JsonValue = JsonValue>(key: string) {
    return this.has(key)
      ? cloneJson(this.document.entries[key].value as T)
      : undefined;
  }

  set<T extends JsonValue>(key: string, value: T, metadata?: EntryMetadata) {
    if (!isValidKey(key)) {
      throw TypeError(`Invalid saved state key "${key}"`);
    }
    assertJson(key, value);
    const existing = this.document.entries[key];
    this.document.entries[key] = {
      ...existing,
      ...metadata,
      value: cloneJson(value),
      updatedAt: this.now,
    };
  }

  #reject(key: string, reason: string) {
    const entry = this.document.entries[key];
    delete this.document.entries[key];
    this.rejected.push({
      key,
      ...(entry?.label === undefined ? {} : { label: entry.label }),
      ...(entry?.group === undefined ? {} : { group: entry.group }),
      fromVersion: this.sourceVersion,
      reason,
    });
  }

  update<T extends JsonValue>(
    key: string,
    fn: (value: T, entry: MigrationEntry) => T | Rejected,
  ) {
    if (!this.has(key)) return;
    const entryApi: MigrationEntry = {
      reject: (reason) => ({ [REJECTED]: true, reason }) as Rejected,
      notify: (message) => {
        this.notifications.push(message);
      },
    };
    try {
      const result = fn(this.get<T>(key) as T, entryApi);
      if (isRejected(result)) {
        this.#reject(key, result.reason);
        return;
      }
      if (
        result !== null &&
        typeof (result as { then?: unknown }).then === "function"
      ) {
        throw TypeError("update() callbacks must be synchronous");
      }
      assertJson(key, result);
      this.document.entries[key] = {
        ...this.document.entries[key],
        value: cloneJson(result as T),
      };
    } catch (error) {
      console.error(
        `[state migration] updating "${key}" for version ${this.toVersion} failed`,
        error,
      );
      this.#reject(key, FAILED_REASON);
    }
  }

  rename(from: string, to: string) {
    if (!this.has(from) || from === to) return;
    if (!isValidKey(to)) {
      throw TypeError(`Invalid saved state key "${to}"`);
    }
    this.document.entries[to] = this.document.entries[from];
    delete this.document.entries[from];
  }

  remove(key: string) {
    delete this.document.entries[key];
  }
}

export interface RunStateMigrationsOptions {
  /** Timestamp for the new document. Default now. */
  now?: string;
  applicationTitle?: string;
}

/**
 * Copies `document` forward to `toVersion`, running each migration whose
 * version is above the document's version and no higher than `toVersion`,
 * in ascending order. `document` is not modified.
 *
 * Errors inside `update` reject only that entry. Any other error aborts the
 * whole carry-forward and is thrown as a StateMigrationError.
 *
 * Exported for applications to test their migrations against fixtures.
 */
export async function runStateMigrations(
  document: StateDocument,
  migrations: readonly StateMigration[],
  toVersion: number,
  {
    applicationTitle,
    now = new Date().toISOString(),
  }: RunStateMigrationsOptions = {},
): Promise<StateMigrationResult> {
  const sourceVersion = document.applicationVersion;
  if (toVersion <= sourceVersion) {
    throw new StateMigrationError(
      `Cannot carry saved state from version ${sourceVersion} to version ${toVersion}`,
      toVersion,
    );
  }
  validateStateMigrations(migrations, toVersion);

  const working = cloneStateDocument(document);
  const rejected: NotCarriedForwardRecord[] = [];
  const notifications: string[] = [];
  const applied: number[] = [];

  const steps = migrations
    .filter(({ version }) => version > sourceVersion && version <= toVersion)
    .sort((a, b) => a.version - b.version);

  let fromVersion = sourceVersion;
  for (const migration of steps) {
    const state = new MigratableStateImpl(
      working,
      sourceVersion,
      rejected,
      notifications,
      now,
      fromVersion,
      migration.version,
    );
    try {
      await migration.migrate(state);
    } catch (error) {
      throw new StateMigrationError(
        `Saved state migration to version ${migration.version} failed`,
        migration.version,
        error,
      );
    }
    applied.push(migration.version);
    fromVersion = migration.version;
  }

  const title = applicationTitle ?? document.applicationTitle;
  const migrated: StateDocument = {
    schemaVersion: working.schemaVersion,
    user: working.user,
    applicationKey: working.applicationKey,
    applicationVersion: toVersion,
    ...(title === undefined ? {} : { applicationTitle: title }),
    revision: 0,
    carriedForwardFrom: sourceVersion,
    createdAt: now,
    updatedAt: now,
    entries: working.entries,
    migrationsApplied: applied,
    ...(rejected.length > 0 ? { notCarriedForward: rejected } : {}),
  };
  return { document: migrated, notifications };
}
