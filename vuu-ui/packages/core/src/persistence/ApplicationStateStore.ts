import type { DocumentRef, PersistenceBackend } from "./PersistenceBackend";
import {
  PersistenceConflictError,
  PersistenceError,
  PersistenceQuotaError,
  PersistenceValidationError,
} from "./PersistenceBackend";
import {
  type EntryMetadata,
  type JsonValue,
  type NotCarriedForwardRecord,
  type StateDocument,
  type StateEntry,
  cloneJson,
  cloneStateDocument,
  createStateDocument,
  deepFreeze,
  findNonJsonValue,
  isEmptyStateDocument,
  isValidKey,
  jsonEqual,
  storageSize,
} from "./StateDocument";
import {
  StateMigrationError,
  type StateMigration,
  runStateMigrations,
} from "./StateMigrations";

export type StateChangeReason = "set" | "remove" | "clear" | "external";

export interface StateChangeEvent {
  keys: readonly string[];
  reason: StateChangeReason;
}

export type ApplicationStateStatus = "loading" | "ready" | "error";

/** What happened when a new version's document was carried forward (§5.4.3). */
export interface CarryForwardReport {
  applicationKey: string;
  applicationTitle?: string;
  fromVersion: number;
  toVersion: number;
  /** Entries a migration rejected. */
  rejected: readonly NotCarriedForwardRecord[];
  /** `notify` messages from migrations. */
  notifications: readonly string[];
  /** True when a migration failed and the version started empty. */
  aborted: boolean;
}

export interface ApplicationStateStore {
  readonly applicationKey: string;
  readonly applicationVersion: number;
  readonly status: ApplicationStateStatus;
  /** Resolves when the document has been loaded (or failed to load). */
  readonly ready: Promise<void>;
  /** The most recent load or save failure, if the store is in error. */
  readonly error: PersistenceError | undefined;

  get<T extends JsonValue = JsonValue>(key: string): T | undefined;
  getAll(): Readonly<Record<string, JsonValue>>;
  has(key: string): boolean;
  keys(): readonly string[];

  /**
   * Updates the in-memory value immediately; persistence is debounced.
   * `formatVersion` is set by components that version their own values (§5.4.6).
   */
  set<T extends JsonValue>(
    key: string,
    value: T,
    options?: EntryMetadata & { formatVersion?: number },
  ): void;
  /** Declares metadata for a key without setting a value. */
  describe(key: string, metadata: EntryMetadata): void;
  remove(key: string): void;
  /** Removes every entry for this application version. */
  clear(): void;

  /** Writes any pending changes now. */
  flush(): Promise<void>;
  subscribe(listener: (event: StateChangeEvent) => void): () => void;

  /** Versions of this application that have saved documents, newest first. */
  previousVersions(): Promise<readonly number[]>;
  /** Copies entries (optionally a subset / transformed) from an earlier version. */
  importFrom(
    version: number,
    options?: {
      keys?: readonly string[];
      transform?: (key: string, value: JsonValue) => JsonValue | undefined;
    },
  ): Promise<readonly string[]>;
}

export interface GetStoreOptions {
  /** Display title, recorded in the document for the Saved state UI. */
  title?: string;
  /**
   * Release migrations used if this version's document has to be carried
   * forward (§5.4.4). May be a promise, so that the document can be loaded in
   * parallel with the application code that exports them. A rejected promise
   * means the code couldn't be loaded, so no carry-forward happens.
   */
  migrations?: readonly StateMigration[] | Promise<readonly StateMigration[]>;
}

export interface StoreLimits {
  maxEntrySize: number;
  maxDocumentSize: number;
}

/** @internal what a store needs from its PortalPersistenceService. */
export interface StoreHost {
  readonly backend: PersistenceBackend;
  readonly user: string;
  readonly debounceMs: number;
  readonly limits: StoreLimits;
  now(): string;
  isDisposed(): boolean;
  hasEarlierVersion(applicationKey: string, version: number): Promise<boolean>;
  listVersions(applicationKey: string): Promise<readonly number[]>;
  onChange(ref: DocumentRef, event: StateChangeEvent): void;
  onCodeUnavailable(store: ApplicationStateStoreImpl): void;
}

