import {
  type ApplicationStateStore,
  ApplicationStateStoreImpl,
  type CarryForwardReport,
  type GetStoreOptions,
  type StateChangeEvent,
  type StoreHost,
  type StoreLimits,
} from "./ApplicationStateStore";
import {
  type DocumentRef,
  type DocumentSummary,
  type PersistenceBackend,
  PersistenceConflictError,
  type PersistenceError,
  refId,
} from "./PersistenceBackend";
import {
  type StateDocument,
  cloneStateDocument,
  isEmptyStateDocument,
} from "./StateDocument";

export type ClearSelection = ReadonlyArray<{
  applicationKey: string;
  applicationVersion: number;
  /** Omit to clear the whole document. */
  keys?: readonly string[];
  /** Keys of `notCarriedForward` records to remove (§9.15). */
  notCarriedForward?: readonly string[];
  /** Clear the retained copy of unreadable data (§7.2, §9.9). */
  unreadable?: boolean;
}>;

export interface ClearResult {
  cleared: ReadonlyArray<{ ref: DocumentRef; keys: readonly string[] | "all" }>;
  failed: ReadonlyArray<{ ref: DocumentRef; error: Error }>;
  /**
   * Open applications that were cleared but don't subscribe to changes, so
   * can't return to their default view without a reload (§9.7).
   */
  requiresReload: readonly DocumentRef[];
}

export interface PersistenceProblem {
  ref: DocumentRef;
  error: PersistenceError;
}

export interface PortalPersistenceService {
  readonly user: string;
  getStore(
    applicationKey: string,
    applicationVersion: number,
    options?: GetStoreOptions,
  ): ApplicationStateStore;
  list(): Promise<readonly DocumentSummary[]>;
  clear(selection: ClearSelection): Promise<ClearResult>;
  clearAll(): Promise<ClearResult>;
  flushAll(): Promise<void>;
  subscribe(
    listener: (ref: DocumentRef, event: StateChangeEvent) => void,
  ): () => void;
  /** Records that an application is mounted; returns a release function. */
  markOpen(applicationKey: string, applicationVersion: number): () => void;
  isOpen(applicationKey: string, applicationVersion?: number): boolean;
  /** Stores whose last load or save failed (e.g. storage is full). */
  problems(): readonly PersistenceProblem[];
  /**
   * Returns the carry-forward report for a store once, so that the user is
   * told about it when the application first renders (§5.4.7).
   */
  consumeCarryForwardReport(
    applicationKey: string,
    applicationVersion: number,
  ): CarryForwardReport | undefined;
  dispose(): void;
}

export interface PortalPersistenceServiceOptions {
  backend: PersistenceBackend;
  user: string;
  /** Debounce window for writes, in ms. Default 500 (FR-5). */
  debounceMs?: number;
  /** Largest serialised value, in bytes. Default 256 KB (NFR-3). */
  maxEntrySize?: number;
  /** Largest serialised document, in bytes. Default 1 MB (NFR-3). */
  maxDocumentSize?: number;
  /**
   * Window whose `visibilitychange` and `pagehide` events flush pending
   * writes (FR-6). Default the global window; `null` for none.
   */
  window?: Window | null;
  now?: () => Date;
}

export const DEFAULT_DEBOUNCE_MS = 500;
export const DEFAULT_MAX_ENTRY_SIZE = 256 * 1024;
export const DEFAULT_MAX_DOCUMENT_SIZE = 1024 * 1024;

