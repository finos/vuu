import type {
  DecodedGridComponentSettings,
  EncodedGridComponentSettings,
  GridComponentSettingsError,
  GridComponentSettingsInput,
  GridComponentSettingsRegistry,
} from "./GridComponentSettings";
import { normalizeGridSnapshot } from "./grid-snapshot-adapters";
import type {
  GridItemSnapshot,
  GridSnapshot,
  GridStackSnapshot,
} from "./GridSnapshot";
import { toJsonValue } from "./json-value";

export const GRID_LAYOUT_DOCUMENT_KIND = "grid-layout";
export const GRID_LAYOUT_DOCUMENT_VERSION = 2;

export interface PersistedGridLayout {
  readonly columns: readonly string[];
  readonly id: string;
  readonly items: readonly GridItemSnapshot[];
  readonly placeholderIds: readonly string[];
  readonly rows: readonly string[];
  readonly stacks: readonly GridStackSnapshot[];
}

export interface GridLayoutDocument {
  readonly components: readonly EncodedGridComponentSettings[];
  readonly kind: typeof GRID_LAYOUT_DOCUMENT_KIND;
  readonly layout: PersistedGridLayout;
  readonly version: typeof GRID_LAYOUT_DOCUMENT_VERSION;
}

export interface GridLayoutDocumentV1 {
  readonly components: readonly EncodedGridComponentSettings[];
  readonly kind: typeof GRID_LAYOUT_DOCUMENT_KIND;
  readonly layout: {
    readonly columns: readonly string[];
    readonly gridId: string;
    readonly items: readonly GridItemSnapshot[];
    readonly rows: readonly string[];
    readonly stacks?: readonly GridStackSnapshot[];
  };
  readonly version: 1;
}

export interface DecodedGridLayoutDocument {
  readonly components: readonly DecodedGridComponentSettings[];
  readonly document: GridLayoutDocument;
  readonly snapshot: GridSnapshot;
}

export type GridLayoutDocumentErrorCode =
  | "COMPONENT_SETTINGS_ERROR"
  | "COMPONENT_RENDERER_ERROR"
  | "DOCUMENT_MIGRATION_FAILED"
  | "DUPLICATE_COMPONENT_ID"
  | "INVALID_DISCRIMINATOR"
  | "INVALID_DOCUMENT"
  | "MISSING_COMPONENT_SETTINGS"
  | "UNEXPECTED_COMPONENT_SETTINGS"
  | "UNSUPPORTED_DOCUMENT_VERSION";

export interface GridLayoutDocumentError {
  readonly code: GridLayoutDocumentErrorCode;
  readonly componentError?: GridComponentSettingsError;
  readonly message: string;
  readonly path: string;
  readonly version?: number;
}

export class GridLayoutDocumentCodecError extends Error {
  constructor(readonly issue: GridLayoutDocumentError) {
    super(`${issue.path}: ${issue.message}`);
    this.name = "GridLayoutDocumentCodecError";
  }
}

export type GridLayoutDocumentResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly error: GridLayoutDocumentError; readonly ok: false };

export interface EncodeGridLayoutDocumentOptions {
  readonly componentSettings: readonly GridComponentSettingsInput[];
  readonly placeholderIds?: readonly string[];
}