export const isDevelopment = () => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
};

const logPrefix = "[ApplicationStateStore]";

type EntryOptions = EntryMetadata & { formatVersion?: number };

const metadataOf = ({ group, label }: EntryMetadata): EntryMetadata => ({
  ...(label === undefined ? {} : { label }),
  ...(group === undefined ? {} : { group }),
});

const freezeEntries = (document: StateDocument) => {
  for (const entry of Object.values(document.entries)) {
    deepFreeze(entry.value);
  }
  return document;
};

const toPersistenceError = (
  error: unknown,
  ref: DocumentRef,
  operation: "load" | "save",
) =>
  error instanceof PersistenceError
    ? error
    : new PersistenceError(
        error instanceof Error ? error.message : String(error),
        { cause: error, operation, ref },
      );

/** @internal created and cached by PortalPersistenceService.getStore. */
export class ApplicationStateStoreImpl implements ApplicationStateStore {
  readonly applicationKey: string;
  readonly applicationVersion: number;
  readonly ready: Promise<void>;

  #host: StoreHost;
  #title: string | undefined;
  #status: ApplicationStateStatus = "loading";
  #error: PersistenceError | undefined;
  #loadFailed = false;
  #document: StateDocument;
  #described = new Map<string, EntryMetadata>();
  #dirty = new Map<string, number>();
  #notCarriedForwardDirty = false;
  #sequence = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #saving: Promise<void> | undefined;
  #listeners = new Set<(event: StateChangeEvent) => void>();
  #resolveReady!: () => void;
  #carryForward: CarryForwardReport | undefined;
  #carryForwardConsumed = false;
  #disposed = false;

  constructor(
    host: StoreHost,
    applicationKey: string,
    applicationVersion: number,
    title?: string,
  ) {
    this.#host = host;
    this.applicationKey = applicationKey;
    this.applicationVersion = applicationVersion;
    this.#title = title;
    this.#document = this.#emptyDocument();
    this.ready = new Promise((resolve) => {
      this.#resolveReady = resolve;
    });
  }

  get ref(): DocumentRef {
    return {
      user: this.#host.user,
      applicationKey: this.applicationKey,
      applicationVersion: this.applicationVersion,
    };
  }

  get status() {
    return this.#status;
  }

  get error() {
    return this.#error;
  }

  get subscriberCount() {
    return this.#listeners.size;
  }

  get title() {
    return this.#title ?? this.#document.applicationTitle;
  }

