import type {
  GridLayoutChildItemDescriptor,
  GridLayoutDescriptor,
} from "./GridModel";
import {
  GridSnapshotValidationError,
  type GridItemSnapshot,
  type ComponentInstanceId,
  type GridSnapshot,
  type GridSnapshotValidationIssue,
  type GridSpanSnapshot,
  type GridStackSnapshot,
  type GridTrackSnapshot,
} from "./GridSnapshot";

export interface GridLayoutDescriptorSnapshotOptions {
  readonly gridId: string;
  readonly revision?: number;
}

export interface GridLayoutDescriptorV1
  extends Omit<GridLayoutDescriptor, "gridLayoutItems"> {
  readonly gridLayoutItems?: Record<
    string,
    GridLayoutChildItemDescriptor & {
      readonly componentId?: ComponentInstanceId;
    }
  >;
}

const TRACK_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)(?:fr|px)$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const validateKnownFields = (
  value: Record<string, unknown>,
  fields: readonly string[],
  path: string,
  issues: GridSnapshotValidationIssue[],
) => {
  const knownFields = new Set(fields);
  for (const field of Object.keys(value)) {
    if (!knownFields.has(field)) {
      issues.push({
        code: "UNEXPECTED_FIELD",
        message: `unexpected field "${field}"`,
        path: path === "$" ? field : `${path}.${field}`,
      });
    }
  }
};

const cloneTrack = ({ size }: GridTrackSnapshot): GridTrackSnapshot => ({
  size,
});

const cloneSpan = ({ span, start }: GridSpanSnapshot): GridSpanSnapshot => ({
  span,
  start,
});

const cloneItem = ({
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
  column: cloneSpan(column),
  componentInstanceId,
  contentVisible,
  dropTarget,
  header,
  id,
  minHeight,
  minWidth,
  resizeable,
  row: cloneSpan(row),
  title,
});

const cloneStack = ({
  id,
  itemIds,
  selectedItemId,
}: GridStackSnapshot): GridStackSnapshot => ({
  id,
  itemIds: [...itemIds],
  selectedItemId,
});

const validateSpan = (
  span: unknown,
  trackCount: number,
  path: string,
  issues: GridSnapshotValidationIssue[],
) => {
  if (!isRecord(span)) {
    issues.push({
      code: "INVALID_STRUCTURE",
      message: "span must be an object",
      path,
    });
    return;
  }
  validateKnownFields(span, ["span", "start"], path, issues);
  const { span: length, start } = span;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(length) ||
    typeof length !== "number" ||
    length <= 0
  ) {
    issues.push({
      code: "INVALID_SPAN",
      message: "start and span must be integers and span must be positive",
      path,
    });
    return;
  }
  if (
    typeof start === "number" &&
    (start <= 0 || start + length - 1 > trackCount)
  ) {
    issues.push({
      code: "INVALID_TRACK_REFERENCE",
      message: `range ${start}/${length} exceeds ${trackCount} tracks`,
      path,
    });
  }
};

