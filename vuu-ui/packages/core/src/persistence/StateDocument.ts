export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface EntryMetadata {
  /** Human-readable name shown in the Saved state UI. */
  label?: string;
  /** Optional grouping shown in the Saved state UI. */
  group?: string;
}

export interface StateEntry extends EntryMetadata {
  value: JsonValue;
  /** Version of the value's format, owned by the component that writes it. */
  formatVersion?: number;
  updatedAt: string;
}

/** An entry that a release migration couldn't keep (§5.4.5). */
export interface NotCarriedForwardRecord {
  key: string;
  label?: string;
  group?: string;
  fromVersion: number;
  reason: string;
}

export interface StateDocument {
  schemaVersion: number;
  user: string;
  applicationKey: string;
  applicationVersion: number;
  applicationTitle?: string;
  revision: number;
  carriedForwardFrom?: number;
  createdAt: string;
  updatedAt: string;
  entries: Record<string, StateEntry>;
  migrationsApplied?: number[];
  notCarriedForward?: NotCarriedForwardRecord[];
}

export const STATE_DOCUMENT_SCHEMA_VERSION = 1;
export const PORTAL_APPLICATION_KEY = "vuu.portal";
export const PORTAL_APPLICATION_VERSION = 1;
export const MAX_KEY_LENGTH = 256;

export class InvalidStateDocumentError extends Error {
  constructor(
    message: string,
    /** True when the document is valid, but written by a newer portal. */
    readonly unsupportedSchema = false,
  ) {
    super(message);
    this.name = "InvalidStateDocumentError";
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

/**
 * Returns a description of the first non-JSON part of value, or undefined if
 * value is a JSON value. Rejects undefined, functions, symbols, bigints,
 * non-finite numbers, class instances and cycles.
 */
export const findNonJsonValue = (
  value: unknown,
  path = "value",
  seen: Set<unknown> = new Set(),
): string | undefined => {
  if (value === null) return undefined;
  switch (typeof value) {
    case "string":
    case "boolean":
      return undefined;
    case "number":
      return Number.isFinite(value) ? undefined : `${path} is not finite`;
    case "object": {
      if (seen.has(value)) {
        return `${path} contains a cycle`;
      }
      seen.add(value);
      try {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const problem = findNonJsonValue(value[i], `${path}[${i}]`, seen);
            if (problem) return problem;
          }
          return undefined;
        }
        if (!isPlainObject(value)) {
          return `${path} is not a plain object`;
        }
        for (const [key, child] of Object.entries(value)) {
          const problem = findNonJsonValue(child, `${path}.${key}`, seen);
          if (problem) return problem;
        }
        return undefined;
      } finally {
        seen.delete(value);
      }
    }
    default:
      return `${path} is ${typeof value}`;
  }
};

export const isJsonValue = (value: unknown): value is JsonValue =>
  findNonJsonValue(value) === undefined;

export const cloneJson = <T extends JsonValue>(value: T): T =>
  value === null || typeof value !== "object"
    ? value
    : (JSON.parse(JSON.stringify(value)) as T);

export const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) {
      deepFreeze(child);
    }
  }
  return value;
};

export const jsonEqual = (a: JsonValue, b: JsonValue): boolean => {
  if (a === b) return true;
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  )
    return false;
  if (Array.isArray(a)) {
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, i) => jsonEqual(item, b[i]))
    );
  }
  if (Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => key in b && jsonEqual(a[key], b[key]))
  );
};

/** Size in bytes of a string held in localStorage (UTF-16). */
export const storageSize = (serialised: string) => serialised.length * 2;

export const isValidKey = (key: unknown): key is string =>
  typeof key === "string" && key.length > 0 && key.length <= MAX_KEY_LENGTH;

export interface CreateStateDocumentProps {
  user: string;
  applicationKey: string;
  applicationVersion: number;
  applicationTitle?: string;
  now?: string;
}

export const createStateDocument = ({
  applicationKey,
  applicationTitle,
  applicationVersion,
  now = new Date().toISOString(),
  user,
}: CreateStateDocumentProps): StateDocument => ({
  schemaVersion: STATE_DOCUMENT_SCHEMA_VERSION,
  user,
  applicationKey,
  applicationVersion,
  ...(applicationTitle === undefined ? {} : { applicationTitle }),
  revision: 0,
  createdAt: now,
  updatedAt: now,
  entries: {},
});

export const cloneStateDocument = (document: StateDocument): StateDocument =>
  JSON.parse(JSON.stringify(document)) as StateDocument;

const isOptionalString = (value: unknown) =>
  value === undefined || typeof value === "string";