class DefaultPortalPersistenceService
  implements PortalPersistenceService, StoreHost
{
  readonly backend: PersistenceBackend;
  readonly user: string;
  readonly debounceMs: number;
  readonly limits: StoreLimits;

  #stores = new Map<string, ApplicationStateStoreImpl>();
  #listeners = new Set<(ref: DocumentRef, event: StateChangeEvent) => void>();
  #open = new Map<string, number>();
  #now: () => Date;
  #disposed = false;
  #cleanup: Array<() => void> = [];

  constructor({
    backend,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    maxDocumentSize = DEFAULT_MAX_DOCUMENT_SIZE,
    maxEntrySize = DEFAULT_MAX_ENTRY_SIZE,
    now = () => new Date(),
    user,
    window: targetWindow = typeof window === "undefined" ? null : window,
  }: PortalPersistenceServiceOptions) {
    if (!user) {
      throw Error("PortalPersistenceService requires a user");
    }
    this.backend = backend;
    this.user = user;
    this.debounceMs = debounceMs;
    this.limits = { maxDocumentSize, maxEntrySize };
    this.#now = now;

    if (backend.subscribe) {
      this.#cleanup.push(
        backend.subscribe(user, (ref) => this.#handleExternalChange(ref)),
      );
    }
    if (targetWindow) {
      const flush = () => {
        this.flushAll().catch(() => undefined);
      };
      const handleVisibility = () => {
        if (targetWindow.document.visibilityState === "hidden") flush();
      };
      targetWindow.addEventListener("pagehide", flush);
      targetWindow.document.addEventListener(
        "visibilitychange",
        handleVisibility,
      );
      this.#cleanup.push(() => {
        targetWindow.removeEventListener("pagehide", flush);
        targetWindow.document.removeEventListener(
          "visibilitychange",
          handleVisibility,
        );
      });
    }
  }

  // ------------------------------------------------------------ StoreHost

  now() {
    return this.#now().toISOString();
  }

  isDisposed() {
    return this.#disposed;
  }

  async listVersions(applicationKey: string) {
    const summaries = await this.backend.list(this.user);
    return summaries
      .filter(
        (summary) =>
          summary.applicationKey === applicationKey && !summary.unreadable,
      )
      .map(({ applicationVersion }) => applicationVersion);
  }

  async hasEarlierVersion(applicationKey: string, version: number) {
    const versions = await this.listVersions(applicationKey);
    return versions.some((v) => v < version);
  }

  onChange(ref: DocumentRef, event: StateChangeEvent) {
    for (const listener of [...this.#listeners]) {
      try {
        listener(ref, event);
      } catch (error) {
        console.error("[PortalPersistenceService] listener failed", error);
      }
    }
  }

  onCodeUnavailable(store: ApplicationStateStoreImpl) {
    const id = refId(store);
    if (this.#stores.get(id) === store) {
      this.#stores.delete(id);
      store.dispose();
    }
  }

  // --------------------------------------------------------------- stores

  getStore(
    applicationKey: string,
    applicationVersion: number,
    options: GetStoreOptions = {},
  ): ApplicationStateStore {
    if (this.#disposed) {
      throw Error("PortalPersistenceService has been disposed");
    }
    const id = refId({ applicationKey, applicationVersion });
    let store = this.#stores.get(id);
    if (!store) {
      store = new ApplicationStateStoreImpl(
        this,
        applicationKey,
        applicationVersion,
        options.title,
      );
      this.#stores.set(id, store);
      store.load(options.migrations);
    }
    return store;
  }

  #cachedStore(applicationKey: string, applicationVersion: number) {
    return this.#stores.get(refId({ applicationKey, applicationVersion }));
  }

  consumeCarryForwardReport(
    applicationKey: string,
    applicationVersion: number,
  ) {
    return this.#cachedStore(
      applicationKey,
      applicationVersion,
    )?.consumeCarryForwardReport();
  }

  markOpen(applicationKey: string, applicationVersion: number) {
    const id = refId({ applicationKey, applicationVersion });
    this.#open.set(id, (this.#open.get(id) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const count = (this.#open.get(id) ?? 1) - 1;
      if (count > 0) {
        this.#open.set(id, count);
      } else {
        this.#open.delete(id);
      }
    };
  }

  isOpen(applicationKey: string, applicationVersion?: number) {
    if (applicationVersion !== undefined) {
      return this.#open.has(refId({ applicationKey, applicationVersion }));
    }
    const prefix = `${applicationKey}\u0000`;
    for (const id of this.#open.keys()) {
      if (id.startsWith(prefix)) return true;
    }
    return false;
  }

  problems() {
    const problems: PersistenceProblem[] = [];
    for (const store of this.#stores.values()) {
      if (store.status === "error" && store.error) {
        problems.push({ ref: store.ref, error: store.error });
      }
    }
    return problems;
  }

  // ------------------------------------------------------------ listing

  async flushAll() {
    await Promise.all([...this.#stores.values()].map((store) => store.flush()));
  }

  async list() {
    await this.flushAll().catch(() => undefined);
    return this.backend.list(this.user);
  }

  subscribe(listener: (ref: DocumentRef, event: StateChangeEvent) => void) {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #handleExternalChange(ref: DocumentRef | undefined) {
    if (this.#disposed) return;
    const stores = ref
      ? [this.#cachedStore(ref.applicationKey, ref.applicationVersion)]
      : [...this.#stores.values()];
    for (const store of stores) {
      store?.reloadExternal();
    }
    if (ref && !stores[0]) {
      // Not open here, but the Saved state UI may be showing it.
      this.onChange(ref, { keys: [], reason: "external" });
    }
  }

  // ------------------------------------------------------------- clearing

  async clear(selection: ClearSelection): Promise<ClearResult> {
    const cleared: Array<{
      ref: DocumentRef;
      keys: readonly string[] | "all";
    }> = [];
    const failed: Array<{ ref: DocumentRef; error: Error }> = [];
    const requiresReload: DocumentRef[] = [];
    const affectedApplications = new Set<string>();

    // Ascending versions, so that when several versions are cleared together
    // the earlier ones have gone before later ones decide whether to keep an
    // empty document (see ApplicationStateStore #write).
    const items = [...selection].sort(
      (a, b) =>
        a.applicationKey.localeCompare(b.applicationKey) ||
        a.applicationVersion - b.applicationVersion,
    );

    for (const item of items) {
      const ref: DocumentRef = {
        user: this.user,
        applicationKey: item.applicationKey,
        applicationVersion: item.applicationVersion,
      };
      const keys = item.keys ?? "all";
      const notCarriedForward =
        item.keys === undefined ? "all" : (item.notCarriedForward ?? []);
      try {
        if (item.unreadable) {
          await this.backend.delete(ref, { unreadable: true });
        } else {
          const store = this.#cachedStore(
            item.applicationKey,
            item.applicationVersion,
          );
          if (store) {
            await store.applyClear({ keys, notCarriedForward });
            if (
              this.isOpen(item.applicationKey, item.applicationVersion) &&
              store.subscriberCount === 0
            ) {
              requiresReload.push(ref);
            }
          } else {
            await this.#clearStoredDocument(ref, keys, notCarriedForward);
            this.onChange(ref, {
              keys: keys === "all" ? [] : keys,
              reason: "clear",
            });
          }
        }
        cleared.push({ ref, keys });
        affectedApplications.add(item.applicationKey);
      } catch (error) {
        failed.push({
          ref,
          error: error instanceof Error ? error : Error(String(error)),
        });
      }
    }

    await this.#removeEmptyDocuments(affectedApplications);
    return { cleared, failed, requiresReload };
  }

  async #clearStoredDocument(
    ref: DocumentRef,
    keys: readonly string[] | "all",
    notCarriedForward: readonly string[] | "all",
  ) {
    const apply = (document: StateDocument) => {
      const updated = cloneStateDocument(document);
      if (keys === "all") {
        updated.entries = {};
      } else {
        for (const key of keys) delete updated.entries[key];
      }
      const records = (updated.notCarriedForward ?? []).filter(
        ({ key }) =>
          notCarriedForward !== "all" && !notCarriedForward.includes(key),
      );
      if (records.length > 0) {
        updated.notCarriedForward = records;
      } else {
        delete updated.notCarriedForward;
      }
      updated.updatedAt = this.now();
      return updated;
    };

    const write = async (document: StateDocument | undefined) => {
      if (!document) return;
      const updated = apply(document);
      if (
        isEmptyStateDocument(updated) &&
        !(await this.hasEarlierVersion(
          ref.applicationKey,
          ref.applicationVersion,
        ))
      ) {
        await this.backend.delete(ref);
      } else {
        await this.backend.save(updated, document.revision);
      }
    };

    try {
      await write(await this.backend.load(ref));
    } catch (error) {
      if (!(error instanceof PersistenceConflictError)) throw error;
      await write(error.current ?? (await this.backend.load(ref)));
    }
  }

  /**
   * Deletes documents kept empty only to stop earlier state being carried
   * forward, once the application has nothing else saved.
   */
  async #removeEmptyDocuments(applicationKeys: ReadonlySet<string>) {
    if (applicationKeys.size === 0) return;
    try {
      const summaries = await this.backend.list(this.user);
      for (const applicationKey of applicationKeys) {
        const documents = summaries.filter(
          (summary) => summary.applicationKey === applicationKey,
        );
        const allEmpty = documents.every(
          (summary) =>
            !summary.unreadable &&
            summary.entries.length === 0 &&
            (summary.notCarriedForward?.length ?? 0) === 0,
        );
        if (!allEmpty) continue;
        for (const { applicationVersion } of documents) {
          const ref = { user: this.user, applicationKey, applicationVersion };
          const store = this.#cachedStore(applicationKey, applicationVersion);
          if (store?.hasPendingChanges) continue;
          await this.backend.delete(ref);
          store?.markDeleted();
        }
      }
    } catch (error) {
      console.warn(
        "[PortalPersistenceService] unable to tidy empty saved state",
        error,
      );
    }
  }

  async clearAll() {
    const summaries = await this.list();
    const selection = summaries.map(
      ({ applicationKey, applicationVersion, unreadable }) => ({
        applicationKey,
        applicationVersion,
        ...(unreadable ? { unreadable } : {}),
      }),
    );
    // Clear stores that are open but have nothing saved yet, too.
    for (const store of this.#stores.values()) {
      if (
        store.keys().length > 0 &&
        !selection.some(
          (item) =>
            item.applicationKey === store.applicationKey &&
            item.applicationVersion === store.applicationVersion,
        )
      ) {
        selection.push({
          applicationKey: store.applicationKey,
          applicationVersion: store.applicationVersion,
        });
      }
    }
    return this.clear(selection);
  }

  dispose() {
    if (this.#disposed) return;
    this.#disposed = true;
    for (const cleanup of this.#cleanup) cleanup();
    this.#cleanup = [];
    for (const store of this.#stores.values()) {
      // FR-6: pending writes are still written after disposal.
      store.flush().catch(() => undefined);
      store.dispose();
    }
    this.#stores.clear();
    this.#listeners.clear();
    this.#open.clear();
  }
}

export const createPortalPersistenceService = (
  options: PortalPersistenceServiceOptions,
): PortalPersistenceService => new DefaultPortalPersistenceService(options);
