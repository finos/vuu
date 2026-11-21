import {
  type DeleteOptions,
  type DocumentRef,
  type DocumentSummary,
  type PersistenceBackend,
  PersistenceConflictError,
  PersistenceQuotaError,
  PersistenceValidationError,
  summarizeDocument,
} from "./PersistenceBackend";
import {
  InvalidStateDocumentError,
  type StateDocument,
  storageSize,
  validateStateDocument,
} from "./StateDocument";

export const DEFAULT_PORTAL_ID = "vuu-portal";

const CORRUPT_MARKER = "corrupt";

type StorageEventTarget = Pick<
  Window,
  "addEventListener" | "removeEventListener"
>;

export interface LocalStoragePersistenceBackendProps {
  /** Separates portals on the same origin. Default "vuu-portal". */
  portalId?: string;
  /** Default window.localStorage. Any Storage can be used, e.g. in tests. */
  storage?: Storage;
  /** Source of cross-tab `storage` events. Default window. */
  eventTarget?: StorageEventTarget | null;
  /** Clock used to timestamp retained copies of unreadable data. */
  now?: () => number;
}

const encode = encodeURIComponent;

const isQuotaExceeded = (error: unknown) =>
  error instanceof Error &&
  (error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    (error as { code?: number }).code === 22 ||
    (error as { code?: number }).code === 1014);

interface ParsedKey {
  applicationKey: string;
  applicationVersion: number;
  corrupt: boolean;
}

/**
 * Stores each state document as one localStorage item:
 * `vuu-portal:{portalId}:state:{user}:{applicationKey}:v{version}`, with each
 * segment URI-encoded. Documents are enumerated by key prefix, so there is no
 * separate index to keep in sync.
 */
export class LocalStoragePersistenceBackend implements PersistenceBackend {
  readonly portalId: string;
  readonly #storage: Storage;
  readonly #eventTarget: StorageEventTarget | null;
  readonly #now: () => number;

  constructor({
    eventTarget,
    now = Date.now,
    portalId = DEFAULT_PORTAL_ID,
    storage,
  }: LocalStoragePersistenceBackendProps = {}) {
    const resolvedStorage = storage ?? globalThis.localStorage;
    if (!resolvedStorage) {
      throw Error("LocalStoragePersistenceBackend: no Storage is available");
    }
    this.portalId = portalId;
    this.#storage = resolvedStorage;
    this.#eventTarget =
      eventTarget === undefined
        ? typeof window === "undefined"
          ? null
          : window
        : eventTarget;
    this.#now = now;
  }

  userPrefix(user: string) {
    return `vuu-portal:${encode(this.portalId)}:state:${encode(user)}:`;
  }

  storageKey({ applicationKey, applicationVersion, user }: DocumentRef) {
    return `${this.userPrefix(user)}${encode(applicationKey)}:v${applicationVersion}`;
  }