const isOptionalInteger = (value: unknown) =>
  value === undefined || Number.isInteger(value);

const fail = (message: string): never => {
  throw new InvalidStateDocumentError(message);
};

/**
 * Upgrades the envelope of an older document. Only schema version 1 exists
 * today, so this only rejects documents written by a newer portal.
 */
const migrateEnvelope = (document: Record<string, unknown>) => {
  const { schemaVersion } = document;
  if (!Number.isInteger(schemaVersion) || (schemaVersion as number) < 1) {
    fail("schemaVersion must be a positive integer");
  }
  if ((schemaVersion as number) > STATE_DOCUMENT_SCHEMA_VERSION) {
    throw new InvalidStateDocumentError(
      `schemaVersion ${schemaVersion} is newer than this portal supports`,
      true,
    );
  }
  return document;
};

/**
 * Validates an untrusted value (e.g. parsed from storage) as a StateDocument.
 * Throws InvalidStateDocumentError when it is not valid.
 */
export const validateStateDocument = (
  value: unknown,
  expected?: {
    user?: string;
    applicationKey?: string;
    applicationVersion?: number;
  },
): StateDocument => {
  if (!isPlainObject(value)) {
    return fail("document is not an object");
  }
  const document = migrateEnvelope(value);
  if (typeof document.user !== "string" || document.user === "") {
    fail("user is required");
  }
  if (!isValidKey(document.applicationKey)) {
    fail("applicationKey is required");
  }
  if (!Number.isInteger(document.applicationVersion)) {
    fail("applicationVersion must be an integer");
  }
  if (
    !Number.isInteger(document.revision) ||
    (document.revision as number) < 0
  ) {
    fail("revision must be a non-negative integer");
  }
  if (typeof document.createdAt !== "string") fail("createdAt is required");
  if (typeof document.updatedAt !== "string") fail("updatedAt is required");
  if (!isOptionalString(document.applicationTitle)) {
    fail("applicationTitle must be a string");
  }
  if (!isOptionalInteger(document.carriedForwardFrom)) {
    fail("carriedForwardFrom must be an integer");
  }
  if (!isPlainObject(document.entries)) {
    fail("entries must be an object");
  }
  for (const [key, entry] of Object.entries(
    document.entries as Record<string, unknown>,
  )) {
    if (!isValidKey(key)) fail(`invalid key "${key}"`);
    if (!isPlainObject(entry)) fail(`entry "${key}" is not an object`);
    const { formatVersion, group, label, updatedAt, value } = entry as Record<
      string,
      unknown
    >;
    if (!("value" in (entry as object)) || !isJsonValue(value)) {
      fail(`entry "${key}" has no JSON value`);
    }
    if (typeof updatedAt !== "string") fail(`entry "${key}" has no updatedAt`);
    if (!isOptionalString(label) || !isOptionalString(group)) {
      fail(`entry "${key}" has invalid metadata`);
    }
    if (!isOptionalInteger(formatVersion)) {
      fail(`entry "${key}" has invalid formatVersion`);
    }
  }
  if (
    document.migrationsApplied !== undefined &&
    !(
      Array.isArray(document.migrationsApplied) &&
      document.migrationsApplied.every(Number.isInteger)
    )
  ) {
    fail("migrationsApplied must be an array of integers");
  }
  if (document.notCarriedForward !== undefined) {
    if (!Array.isArray(document.notCarriedForward)) {
      fail("notCarriedForward must be an array");
    }
    for (const record of document.notCarriedForward as unknown[]) {
      if (
        !isPlainObject(record) ||
        typeof record.key !== "string" ||
        typeof record.reason !== "string" ||
        !Number.isInteger(record.fromVersion) ||
        !isOptionalString(record.label) ||
        !isOptionalString(record.group)
      ) {
        fail("notCarriedForward contains an invalid record");
      }
    }
  }
  if (expected?.user !== undefined && document.user !== expected.user) {
    fail("document belongs to a different user");
  }
  if (
    expected?.applicationKey !== undefined &&
    document.applicationKey !== expected.applicationKey
  ) {
    fail("document belongs to a different application");
  }
  if (
    expected?.applicationVersion !== undefined &&
    document.applicationVersion !== expected.applicationVersion
  ) {
    fail("document belongs to a different application version");
  }
  return document as unknown as StateDocument;
};

/** True when the document holds nothing worth keeping. */
export const isEmptyStateDocument = (document: StateDocument) =>
  Object.keys(document.entries).length === 0 &&
  (document.notCarriedForward?.length ?? 0) === 0;
