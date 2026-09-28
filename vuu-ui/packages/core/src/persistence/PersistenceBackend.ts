import {
  type EntryMetadata,
  type NotCarriedForwardRecord,
  type StateDocument,
  storageSize,
} from "./StateDocument";

export interface DocumentRef {
  user: string;
  applicationKey: string;
  applicationVersion: number;
}

export interface EntrySummary extends EntryMetadata {
  key: string;
  updatedAt: string;
  /** Serialised size in bytes (UTF-16 length × 2 for localStorage). */
  size: number;
}

export interface DocumentSummary extends Omit<DocumentRef, "user"> {
  applicationTitle?: string;
  revision: number;
  /** Empty when the document is unreadable. */
  updatedAt: string;
  size: number;
  entries: readonly EntrySummary[];
  carriedForwardFrom?: number;
  notCarriedForward?: readonly NotCarriedForwardRecord[];
  /**
   * The stored data couldn't be read (§7.2). It is listed so that it can be
   * cleared, but has no entries.
   */
  unreadable?: boolean;
}

export interface DeleteOptions {
  /** Delete only the retained copy of unreadable data for this ref. */
  unreadable?: boolean;
}

export interface PersistenceBackend {
  load(ref: DocumentRef): Promise<StateDocument | undefined>;
  /**
   * Saves the document and returns its new revision. The backend assigns the
   * revision; `doc.revision` is ignored.
   *
   * If expectedRevision is supplied and does not match the stored revision,
   * rejects with PersistenceConflictError carrying the current document.
   * `expectedRevision: 0` means create-if-absent.
   */
  save(
    doc: StateDocument,
    expectedRevision?: number,
  ): Promise<{ revision: number }>;
  delete(ref: DocumentRef, options?: DeleteOptions): Promise<void>;
  /** Metadata only — values are not required. */
  list(user: string): Promise<readonly DocumentSummary[]>;
  /** Optional: notification of changes made elsewhere (other tabs, server push). */
  subscribe?(
    user: string,
    listener: (ref: DocumentRef | undefined) => void,
  ): () => void;
  dispose?(): void;
}

export type PersistenceOperation =
  | "load"
  | "save"
  | "delete"
  | "list"
  | "clear"
  | "migrate";

export class PersistenceError extends Error {
  readonly operation: PersistenceOperation;
  readonly ref?: DocumentRef;
  readonly status?: number;
  constructor(
    message: string,
    {
      cause,
      operation,
      ref,
      status,
    }: {
      cause?: unknown;
      operation: PersistenceOperation;
      ref?: DocumentRef;
      status?: number;
    },
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "PersistenceError";
    this.operation = operation;
    this.ref = ref;
    this.status = status;
  }
}

export class PersistenceConflictError extends PersistenceError {
  readonly current: StateDocument | undefined;
  constructor(ref: DocumentRef, current: StateDocument | undefined) {
    super(
      `Saved state for ${ref.applicationKey} v${ref.applicationVersion} was changed elsewhere`,
      { operation: "save", ref, status: 412 },
    );
    this.name = "PersistenceConflictError";
    this.current = current;
  }
}

export class PersistenceQuotaError extends PersistenceError {
  constructor(ref: DocumentRef, cause?: unknown) {
    super("Browser storage is full", { cause, operation: "save", ref });
    this.name = "PersistenceQuotaError";
  }
}

export class PersistenceValidationError extends PersistenceError {
  /** True when the data is valid, but written by a newer portal. */
  readonly unsupportedSchema: boolean;
  constructor(
    message: string,
    ref: DocumentRef,
    {
      cause,
      unsupportedSchema = false,
    }: { cause?: unknown; unsupportedSchema?: boolean } = {},
  ) {
    super(message, { cause, operation: "load", ref });
    this.name = "PersistenceValidationError";
    this.unsupportedSchema = unsupportedSchema;
  }
}

export const toDocumentRef = ({
  applicationKey,
  applicationVersion,
  user,
}: DocumentRef): DocumentRef => ({ applicationKey, applicationVersion, user });

export const sameRef = (a: DocumentRef, b: DocumentRef) =>
  a.user === b.user &&
  a.applicationKey === b.applicationKey &&
  a.applicationVersion === b.applicationVersion;

export const refId = ({
  applicationKey,
  applicationVersion,
}: Omit<DocumentRef, "user">) => `${applicationKey}\u0000${applicationVersion}`;

/** Builds a DocumentSummary from a document and its serialised size. */
export const summarizeDocument = (
  document: StateDocument,
  size = storageSize(JSON.stringify(document)),
): DocumentSummary => ({
  applicationKey: document.applicationKey,
  applicationVersion: document.applicationVersion,
  ...(document.applicationTitle === undefined
    ? {}
    : { applicationTitle: document.applicationTitle }),
  revision: document.revision,
  updatedAt: document.updatedAt,
  size,
  entries: Object.entries(document.entries).map(
    ([key, { group, label, updatedAt, value }]) => ({
      key,
      ...(label === undefined ? {} : { label }),
      ...(group === undefined ? {} : { group }),
      updatedAt,
      size: storageSize(JSON.stringify(value)),
    }),
  ),
  ...(document.carriedForwardFrom === undefined
    ? {}
    : { carriedForwardFrom: document.carriedForwardFrom }),
  ...(document.notCarriedForward?.length
    ? { notCarriedForward: document.notCarriedForward }
    : {}),
});