  #parseKey(user: string, key: string): ParsedKey | undefined {
    const prefix = this.userPrefix(user);
    if (!key.startsWith(prefix)) return undefined;
    const [applicationKey, version, marker, timestamp, ...rest] = key
      .slice(prefix.length)
      .split(":");
    if (!applicationKey || !version?.startsWith("v") || rest.length > 0) {
      return undefined;
    }
    const applicationVersion = Number(version.slice(1));
    if (!Number.isInteger(applicationVersion)) return undefined;
    const corrupt = marker === CORRUPT_MARKER && timestamp !== undefined;
    if (marker !== undefined && !corrupt) return undefined;
    try {
      return {
        applicationKey: decodeURIComponent(applicationKey),
        applicationVersion,
        corrupt,
      };
    } catch {
      return undefined;
    }
  }

  #keys() {
    const keys: string[] = [];
    for (let i = 0; i < this.#storage.length; i++) {
      const key = this.#storage.key(i);
      if (key !== null) keys.push(key);
    }
    return keys;
  }

  #corruptKeys(ref: DocumentRef) {
    const prefix = `${this.storageKey(ref)}:${CORRUPT_MARKER}:`;
    return this.#keys().filter((key) => key.startsWith(prefix));
  }

  /** Moves unreadable data aside, keeping one copy so it can be cleared. */
  #retainCorrupt(ref: DocumentRef, raw: string, reason: unknown) {
    const key = this.storageKey(ref);
    console.warn(
      '[LocalStoragePersistenceBackend] saved state at "%s" is unreadable and has been set aside',
      key,
      reason,
    );
    for (const corruptKey of this.#corruptKeys(ref)) {
      this.#storage.removeItem(corruptKey);
    }
    try {
      this.#storage.setItem(`${key}:${CORRUPT_MARKER}:${this.#now()}`, raw);
    } catch (error) {
      console.warn(
        "[LocalStoragePersistenceBackend] unable to retain unreadable saved state",
        error,
      );
    }
    this.#storage.removeItem(key);
  }

  #read(ref: DocumentRef): StateDocument | undefined {
    const raw = this.#storage.getItem(this.storageKey(ref));
    if (raw === null) return undefined;
    try {
      return validateStateDocument(JSON.parse(raw), ref);
    } catch (error) {
      if (
        error instanceof InvalidStateDocumentError &&
        error.unsupportedSchema
      ) {
        throw new PersistenceValidationError(error.message, ref, {
          cause: error,
          unsupportedSchema: true,
        });
      }
      this.#retainCorrupt(ref, raw, error);
      return undefined;
    }
  }

  async load(ref: DocumentRef) {
    return this.#read(ref);
  }

  async save(doc: StateDocument, expectedRevision?: number) {
    validateStateDocument(doc);
    const current = this.#read(doc);
    const currentRevision = current?.revision ?? 0;
    if (
      expectedRevision !== undefined &&
      expectedRevision !== currentRevision
    ) {
      throw new PersistenceConflictError(doc, current);
    }
    const revision = currentRevision + 1;
    try {
      this.#storage.setItem(
        this.storageKey(doc),
        JSON.stringify({ ...doc, revision }),
      );
    } catch (error) {
      if (isQuotaExceeded(error)) {
        throw new PersistenceQuotaError(doc, error);
      }
      throw error;
    }
    return { revision };
  }

  async delete(ref: DocumentRef, options?: DeleteOptions) {
    if (options?.unreadable) {
      for (const key of this.#corruptKeys(ref)) {
        this.#storage.removeItem(key);
      }
    } else {
      this.#storage.removeItem(this.storageKey(ref));
    }
  }

  async list(user: string): Promise<readonly DocumentSummary[]> {
    const documents: DocumentSummary[] = [];
    const unreadable = new Map<string, DocumentSummary>();
    const addUnreadable = (
      applicationKey: string,
      applicationVersion: number,
      size: number,
    ) => {
      unreadable.set(`${applicationKey}\u0000${applicationVersion}`, {
        applicationKey,
        applicationVersion,
        revision: 0,
        updatedAt: "",
        size,
        entries: [],
        unreadable: true,
      });
    };

    for (const key of this.#keys()) {
      const parsed = this.#parseKey(user, key);
      if (parsed === undefined) continue;
      const { applicationKey, applicationVersion, corrupt } = parsed;
      const raw = this.#storage.getItem(key);
      if (raw === null) continue;
      if (corrupt) {
        addUnreadable(applicationKey, applicationVersion, storageSize(raw));
        continue;
      }
      try {
        const document = this.#read({
          applicationKey,
          applicationVersion,
          user,
        });
        if (document) {
          documents.push(summarizeDocument(document, storageSize(raw)));
        } else {
          addUnreadable(applicationKey, applicationVersion, storageSize(raw));
        }
      } catch (error) {
        // Written by a newer portal: not ours to list or clear.
        console.warn(error);
      }
    }
    return [...documents, ...unreadable.values()];
  }

  subscribe(user: string, listener: (ref: DocumentRef | undefined) => void) {
    const target = this.#eventTarget;
    if (!target) return () => undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== this.#storage) return;
      if (event.key === null) {
        listener(undefined);
        return;
      }
      const parsed = this.#parseKey(user, event.key);
      if (parsed && !parsed.corrupt) {
        listener({
          applicationKey: parsed.applicationKey,
          applicationVersion: parsed.applicationVersion,
          user,
        });
      }
    };
    target.addEventListener("storage", handleStorage);
    return () => target.removeEventListener("storage", handleStorage);
  }
}