export const validateGridSnapshot = (
  value: unknown,
): readonly GridSnapshotValidationIssue[] => {
  const issues: GridSnapshotValidationIssue[] = [];
  if (!isRecord(value)) {
    return [
      {
        code: "INVALID_STRUCTURE",
        message: "snapshot must be an object",
        path: "$",
      },
    ];
  }
  const { columns, gridId, items, revision, rows, stacks } = value;
  validateKnownFields(
    value,
    ["columns", "gridId", "items", "revision", "rows", "stacks"],
    "$",
    issues,
  );
  if (typeof gridId !== "string" || !gridId) {
    issues.push({
      code: "EMPTY_ID",
      message: "grid id must not be empty",
      path: "gridId",
    });
  }
  if (
    typeof revision !== "number" ||
    !Number.isInteger(revision) ||
    revision < 0
  ) {
    issues.push({
      code: "INVALID_REVISION",
      message: "revision must be a non-negative integer",
      path: "revision",
    });
  }

  const validateTracks = (tracks: unknown, path: "columns" | "rows") => {
    if (!Array.isArray(tracks)) {
      issues.push({
        code: "INVALID_STRUCTURE",
        message: "tracks must be an array",
        path,
      });
      return [];
    }
    tracks.forEach((track, index) => {
      const size = isRecord(track) ? track.size : undefined;
      if (isRecord(track)) {
        validateKnownFields(track, ["size"], `${path}[${index}]`, issues);
      }
      if (typeof size !== "string" || !TRACK_PATTERN.test(size)) {
        issues.push({
          code: "MALFORMED_TRACK",
          message: `unsupported track size "${String(size)}"`,
          path: `${path}[${index}].size`,
        });
      }
    });
    return tracks;
  };
  const validatedColumns = validateTracks(columns, "columns");
  const validatedRows = validateTracks(rows, "rows");

  const ids = new Map<string, string>();
  const addId = (id: unknown, path: string) => {
    if (typeof id !== "string" || !id) {
      issues.push({
        code: "EMPTY_ID",
        message: "id must not be empty",
        path,
      });
      return;
    }
    const firstPath = ids.get(id);
    if (firstPath) {
      issues.push({
        code: "DUPLICATE_ID",
        message: `id "${id}" is already used at ${firstPath}`,
        path,
      });
    } else {
      ids.set(id, path);
    }
  };

  const itemIds = new Set<string>();
  const itemById = new Map<string, Record<string, unknown>>();
  const validatedItems = Array.isArray(items) ? items : [];
  if (!Array.isArray(items)) {
    issues.push({
      code: "INVALID_STRUCTURE",
      message: "items must be an array",
      path: "items",
    });
  }
  validatedItems.forEach((item, index) => {
    const path = `items[${index}]`;
    if (!isRecord(item)) {
      issues.push({
        code: "INVALID_STRUCTURE",
        message: "item must be an object",
        path,
      });
      return;
    }
    validateKnownFields(
      item,
      [
        "column",
        "componentInstanceId",
        "contentVisible",
        "dropTarget",
        "header",
        "id",
        "minHeight",
        "minWidth",
        "resizeable",
        "row",
        "title",
      ],
      path,
      issues,
    );
    addId(item.id, `${path}.id`);
    if (typeof item.id === "string") {
      itemIds.add(item.id);
      itemById.set(item.id, item);
    }
    validateSpan(
      item.column,
      validatedColumns.length,
      `${path}.column`,
      issues,
    );
    validateSpan(item.row, validatedRows.length, `${path}.row`, issues);
    const optionalFields: ReadonlyArray<
      readonly [string, (field: unknown) => boolean]
    > = [
      ["componentInstanceId", (field) => typeof field === "string"],
      ["contentVisible", (field) => typeof field === "boolean"],
      [
        "dropTarget",
        (field) => typeof field === "boolean" || typeof field === "string",
      ],
      ["header", (field) => typeof field === "boolean"],
      [
        "minHeight",
        (field) =>
          typeof field === "number" && Number.isFinite(field) && field >= 0,
      ],
      [
        "minWidth",
        (field) =>
          typeof field === "number" && Number.isFinite(field) && field >= 0,
      ],
      [
        "resizeable",
        (field) =>
          field === false || field === "h" || field === "v" || field === "hv",
      ],
      ["title", (field) => typeof field === "string"],
    ];
    for (const [fieldName, isValid] of optionalFields) {
      const field = item[fieldName];
      if (field !== undefined && !isValid(field)) {
        issues.push({
          code: "INVALID_FIELD",
          message: `invalid ${fieldName}`,
          path: `${path}.${fieldName}`,
        });
      }
    }
  });

  const stackedItemIds = new Set<string>();
  const validatedStacks = Array.isArray(stacks) ? stacks : [];
  if (!Array.isArray(stacks)) {
    issues.push({
      code: "INVALID_STRUCTURE",
      message: "stacks must be an array",
      path: "stacks",
    });
  }
  validatedStacks.forEach((stack, stackIndex) => {
    const path = `stacks[${stackIndex}]`;
    if (!isRecord(stack)) {
      issues.push({
        code: "INVALID_STRUCTURE",
        message: "stack must be an object",
        path,
      });
      return;
    }
    validateKnownFields(
      stack,
      ["id", "itemIds", "selectedItemId"],
      path,
      issues,
    );
    addId(stack.id, `${path}.id`);
    if (!Array.isArray(stack.itemIds)) {
      issues.push({
        code: "INVALID_STRUCTURE",
        message: "stack item ids must be an array",
        path: `${path}.itemIds`,
      });
      return;
    }
    if (stack.itemIds.length < 2) {
      issues.push({
        code: "INVALID_STACK_MEMBERSHIP",
        message: "a stack must contain at least two items",
        path: `${path}.itemIds`,
      });
    }
    const members = new Set<string>();
    stack.itemIds.forEach((itemId, itemIndex) => {
      const itemPath = `${path}.itemIds[${itemIndex}]`;
      if (typeof itemId !== "string") {
        issues.push({
          code: "INVALID_STACK_MEMBERSHIP",
          message: "stack item id must be a string",
          path: itemPath,
        });
      } else if (
        !itemIds.has(itemId) ||
        members.has(itemId) ||
        stackedItemIds.has(itemId)
      ) {
        issues.push({
          code: "INVALID_STACK_MEMBERSHIP",
          message: `item "${itemId}" is missing, duplicated, or belongs to another stack`,
          path: itemPath,
        });
      }
      if (typeof itemId === "string") {
        members.add(itemId);
        stackedItemIds.add(itemId);
      }
    });
    if (
      typeof stack.selectedItemId !== "string" ||
      !members.has(stack.selectedItemId)
    ) {
      issues.push({
        code: "INVALID_STACK_SELECTION",
        message: `selected item "${String(stack.selectedItemId)}" is not a stack member`,
        path: `${path}.selectedItemId`,
      });
    }
    const [firstItemId, ...otherItemIds] = members;
    const firstItem = itemById.get(firstItemId);
    const hasSameSpan = (left: unknown, right: unknown) =>
      isRecord(left) &&
      isRecord(right) &&
      left.start === right.start &&
      left.span === right.span;
    if (
      firstItem &&
      otherItemIds.some((itemId) => {
        const item = itemById.get(itemId);
        return (
          !item ||
          !hasSameSpan(firstItem.column, item.column) ||
          !hasSameSpan(firstItem.row, item.row)
        );
      })
    ) {
      issues.push({
        code: "INVALID_STACK_POSITION",
        message: "all stack members must occupy the same grid area",
        path: `${path}.itemIds`,
      });
    }
  });

  return issues;
};

