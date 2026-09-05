import {
  GRID_LAYOUT_DOCUMENT_KIND,
  GRID_LAYOUT_DOCUMENT_VERSION,
  type GridLayoutDocument,
} from "./GridLayoutDocument";
import type { JsonValue } from "./json-value";

export type GridLayoutIdKind = "component" | "grid" | "item" | "stack";

export interface GridLayoutIdRemapping {
  readonly kind: GridLayoutIdKind;
  readonly newId: string;
  readonly oldId: string;
  readonly path: string;
}

export type GridLayoutIdAllocator = (
  kind: GridLayoutIdKind,
  oldId: string,
  path: string,
) => string;

export interface RemappedGridLayoutDocument {
  readonly document: GridLayoutDocument;
  readonly mappings: readonly GridLayoutIdRemapping[];
}

export const createSequentialGridLayoutIdAllocator = (
  prefix = "clone",
): GridLayoutIdAllocator => {
  let nextId = 1;
  return (kind) => `${prefix}-${kind}-${nextId++}`;
};

const isNestedDocument = (
  value: JsonValue,
): value is JsonValue & GridLayoutDocument => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Readonly<Record<string, JsonValue>>;
  return (
    record.kind === GRID_LAYOUT_DOCUMENT_KIND &&
    record.version === GRID_LAYOUT_DOCUMENT_VERSION &&
    typeof record.layout === "object" &&
    record.layout !== null &&
    !Array.isArray(record.layout) &&
    Array.isArray(record.components)
  );
};

export const remapGridLayoutDocumentIds = (
  source: GridLayoutDocument,
  allocate: GridLayoutIdAllocator,
): RemappedGridLayoutDocument => {
  const mappings: GridLayoutIdRemapping[] = [];

  const remapDocument = (
    document: GridLayoutDocument,
    path: string,
  ): GridLayoutDocument => {
    const allocateId = (
      kind: GridLayoutIdKind,
      oldId: string,
      idPath: string,
    ) => {
      const newId = allocate(kind, oldId, idPath);
      mappings.push({ kind, newId, oldId, path: idPath });
      return newId;
    };
    const gridId = allocateId("grid", document.layout.id, `${path}.layout.id`);
    const itemIds = new Map(
      document.layout.items.map(({ id }, index) => [
        id,
        allocateId("item", id, `${path}.layout.items[${index}].id`),
      ]),
    );
    const componentIds = new Map(
      document.components.map(({ id }, index) => [
        id,
        allocateId("component", id, `${path}.components[${index}].id`),
      ]),
    );
    const stackIds = new Map(
      document.layout.stacks.map(({ id }, index) => [
        id,
        allocateId("stack", id, `${path}.layout.stacks[${index}].id`),
      ]),
    );

    const remapJson = (value: JsonValue, valuePath: string): JsonValue => {
      if (isNestedDocument(value)) {
        return remapDocument(value, valuePath) as unknown as JsonValue;
      }
      if (Array.isArray(value)) {
        return value.map((entry, index) =>
          remapJson(entry, `${valuePath}[${index}]`),
        );
      }
      if (typeof value === "object" && value !== null) {
        return Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [
            key,
            remapJson(entry, `${valuePath}.${key}`),
          ]),
        );
      }
      return value;
    };

    return {
      components: document.components.map((component, index) => ({
        ...component,
        id: componentIds.get(component.id) ?? component.id,
        settings: remapJson(
          component.settings,
          `${path}.components[${index}].settings`,
        ),
      })),
      kind: GRID_LAYOUT_DOCUMENT_KIND,
      layout: {
        columns: [...document.layout.columns],
        id: gridId,
        items: document.layout.items.map((item) => ({
          ...item,
          column: { ...item.column },
          ...(item.componentInstanceId === undefined
            ? {}
            : {
                componentInstanceId:
                  componentIds.get(item.componentInstanceId) ??
                  item.componentInstanceId,
              }),
          id: itemIds.get(item.id) ?? item.id,
          row: { ...item.row },
        })),
        placeholderIds: document.layout.placeholderIds.map(
          (id) => itemIds.get(id) ?? id,
        ),
        rows: [...document.layout.rows],
        stacks: document.layout.stacks.map((stack) => ({
          id: stackIds.get(stack.id) ?? stack.id,
          itemIds: stack.itemIds.map((id) => itemIds.get(id) ?? id),
          selectedItemId:
            itemIds.get(stack.selectedItemId) ?? stack.selectedItemId,
        })),
      },
      version: GRID_LAYOUT_DOCUMENT_VERSION,
    };
  };

  return { document: remapDocument(source, "$"), mappings };
};