const failure = (
  code: GridLayoutDocumentErrorCode,
  message: string,
  path: string,
  version?: number,
): GridLayoutDocumentResult<never> => ({
  error: { code, message, path, version },
  ok: false,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const compareIds = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

const durableItem = ({
  column,
  componentInstanceId,
  contentVisible,
  dropTarget,
  header,
  id,
  minHeight,
  minWidth,
  resizeable,
  row,
  title,
}: GridItemSnapshot): GridItemSnapshot => ({
  column: { ...column },
  ...(componentInstanceId === undefined ? {} : { componentInstanceId }),
  ...(contentVisible === undefined ? {} : { contentVisible }),
  ...(dropTarget === undefined ? {} : { dropTarget }),
  ...(header === undefined ? {} : { header }),
  id,
  ...(minHeight === undefined ? {} : { minHeight }),
  ...(minWidth === undefined ? {} : { minWidth }),
  ...(resizeable === undefined ? {} : { resizeable }),
  row: { ...row },
  ...(title === undefined ? {} : { title }),
});

const persistedLayoutToSnapshot = (layout: PersistedGridLayout): GridSnapshot =>
  normalizeGridSnapshot({
    columns: layout.columns.map((size) => ({
      size: size as `${number}fr` | `${number}px`,
    })),
    gridId: layout.id,
    items: layout.items,
    revision: 0,
    rows: layout.rows.map((size) => ({
      size: size as `${number}fr` | `${number}px`,
    })),
    stacks: layout.stacks,
  });

export const encodeGridLayoutDocument = (
  snapshot: GridSnapshot,
  registry: GridComponentSettingsRegistry,
  { componentSettings, placeholderIds = [] }: EncodeGridLayoutDocumentOptions,
): GridLayoutDocumentResult<GridLayoutDocument> => {
  let normalized: GridSnapshot;
  try {
    normalized = normalizeGridSnapshot(snapshot);
  } catch (cause) {
    return failure(
      "INVALID_DOCUMENT",
      cause instanceof Error ? cause.message : "invalid grid snapshot",
      "$.layout",
    );
  }

  const placeholderIdSet = new Set(placeholderIds);
  if (placeholderIdSet.size !== placeholderIds.length) {
    return failure(
      "INVALID_DOCUMENT",
      "placeholder ids must be unique",
      "$.layout.placeholderIds",
    );
  }
  const layoutItemIds = new Set(normalized.items.map(({ id }) => id));
  for (const placeholderId of placeholderIdSet) {
    if (!layoutItemIds.has(placeholderId)) {
      return failure(
        "INVALID_DOCUMENT",
        `placeholder "${placeholderId}" has no matching layout item`,
        "$.layout.placeholderIds",
      );
    }
  }
  const componentReferenceIds = new Set(
    normalized.items
      .filter(({ id }) => !placeholderIdSet.has(id))
      .map(({ componentInstanceId, id }) => componentInstanceId ?? id),
  );
  const referencedComponents = new Map<string, string>();
  for (const { componentInstanceId, id } of normalized.items) {
    if (placeholderIdSet.has(id)) {
      continue;
    }
    const componentId = componentInstanceId ?? id;
    const previousItemId = referencedComponents.get(componentId);
    if (previousItemId) {
      return failure(
        "DUPLICATE_COMPONENT_ID",
        `component "${componentId}" is referenced by items "${previousItemId}" and "${id}"`,
        `$.layout.items.${id}.componentInstanceId`,
      );
    }
    referencedComponents.set(componentId, id);
  }
  const componentIds = new Set<string>();
  const components: EncodedGridComponentSettings[] = [];
  for (const component of [...componentSettings].sort((a, b) =>
    compareIds(a.id, b.id),
  )) {
    if (componentIds.has(component.id)) {
      return failure(
        "DUPLICATE_COMPONENT_ID",
        `component id "${component.id}" is duplicated`,
        "$.components",
      );
    }
    componentIds.add(component.id);
    if (!componentReferenceIds.has(component.id)) {
      return failure(
        "UNEXPECTED_COMPONENT_SETTINGS",
        `component "${component.id}" has no matching layout item reference`,
        "$.components",
      );
    }
    const encoded = registry.encode(component);
    if (!encoded.ok) {
      return {
        error: {
          code: "COMPONENT_SETTINGS_ERROR",
          componentError: encoded.error,
          message: encoded.error.message,
          path: `$.components.${component.id}${encoded.error.path.slice(1)}`,
          version: encoded.error.version,
        },
        ok: false,
      };
    }
    components.push(encoded.value);
  }

  for (const { componentInstanceId, id } of normalized.items) {
    if (placeholderIdSet.has(id) && componentInstanceId !== undefined) {
      return failure(
        "INVALID_DOCUMENT",
        `placeholder "${id}" must not reference a component`,
        `$.layout.items.${id}.componentInstanceId`,
      );
    }
    const componentId = componentInstanceId ?? id;
    if (!componentIds.has(componentId) && !placeholderIdSet.has(id)) {
      return failure(
        "MISSING_COMPONENT_SETTINGS",
        `layout item "${id}" references missing component "${componentId}"`,
        `$.layout.items.${id}`,
      );
    }
  }

  const document: GridLayoutDocument = {
    components,
    kind: GRID_LAYOUT_DOCUMENT_KIND,
    layout: {
      columns: normalized.columns.map(({ size }) => size),
      id: normalized.gridId,
      items: normalized.items
        .map(durableItem)
        .sort((a, b) => compareIds(a.id, b.id)),
      placeholderIds: [...placeholderIdSet].sort(),
      rows: normalized.rows.map(({ size }) => size),
      stacks: normalized.stacks
        .map((stack) => ({
          id: stack.id,
          itemIds: [...stack.itemIds],
          selectedItemId: stack.selectedItemId,
        }))
        .sort((a, b) => compareIds(a.id, b.id)),
    },
    version: GRID_LAYOUT_DOCUMENT_VERSION,
  };
  const json = toJsonValue(document);
  return json.ok
    ? { ok: true, value: document }
    : failure("INVALID_DOCUMENT", json.error.message, json.error.path);
};

const migrateDocument = (
  value: Record<string, unknown>,
): GridLayoutDocumentResult<Record<string, unknown>> => {
  if (typeof value.version !== "number" || !Number.isInteger(value.version)) {
    return failure(
      "INVALID_DOCUMENT",
      "document version must be an integer",
      "$.version",
    );
  }
  if (value.version === GRID_LAYOUT_DOCUMENT_VERSION) {
    return { ok: true, value };
  }
  if (value.version !== 1) {
    return failure(
      "UNSUPPORTED_DOCUMENT_VERSION",
      `GridLayout document version ${String(value.version)} is not supported`,
      "$.version",
      typeof value.version === "number" ? value.version : undefined,
    );
  }
  if (!isRecord(value.layout) || typeof value.layout.gridId !== "string") {
    return failure(
      "DOCUMENT_MIGRATION_FAILED",
      "version 1 layout.gridId must be a string",
      "$.layout.gridId",
      1,
    );
  }
  const { gridId, stacks = [], ...layout } = value.layout;
  return {
    ok: true,
    value: {
      ...value,
      layout: { ...layout, id: gridId, placeholderIds: [], stacks },
      version: GRID_LAYOUT_DOCUMENT_VERSION,
    },
  };
};

const parseComponent = (
  value: unknown,
  index: number,
): GridLayoutDocumentResult<EncodedGridComponentSettings> => {
  const path = `$.components[${index}]`;
  if (!isRecord(value)) {
    return failure("INVALID_DOCUMENT", "component must be an object", path);
  }
  const unexpectedField = Object.keys(value).find(
    (field) => !["id", "settings", "type", "version"].includes(field),
  );
  if (unexpectedField) {
    return failure(
      "INVALID_DOCUMENT",
      `unexpected component field "${unexpectedField}"`,
      `${path}.${unexpectedField}`,
    );
  }
  if (
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.type !== "string" ||
    !value.type ||
    !Number.isInteger(value.version) ||
    typeof value.version !== "number"
  ) {
    return failure(
      "INVALID_DOCUMENT",
      "component id, type and integer version are required",
      path,
    );
  }
  const settings = toJsonValue(value.settings, `${path}.settings`);
  if (!settings.ok) {
    return failure(
      "INVALID_DOCUMENT",
      settings.error.message,
      settings.error.path,
    );
  }
  return {
    ok: true,
    value: {
      id: value.id,
      settings: settings.value,
      type: value.type,
      version: value.version,
    },
  };
};

export const decodeGridLayoutDocument = (
  input: unknown,
  registry: GridComponentSettingsRegistry,
): GridLayoutDocumentResult<DecodedGridLayoutDocument> => {
  const detached = toJsonValue(input);
  if (!detached.ok || !isRecord(detached.value)) {
    return failure(
      "INVALID_DOCUMENT",
      detached.ok ? "document must be an object" : detached.error.message,
      detached.ok ? "$" : detached.error.path,
    );
  }
  if (detached.value.kind !== GRID_LAYOUT_DOCUMENT_KIND) {
    return failure(
      "INVALID_DISCRIMINATOR",
      `expected document kind "${GRID_LAYOUT_DOCUMENT_KIND}"`,
      "$.kind",
    );
  }
  const migrated = migrateDocument(detached.value);
  if (!migrated.ok) {
    return migrated;
  }
  const value = migrated.value;
  const unexpectedDocumentField = Object.keys(value).find(
    (field) => !["components", "kind", "layout", "version"].includes(field),
  );
  if (unexpectedDocumentField) {
    return failure(
      "INVALID_DOCUMENT",
      `unexpected document field "${unexpectedDocumentField}"`,
      `$.${unexpectedDocumentField}`,
    );
  }
  if (!isRecord(value.layout) || !Array.isArray(value.components)) {
    return failure(
      "INVALID_DOCUMENT",
      "document layout and components are required",
      "$",
    );
  }
  const unexpectedLayoutField = Object.keys(value.layout).find(
    (field) =>
      !["columns", "id", "items", "placeholderIds", "rows", "stacks"].includes(
        field,
      ),
  );
  if (unexpectedLayoutField) {
    return failure(
      "INVALID_DOCUMENT",
      `unexpected layout field "${unexpectedLayoutField}"`,
      `$.layout.${unexpectedLayoutField}`,
    );
  }
  const { columns, id, items, placeholderIds, rows, stacks } = value.layout;
  if (
    typeof id !== "string" ||
    !Array.isArray(columns) ||
    !Array.isArray(rows) ||
    !Array.isArray(items) ||
    !Array.isArray(placeholderIds) ||
    !Array.isArray(stacks)
  ) {
    return failure(
      "INVALID_DOCUMENT",
      "layout id, columns, rows, items, placeholderIds and stacks are required",
      "$.layout",
    );
  }

  let snapshot: GridSnapshot;
  try {
    snapshot = persistedLayoutToSnapshot({
      columns: columns as string[],
      id,
      items: items as GridItemSnapshot[],
      placeholderIds: placeholderIds as string[],
      rows: rows as string[],
      stacks: stacks as GridStackSnapshot[],
    });
  } catch (cause) {
    return failure(
      "INVALID_DOCUMENT",
      cause instanceof Error ? cause.message : "invalid canonical layout",
      "$.layout",
    );
  }

  const itemIds = new Set(snapshot.items.map(({ id: itemId }) => itemId));
  const parsedPlaceholderIds = new Set<string>();
  for (let index = 0; index < placeholderIds.length; index += 1) {
    const placeholderId = placeholderIds[index];
    if (
      typeof placeholderId !== "string" ||
      !itemIds.has(placeholderId) ||
      parsedPlaceholderIds.has(placeholderId)
    ) {
      return failure(
        "INVALID_DOCUMENT",
        "placeholder id must identify one unique layout item",
        `$.layout.placeholderIds[${index}]`,
      );
    }
    parsedPlaceholderIds.add(placeholderId);
  }
  const componentItemById = new Map<string, string>();
  for (const { componentInstanceId, id: itemId } of snapshot.items) {
    if (parsedPlaceholderIds.has(itemId)) {
      if (componentInstanceId !== undefined) {
        return failure(
          "INVALID_DOCUMENT",
          `placeholder "${itemId}" must not reference a component`,
          `$.layout.items.${itemId}.componentInstanceId`,
        );
      }
      continue;
    }
    const componentId = componentInstanceId ?? itemId;
    const previousItemId = componentItemById.get(componentId);
    if (previousItemId) {
      return failure(
        "DUPLICATE_COMPONENT_ID",
        `component "${componentId}" is referenced by items "${previousItemId}" and "${itemId}"`,
        `$.layout.items.${itemId}.componentInstanceId`,
      );
    }
    componentItemById.set(componentId, itemId);
  }
  const seen = new Set<string>();
  const components: DecodedGridComponentSettings[] = [];
  const encodedComponents: EncodedGridComponentSettings[] = [];
  for (let index = 0; index < value.components.length; index += 1) {
    const parsed = parseComponent(value.components[index], index);
    if (!parsed.ok) {
      return parsed;
    }
    if (seen.has(parsed.value.id)) {
      return failure(
        "DUPLICATE_COMPONENT_ID",
        `component id "${parsed.value.id}" is duplicated`,
        `$.components[${index}].id`,
      );
    }
    if (!componentItemById.has(parsed.value.id)) {
      return failure(
        "UNEXPECTED_COMPONENT_SETTINGS",
        `component "${parsed.value.id}" has no matching layout item reference`,
        `$.components[${index}].id`,
      );
    }
    seen.add(parsed.value.id);
    encodedComponents.push(parsed.value);
    const decoded = registry.decode(parsed.value);
    if (!decoded.ok) {
      return {
        error: {
          code: "COMPONENT_SETTINGS_ERROR",
          componentError: decoded.error,
          message: decoded.error.message,
          path: `$.components[${index}]${decoded.error.path.slice(1)}`,
          version: decoded.error.version,
        },
        ok: false,
      };
    }
    components.push(decoded.value);
  }
  for (const [componentId, itemId] of componentItemById) {
    if (!seen.has(componentId)) {
      return failure(
        "MISSING_COMPONENT_SETTINGS",
        `layout item "${itemId}" references missing component "${componentId}"`,
        `$.layout.items.${itemId}`,
      );
    }
  }
  for (const placeholderId of parsedPlaceholderIds) {
    if (seen.has(placeholderId)) {
      return failure(
        "INVALID_DOCUMENT",
        `placeholder "${placeholderId}" also has component settings`,
        "$.layout.placeholderIds",
      );
    }
  }

  const document: GridLayoutDocument = {
    components: encodedComponents.sort((a, b) => compareIds(a.id, b.id)),
    kind: GRID_LAYOUT_DOCUMENT_KIND,
    layout: {
      columns: snapshot.columns.map(({ size }) => size),
      id: snapshot.gridId,
      items: snapshot.items
        .map(durableItem)
        .sort((a, b) => compareIds(a.id, b.id)),
      placeholderIds: [...parsedPlaceholderIds].sort(),
      rows: snapshot.rows.map(({ size }) => size),
      stacks: snapshot.stacks
        .map((stack) => ({ ...stack, itemIds: [...stack.itemIds] }))
        .sort((a, b) => compareIds(a.id, b.id)),
    },
    version: GRID_LAYOUT_DOCUMENT_VERSION,
  };
  return { ok: true, value: { components, document, snapshot } };
};