const assertValidSnapshot = (snapshot: GridSnapshot) => {
  const issues = validateGridSnapshot(snapshot);
  if (issues.length > 0) {
    throw new GridSnapshotValidationError(issues);
  }
};

export const normalizeGridSnapshot = (snapshot: GridSnapshot): GridSnapshot => {
  assertValidSnapshot(snapshot);
  return {
    columns: snapshot.columns.map(cloneTrack),
    gridId: snapshot.gridId,
    items: snapshot.items.map(cloneItem),
    revision: snapshot.revision,
    rows: snapshot.rows.map(cloneTrack),
    stacks: snapshot.stacks.map(cloneStack),
  };
};

const parseGridArea = (
  gridArea: string,
  path: string,
  issues: GridSnapshotValidationIssue[],
): { column: GridSpanSnapshot; row: GridSpanSnapshot } => {
  const lines = gridArea.split("/").map((value) => Number(value));
  if (lines.length !== 4 || lines.some((value) => !Number.isInteger(value))) {
    issues.push({
      code: "MALFORMED_GRID_AREA",
      message: `grid area "${gridArea}" must contain four integer grid lines`,
      path,
    });
    return {
      column: { span: Number.NaN, start: Number.NaN },
      row: { span: Number.NaN, start: Number.NaN },
    };
  }
  const [rowStart, columnStart, rowEnd, columnEnd] = lines;
  return {
    column: { span: columnEnd - columnStart, start: columnStart },
    row: { span: rowEnd - rowStart, start: rowStart },
  };
};