  #emptyDocument() {
    return createStateDocument({
      ...this.ref,
      applicationTitle: this.#title,
      now: this.#host.now(),
    });
  }

  // ---------------------------------------------------------------- loading

  async load(
    migrations?: readonly StateMigration[] | Promise<readonly StateMigration[]>,
  ) {
    // Only awaited if carry-forward is needed; don't report it as unhandled.
    Promise.resolve(migrations).catch(() => undefined);
    try {
      const document =
        (await this.#host.backend.load(this.ref)) ??
        (await this.#carryForwardFrom(migrations));
      if (document) {
        this.#document = freezeEntries(cloneStateDocument(document));
        this.#refreshTitle();
      }
      this.#status = "ready";
    } catch (error) {
      this.#loadFailed = true;
      this.#status = "error";
      this.#error = toPersistenceError(error, this.ref, "load");
      console.error(
        `${logPrefix} unable to load saved state for ${this.applicationKey} v${this.applicationVersion}; using defaults`,
        error,
      );
    } finally {
      this.#resolveReady();
      const keys = this.keys();
      if (keys.length > 0) {
        this.#emit({ keys, reason: "external" }, false);
      }
    }
  }

  #refreshTitle() {
    if (
      this.#title !== undefined &&
      this.#title !== this.#document.applicationTitle
    ) {
      this.#document.applicationTitle = this.#title;
    }
  }

  async #carryForwardFrom(
    migrationsSource:
      | readonly StateMigration[]
      | Promise<readonly StateMigration[]>
      | undefined,
  ): Promise<StateDocument | undefined> {
    const { backend, user } = this.#host;
    const versions = await this.#host.listVersions(this.applicationKey);
    const fromVersion = versions
      .filter((version) => version < this.applicationVersion)
      .sort((a, b) => b - a)[0];
    if (fromVersion === undefined) {
      return undefined;
    }
    const source = await backend.load({
      user,
      applicationKey: this.applicationKey,
      applicationVersion: fromVersion,
    });
    if (!source) {
      return undefined;
    }

    let migrations: readonly StateMigration[];
    try {
      migrations = (await migrationsSource) ?? [];
    } catch {
      // The application code couldn't be loaded; try again next time.
      this.#host.onCodeUnavailable(this);
      return undefined;
    }

    let migrated: StateDocument;
    let notifications: readonly string[];
    try {
      ({ document: migrated, notifications } = await runStateMigrations(
        source,
        migrations,
        this.applicationVersion,
        { applicationTitle: this.#title, now: this.#host.now() },
      ));
    } catch (error) {
      console.error(
        `${logPrefix} saved state for ${this.applicationKey} couldn't be carried forward from version ${fromVersion} to ${this.applicationVersion}`,
        error instanceof StateMigrationError && error.cause
          ? error.cause
          : error,
        error,
      );
      this.#carryForward = {
        applicationKey: this.applicationKey,
        applicationTitle: this.title ?? source.applicationTitle,
        fromVersion,
        toVersion: this.applicationVersion,
        rejected: [],
        notifications: [],
        aborted: true,
      };
      return undefined;
    }

    try {
      const { revision } = await backend.save(migrated, 0);
      migrated.revision = revision;
    } catch (error) {
      if (error instanceof PersistenceConflictError && error.current) {
        // Another tab carried forward first: use its result.
        return error.current;
      }
      // Keep the carried-forward state in memory and retry on the next save.
      this.#error = toPersistenceError(error, this.ref, "save");
      console.error(
        `${logPrefix} unable to save carried-forward state for ${this.applicationKey}`,
        error,
      );
      for (const key of Object.keys(migrated.entries)) {
        this.#markDirty(key);
      }
      this.#notCarriedForwardDirty = true;
    }

    this.#carryForward = {
      applicationKey: this.applicationKey,
      applicationTitle: this.title ?? source.applicationTitle,
      fromVersion,
      toVersion: this.applicationVersion,
      rejected: migrated.notCarriedForward ?? [],
      notifications,
      aborted: false,
    };
    return migrated;
  }

  /** Returns the carry-forward report once, for the first render (§5.4.7). */
  consumeCarryForwardReport() {
    if (this.#carryForwardConsumed) return undefined;
    this.#carryForwardConsumed = true;
    return this.#carryForward;
  }

  // ---------------------------------------------------------------- reading

  get<T extends JsonValue = JsonValue>(key: string): T | undefined {
    return this.#document.entries[key]?.value as T | undefined;
  }

  getAll() {
    const values: Record<string, JsonValue> = {};
    for (const [key, { value }] of Object.entries(this.#document.entries)) {
      values[key] = value;
    }
    return Object.freeze(values);
  }

  has(key: string) {
    return Object.hasOwn(this.#document.entries, key);
  }

  keys() {
    return Object.keys(this.#document.entries);
  }

  /** @internal a copy of the in-memory document. */
  snapshot() {
    return cloneStateDocument(this.#document);
  }

  // ---------------------------------------------------------------- writing

  #canWrite(operation: string) {
    if (this.#disposed || this.#host.isDisposed()) {
      console.warn(
        `${logPrefix} ${operation}(): the persistence service has been disposed`,
      );
      return false;
    }
    if (this.#status === "loading") {
      console.error(
        `${logPrefix} ${operation}() was called before saved state for ${this.applicationKey} was ready; await store.ready first`,
      );
      return false;
    }
    return true;
  }

  #reject(message: string, ErrorType: typeof Error = TypeError) {
    if (isDevelopment()) {
      throw new ErrorType(`${logPrefix} ${message}`);
    }
    console.error(`${logPrefix} ${message}`);
  }

  set<T extends JsonValue>(key: string, value: T, options?: EntryOptions) {
    if (!isValidKey(key)) {
      return this.#reject(`invalid key "${String(key)}"`);
    }
    const problem = findNonJsonValue(value);
    if (problem) {
      return this.#reject(`value for "${key}" is not JSON: ${problem}`);
    }
    if (!this.#canWrite("set")) return;

    const serialised = JSON.stringify(value);
    const { maxDocumentSize, maxEntrySize } = this.#host.limits;
    const entrySize = storageSize(serialised);
    if (entrySize > maxEntrySize) {
      console.error(
        `${logPrefix} "${key}" was not saved: ${entrySize} bytes exceeds the ${maxEntrySize} byte limit for one item`,
      );
      return;
    }

    const existing = this.#document.entries[key];
    const metadata = metadataOf({
      ...this.#described.get(key),
      ...(existing ? metadataOf(existing) : undefined),
      ...(options ? metadataOf(options) : undefined),
    });
    const formatVersion = options?.formatVersion ?? existing?.formatVersion;
    const valueChanged = !existing || !jsonEqual(existing.value, value);
    const metadataChanged =
      !existing ||
      existing.label !== metadata.label ||
      existing.group !== metadata.group ||
      existing.formatVersion !== formatVersion;
    if (!valueChanged && !metadataChanged) return;

    const entry: StateEntry = {
      value: valueChanged
        ? deepFreeze(JSON.parse(serialised) as JsonValue)
        : (existing as StateEntry).value,
      updatedAt: valueChanged
        ? this.#host.now()
        : (existing as StateEntry).updatedAt,
      ...metadata,
      ...(formatVersion === undefined ? {} : { formatVersion }),
    };

    const documentSize =
      storageSize(JSON.stringify(this.#document)) -
      (existing ? storageSize(JSON.stringify(existing)) : 0) +
      storageSize(JSON.stringify(entry));
    if (documentSize > maxDocumentSize) {
      console.error(
        `${logPrefix} "${key}" was not saved: saved state for ${this.applicationKey} would exceed the ${maxDocumentSize} byte limit`,
      );
      return;
    }

    this.#document.entries[key] = entry;
    this.#markDirty(key);
    if (valueChanged) {
      this.#emit({ keys: [key], reason: "set" });
    }
    this.#schedule();
  }

  describe(key: string, metadata: EntryMetadata) {
    if (!isValidKey(key)) {
      return this.#reject(`invalid key "${String(key)}"`);
    }
    this.#described.set(key, metadataOf(metadata));
    const existing = this.#document.entries[key];
    if (
      existing &&
      this.#status !== "loading" &&
      ((metadata.label !== undefined && existing.label !== metadata.label) ||
        (metadata.group !== undefined && existing.group !== metadata.group))
    ) {
      this.set(key, existing.value, metadata);
    }
  }

  remove(key: string) {
    if (!this.has(key) || !this.#canWrite("remove")) return;
    delete this.#document.entries[key];
    this.#markDirty(key);
    this.#emit({ keys: [key], reason: "remove" });
    this.#schedule();
  }

  clear() {
    if (!this.#canWrite("clear")) return;
    const keys = this.keys();
    if (keys.length === 0) return;
    this.#document.entries = {};
    for (const key of keys) this.#markDirty(key);
    this.#emit({ keys, reason: "clear" });
    this.#flushSoon();
  }

  #markDirty(key: string) {
    this.#dirty.set(key, ++this.#sequence);
  }

  #schedule() {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      this.flush().catch(() => undefined);
    }, this.#host.debounceMs);
  }

  #flushSoon() {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.flush().catch(() => undefined);
  }

  get hasPendingChanges() {
    return this.#dirty.size > 0 || this.#notCarriedForwardDirty;
  }

  /** Runs operations one at a time, so saves never overlap. */
  #enqueue(operation: () => Promise<void>) {
    const previous = this.#saving ?? Promise.resolve();
    const next = previous.then(operation, operation);
    const tracked = next.finally(() => {
      if (this.#saving === tracked) this.#saving = undefined;
    });
    this.#saving = tracked;
    return next;
  }

  async flush() {
    await this.ready;
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
    await this.#enqueue(() => this.#persist().catch(() => undefined));
  }

  /** Writes pending changes; rejects if they couldn't be written. */
  async #persist() {
    if (this.#loadFailed || !this.hasPendingChanges) return;
    const pending = new Map(this.#dirty);
    const notCarriedForwardPending = this.#notCarriedForwardDirty;
    const document = { ...this.snapshot(), updatedAt: this.#host.now() };
    try {
      try {
        await this.#write(document, this.#document.revision);
      } catch (error) {
        if (!(error instanceof PersistenceConflictError)) throw error;
        // FR-10: reapply only our changed keys to the current document, once.
        const current =
          error.current ?? (await this.#host.backend.load(this.ref));
        const rebased = this.#rebase(
          current,
          pending,
          notCarriedForwardPending,
        );
        await this.#write(
          { ...rebased, updatedAt: this.#host.now() },
          current?.revision ?? 0,
        );
        this.#adopt(rebased, "external");
      }
      for (const [key, sequence] of pending) {
        if (this.#dirty.get(key) === sequence) this.#dirty.delete(key);
      }
      if (notCarriedForwardPending) this.#notCarriedForwardDirty = false;
      this.#status = "ready";
      this.#error = undefined;
    } catch (error) {
      this.#status = "error";
      this.#error = toPersistenceError(error, this.ref, "save");
      console.error(
        `${logPrefix} unable to save state for ${this.applicationKey} v${this.applicationVersion}${
          error instanceof PersistenceQuotaError
            ? ": browser storage is full"
            : ""
        }`,
        error,
      );
      throw this.#error;
    }
  }

  async #write(document: StateDocument, expectedRevision: number) {
    const { backend } = this.#host;
    if (isEmptyStateDocument(document)) {
      // FR-14, except that an empty document is kept while an earlier version
      // exists, so the cleared state isn't carried forward again.
      if (
        await this.#host.hasEarlierVersion(
          this.applicationKey,
          this.applicationVersion,
        )
      ) {
        const { revision } = await backend.save(document, expectedRevision);
        this.#document.revision = revision;
      } else {
        if (expectedRevision > 0) {
          await backend.delete(this.ref);
        }
        this.#document.revision = 0;
      }
      return;
    }
    const { revision } = await backend.save(document, expectedRevision);
    this.#document.revision = revision;
  }

  /** The current stored document with our pending changes reapplied. */
  #rebase(
    current: StateDocument | undefined,
    pending: ReadonlyMap<string, number>,
    notCarriedForwardPending: boolean,
  ) {
    const base = current ? cloneStateDocument(current) : this.#emptyDocument();
    for (const key of pending.keys()) {
      const local = this.#document.entries[key];
      if (local) {
        base.entries[key] = local;
      } else {
        delete base.entries[key];
      }
    }
    if (notCarriedForwardPending) {
      if (this.#document.notCarriedForward?.length) {
        base.notCarriedForward = this.#document.notCarriedForward;
      } else {
        delete base.notCarriedForward;
      }
    }
    return freezeEntries(base);
  }

  /** Replaces the in-memory document, notifying listeners of changed keys. */
  #adopt(document: StateDocument, reason: StateChangeReason) {
    const previous = this.#document.entries;
    const next = document.entries;
    const changed = new Set<string>();
    for (const key of new Set([
      ...Object.keys(previous),
      ...Object.keys(next),
    ])) {
      const before = previous[key];
      const after = next[key];
      if (!before || !after || !jsonEqual(before.value, after.value)) {
        changed.add(key);
      }
    }
    const revision = this.#document.revision;
    this.#document = document;
    this.#document.revision = Math.max(revision, document.revision);
    this.#refreshTitle();
    if (changed.size > 0) {
      this.#emit({ keys: [...changed], reason });
    }
  }

  /** @internal FR-11: another tab or window changed this document. */
  reloadExternal() {
    if (this.#disposed) return Promise.resolve();
    return this.#enqueue(async () => {
      await this.ready;
      try {
        const current = await this.#host.backend.load(this.ref);
        const rebased = this.#rebase(
          current,
          this.#dirty,
          this.#notCarriedForwardDirty,
        );
        rebased.revision = current?.revision ?? 0;
        this.#document.revision = rebased.revision;
        this.#adopt(rebased, "external");
        if (this.#loadFailed) {
          this.#loadFailed = false;
          this.#status = "ready";
          this.#error = undefined;
          if (this.hasPendingChanges) this.#schedule();
        }
      } catch (error) {
        if (!(error instanceof PersistenceValidationError)) {
          console.error(`${logPrefix} unable to reload saved state`, error);
        }
      }
    });
  }

  /**
   * @internal clears keys (or everything) on behalf of the Saved state UI,
   * cancelling their pending writes (FR-13). Rejects if the change couldn't
   * be written.
   */
  applyClear({
    keys,
    notCarriedForward,
  }: {
    keys: readonly string[] | "all";
    notCarriedForward: readonly string[] | "all";
  }) {
    return this.#enqueue(async () => {
      await this.ready;
      if (this.#timer !== undefined) {
        clearTimeout(this.#timer);
        this.#timer = undefined;
      }
      const removed = (keys === "all" ? this.keys() : keys).filter((key) =>
        this.has(key),
      );
      for (const key of removed) {
        delete this.#document.entries[key];
        this.#markDirty(key);
      }
      const records = this.#document.notCarriedForward ?? [];
      const remaining =
        notCarriedForward === "all"
          ? []
          : records.filter(({ key }) => !notCarriedForward.includes(key));
      if (remaining.length !== records.length) {
        if (remaining.length > 0) {
          this.#document.notCarriedForward = remaining;
        } else {
          delete this.#document.notCarriedForward;
        }
        this.#notCarriedForwardDirty = true;
      }
      if (removed.length > 0) {
        this.#emit({ keys: removed, reason: "clear" });
      }
      if (this.#loadFailed) {
        throw new PersistenceError(
          "Saved state couldn't be loaded, so it can't be cleared",
          { operation: "clear", ref: this.ref },
        );
      }
      await this.#persist();
    });
  }

  /** @internal the stored document was deleted by the service. */
  markDeleted() {
    this.#document.revision = 0;
  }

  // ------------------------------------------------------------- versions

  async previousVersions() {
    const versions = await this.#host.listVersions(this.applicationKey);
    return versions
      .filter((version) => version < this.applicationVersion)
      .sort((a, b) => b - a);
  }

  async importFrom(
    version: number,
    {
      keys,
      transform,
    }: {
      keys?: readonly string[];
      transform?: (key: string, value: JsonValue) => JsonValue | undefined;
    } = {},
  ) {
    await this.ready;
    const source = await this.#host.backend.load({
      user: this.#host.user,
      applicationKey: this.applicationKey,
      applicationVersion: version,
    });
    if (!source) return [];
    const imported: string[] = [];
    for (const [key, entry] of Object.entries(source.entries)) {
      if (keys && !keys.includes(key)) continue;
      const value = transform
        ? transform(key, cloneJson(entry.value))
        : entry.value;
      if (value === undefined) continue;
      this.set(key, value, {
        ...metadataOf(entry),
        ...(entry.formatVersion === undefined
          ? {}
          : { formatVersion: entry.formatVersion }),
      });
      if (this.has(key)) imported.push(key);
    }
    return imported;
  }

  // ---------------------------------------------------------------- events

  subscribe(listener: (event: StateChangeEvent) => void) {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #emit(event: StateChangeEvent, notifyHost = true) {
    for (const listener of [...this.#listeners]) {
      try {
        listener(event);
      } catch (error) {
        console.error(`${logPrefix} a state change listener failed`, error);
      }
    }
    if (notifyHost) {
      this.#host.onChange(this.ref, event);
    }
  }

  /** @internal */
  dispose() {
    this.#disposed = true;
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
    this.#listeners.clear();
  }
}