export const gridLayoutDescriptorToSnapshot = (
  descriptor: GridLayoutDescriptorV1,
  { gridId, revision = 0 }: GridLayoutDescriptorSnapshotOptions,
): GridSnapshot => {
  const issues: GridSnapshotValidationIssue[] = [];
  const stackMembers = new Map<string, GridItemSnapshot[]>();
  const items = Object.entries(descriptor.gridLayoutItems ?? {}).map(
    ([id, item]): GridItemSnapshot => {
      const { componentId, gridArea, stackId, ...metadata } = item;
      const snapshotItem = {
        ...metadata,
        componentInstanceId: componentId,
        id,
        ...parseGridArea(gridArea, `gridLayoutItems.${id}.gridArea`, issues),
      };
      if (stackId) {
        const members = stackMembers.get(stackId) ?? [];
        members.push(snapshotItem);
        stackMembers.set(stackId, members);
      }
      return snapshotItem;
    },
  );
  const stacks = [...stackMembers].map(
    ([id, members]): GridStackSnapshot => ({
      id,
      itemIds: members.map(({ id: itemId }) => itemId),
      selectedItemId:
        members.find(({ contentVisible }) => contentVisible)?.id ??
        members[0]?.id ??
        "",
    }),
  );
  const stackedItemIds = new Set(stacks.flatMap(({ itemIds }) => itemIds));
  const snapshot: GridSnapshot = {
    columns: descriptor.cols.map((size) => ({ size })),
    gridId,
    items: items.map((item) => {
      if (stackedItemIds.has(item.id)) {
        const { contentVisible: _contentVisible, ...stackedItem } = item;
        return stackedItem;
      }
      return item;
    }),
    revision,
    rows: descriptor.rows.map((size) => ({ size })),
    stacks,
  };
  issues.push(...validateGridSnapshot(snapshot));
  if (issues.length > 0) {
    throw new GridSnapshotValidationError(issues);
  }
  return normalizeGridSnapshot(snapshot);
};

const toDescriptorItem = (
  item: GridItemSnapshot,
  stack: GridStackSnapshot | undefined,
): GridLayoutChildItemDescriptor => ({
  ...(item.componentInstanceId === undefined
    ? {}
    : { componentId: item.componentInstanceId }),
  contentVisible: stack
    ? stack.selectedItemId === item.id
    : item.contentVisible,
  dropTarget: item.dropTarget,
  gridArea: `${item.row.start}/${item.column.start}/${item.row.start + item.row.span}/${item.column.start + item.column.span}`,
  header: item.header,
  minHeight: item.minHeight,
  minWidth: item.minWidth,
  resizeable: item.resizeable,
  stackId: stack?.id,
  title: item.title,
});

export const gridSnapshotToGridLayoutDescriptor = (
  snapshot: GridSnapshot,
): GridLayoutDescriptorV1 => {
  const normalized = normalizeGridSnapshot(snapshot);
  const stackByItemId = new Map(
    normalized.stacks.flatMap((stack) =>
      stack.itemIds.map((itemId) => [itemId, stack] as const),
    ),
  );
  return {
    cols: normalized.columns.map(({ size }) => size),
    gridLayoutItems: Object.fromEntries(
      normalized.items.map((item) => [
        item.id,
        toDescriptorItem(item, stackByItemId.get(item.id)),
      ]),
    ),
    rows: normalized.rows.map(({ size }) => size),
  };
};
