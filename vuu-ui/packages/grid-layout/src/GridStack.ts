import {
  GridSnapshotValidationError,
  type GridItemId,
  type GridItemResizeable,
  type GridSnapshotValidationIssue,
  type GridSpanSnapshot,
  type GridStackSnapshot,
  type StackId,
} from "./GridSnapshot";

/**
 * Canonical stack state and the pure transitions that own stack semantics:
 * membership, order, stable identity, selection, placement and lifecycle.
 *
 * Nothing in this module knows about React, the DOM, event emitters or the
 * legacy runtime models. `GridModel`, `TabState` and `TabStrip` are hydrated
 * from the transitions declared here; they never compute stack semantics.
 */

/** A stack with fewer members than this dissolves into a plain grid item. */
export const MIN_GRID_STACK_MEMBERS = 2;

/**
 * The grid area occupied by a stack. Every member of a stack occupies exactly
 * this area, which is what makes the stack a single placement on the grid.
 */
export interface GridStackArea {
  readonly column: GridSpanSnapshot;
  readonly row: GridSpanSnapshot;
}

/**
 * A stack member. Identity is the (stable) `id`; `label` and `title` are
 * durable metadata, never used to identify, order or select a member.
 */
export interface GridStackMember {
  readonly id: GridItemId;
  readonly label: string;
  readonly title?: string;
}

/** Durable stack metadata required by descriptors and layout commands. */
export interface GridStackMetadata {
  readonly minHeight?: number;
  readonly minWidth?: number;
  readonly resizeable?: GridItemResizeable;
}

export interface GridStackState {
  readonly area: GridStackArea;
  readonly id: StackId;
  /** ordered membership; order is explicit and independent of title/label */
  readonly members: readonly GridStackMember[];
  readonly metadata: GridStackMetadata;
  readonly selectedItemId: GridItemId;
}

export type GridStackOperation =
  | "add"
  | "create"
  | "remove"
  | "rename"
  | "reorder"
  | "select";

export interface GridStackTransition {
  readonly added: readonly GridStackMember[];
  /** false for a no-op, so callers can avoid publishing a durable revision */
  readonly changed: boolean;
  /**
   * true when the stack ceases to exist. `state` then describes the residual
   * membership, which the projection unstacks.
   */
  readonly dissolved: boolean;
  readonly operation: GridStackOperation;
  readonly orderChanged: boolean;
  /** true when an added member was placed relative to an existing member */
  readonly positioned: boolean;
  readonly previous: GridStackState | undefined;
  readonly removed: readonly GridStackMember[];
  readonly selectionChanged: boolean;
  readonly stackId: StackId;
  readonly state: GridStackState;
}

export type GridStackErrorCode =
  | "DUPLICATE_ITEM_ID"
  | "INVALID_ITEM"
  | "INVALID_TARGET"
  | "STACK_NOT_FOUND"
  | "TAB_NOT_FOUND";

export interface GridStackError {
  readonly code: GridStackErrorCode;
  readonly message: string;
}

export type GridStackResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly error: GridStackError; readonly ok: false };

const ok = <T>(value: T): GridStackResult<T> => ({ ok: true, value });

const failure = <T>(
  code: GridStackErrorCode,
  message: string,
): GridStackResult<T> => ({ error: { code, message }, ok: false });

const cloneSpan = ({ span, start }: GridSpanSnapshot): GridSpanSnapshot => ({
  span,
  start,
});

const cloneArea = ({ column, row }: GridStackArea): GridStackArea => ({
  column: cloneSpan(column),
  row: cloneSpan(row),
});

const cloneMember = ({
  id,
  label,
  title,
}: GridStackMember): GridStackMember => ({
  id,
  label,
  title,
});

const cloneMetadata = ({
  minHeight,
  minWidth,
  resizeable,
}: GridStackMetadata): GridStackMetadata => ({
  minHeight,
  minWidth,
  resizeable,
});

/** A detached copy, so canonical state never aliases legacy runtime state. */
export const cloneGridStackState = (state: GridStackState): GridStackState => ({
  area: cloneArea(state.area),
  id: state.id,
  members: state.members.map(cloneMember),
  metadata: cloneMetadata(state.metadata),
  selectedItemId: state.selectedItemId,
});

export const gridStackItemIds = (
  state: GridStackState,
): readonly GridItemId[] => state.members.map(({ id }) => id);

export const findGridStackMember = (
  state: GridStackState,
  itemId: GridItemId,
): GridStackMember | undefined => state.members.find(({ id }) => id === itemId);

export const gridStackMemberIndex = (
  state: GridStackState,
  itemId: GridItemId,
): number => state.members.findIndex(({ id }) => id === itemId);

export const gridStackSelectedIndex = (state: GridStackState): number =>
  gridStackMemberIndex(state, state.selectedItemId);

/** Project canonical state onto the persisted snapshot contract. */
export const toGridStackSnapshot = (
  state: GridStackState,
): GridStackSnapshot => ({
  id: state.id,
  itemIds: [...gridStackItemIds(state)],
  selectedItemId: state.selectedItemId,
});

const sameMembers = (
  left: readonly GridStackMember[],
  right: readonly GridStackMember[],
) =>
  left.length === right.length &&
  left.every(
    (member, index) =>
      member.id === right[index].id &&
      member.label === right[index].label &&
      member.title === right[index].title,
  );

const sameOrder = (
  left: readonly GridStackMember[],
  right: readonly GridStackMember[],
) =>
  left.length === right.length &&
  left.every((member, index) => member.id === right[index].id);

const sameSpan = (left: GridSpanSnapshot, right: GridSpanSnapshot) =>
  left.span === right.span && left.start === right.start;

const sameArea = (left: GridStackArea, right: GridStackArea) =>
  sameSpan(left.column, right.column) && sameSpan(left.row, right.row);

const sameMetadata = (left: GridStackMetadata, right: GridStackMetadata) =>
  left.minHeight === right.minHeight &&
  left.minWidth === right.minWidth &&
  left.resizeable === right.resizeable;

export const isSameGridStackState = (
  left: GridStackState,
  right: GridStackState,
): boolean =>
  left.id === right.id &&
  left.selectedItemId === right.selectedItemId &&
  sameArea(left.area, right.area) &&
  sameMetadata(left.metadata, right.metadata) &&
  sameMembers(left.members, right.members);

/**
 * Deterministically repair a state hydrated from the legacy runtime: drop
 * empty or duplicated ids and fall back to the first member when the selected
 * item is not (or no longer) a member.
 */
export const normalizeGridStackState = (
  state: GridStackState,
): GridStackState => {
  const members: GridStackMember[] = [];
  const seen = new Set<GridItemId>();
  for (const member of state.members) {
    if (member.id && !seen.has(member.id)) {
      seen.add(member.id);
      members.push(cloneMember(member));
    }
  }
  return {
    area: cloneArea(state.area),
    id: state.id,
    members,
    metadata: cloneMetadata(state.metadata),
    selectedItemId: seen.has(state.selectedItemId)
      ? state.selectedItemId
      : (members[0]?.id ?? ""),
  };
};

export interface GridStackValidationOptions {
  /**
   * The grid area of each known grid item. When provided, membership and
   * placement are validated against the wider layout.
   */
  readonly itemAreas?: ReadonlyMap<GridItemId, GridStackArea>;
  readonly path?: string;
}

const validateSpan = (
  span: GridSpanSnapshot | undefined,
  path: string,
  issues: GridSnapshotValidationIssue[],
) => {
  if (
    !span ||
    !Number.isInteger(span.start) ||
    !Number.isInteger(span.span) ||
    span.start < 1 ||
    span.span < 1
  ) {
    issues.push({
      code: "INVALID_SPAN",
      message: "stack area must use positive integer grid lines",
      path,
    });
  }
};

export const validateGridStackState = (
  state: GridStackState,
  { itemAreas, path = "$" }: GridStackValidationOptions = {},
): readonly GridSnapshotValidationIssue[] => {
  const issues: GridSnapshotValidationIssue[] = [];
  if (!state.id) {
    issues.push({
      code: "EMPTY_ID",
      message: "stack id must not be empty",
      path: `${path}.id`,
    });
  }
  validateSpan(state.area?.column, `${path}.area.column`, issues);
  validateSpan(state.area?.row, `${path}.area.row`, issues);

  if (state.members.length < MIN_GRID_STACK_MEMBERS) {
    issues.push({
      code: "INVALID_STACK_MEMBERSHIP",
      message: `a stack must contain at least ${MIN_GRID_STACK_MEMBERS} items`,
      path: `${path}.members`,
    });
  }

  const seen = new Set<GridItemId>();
  state.members.forEach((member, index) => {
    const memberPath = `${path}.members[${index}]`;
    if (!member.id) {
      issues.push({
        code: "EMPTY_ID",
        message: "stack member id must not be empty",
        path: `${memberPath}.id`,
      });
      return;
    }
    if (seen.has(member.id)) {
      issues.push({
        code: "DUPLICATE_ID",
        message: `item "${member.id}" appears more than once in stack "${state.id}"`,
        path: `${memberPath}.id`,
      });
    }
    seen.add(member.id);
    if (typeof member.label !== "string") {
      issues.push({
        code: "INVALID_FIELD",
        message: "stack member label must be a string",
        path: `${memberPath}.label`,
      });
    }
    if (itemAreas) {
      const area = itemAreas.get(member.id);
      if (!area) {
        issues.push({
          code: "INVALID_STACK_MEMBERSHIP",
          message: `item "${member.id}" is not a grid item`,
          path: `${memberPath}.id`,
        });
      } else if (state.area && !sameArea(area, state.area)) {
        issues.push({
          code: "INVALID_STACK_POSITION",
          message: `item "${member.id}" does not occupy the stack area`,
          path: `${memberPath}.id`,
        });
      }
    }
  });

  if (!state.selectedItemId || !seen.has(state.selectedItemId)) {
    issues.push({
      code: "INVALID_STACK_SELECTION",
      message: `selected item "${state.selectedItemId}" is not a stack member`,
      path: `${path}.selectedItemId`,
    });
  }

  return issues;
};

export const assertValidGridStackState = (
  state: GridStackState,
  options?: GridStackValidationOptions,
): GridStackState => {
  const issues = validateGridStackState(state, options);
  if (issues.length > 0) {
    throw new GridSnapshotValidationError(issues);
  }
  return state;
};

const buildTransition = ({
  added = [],
  dissolved = false,
  operation,
  positioned = false,
  previous,
  removed = [],
  state,
}: {
  added?: readonly GridStackMember[];
  dissolved?: boolean;
  operation: GridStackOperation;
  positioned?: boolean;
  previous: GridStackState | undefined;
  removed?: readonly GridStackMember[];
  state: GridStackState;
}): GridStackTransition => {
  const orderChanged =
    previous === undefined || !sameOrder(previous.members, state.members);
  const selectionChanged =
    previous === undefined || previous.selectedItemId !== state.selectedItemId;
  return {
    added: added.map(cloneMember),
    changed:
      previous === undefined ||
      dissolved ||
      !isSameGridStackState(previous, state),
    dissolved,
    operation,
    orderChanged,
    positioned,
    previous,
    removed: removed.map(cloneMember),
    selectionChanged,
    stackId: state.id,
    state,
  };
};

export interface GridStackCreateRequest {
  readonly area: GridStackArea;
  readonly id: StackId;
  readonly members: readonly GridStackMember[];
  readonly metadata?: GridStackMetadata;
  readonly selectedItemId?: GridItemId;
}

/**
 * Create a stack from two or more existing grid items. The stack id is stable
 * from this point on: it never changes when members are added, removed,
 * renamed or reordered.
 */
export const createGridStack = (
  request: GridStackCreateRequest,
): GridStackResult<GridStackTransition> => {
  if (!request.id) {
    return failure("INVALID_ITEM", "A grid stack requires a stack id");
  }
  const ids = new Set<GridItemId>();
  for (const { id } of request.members) {
    if (!id) {
      return failure("INVALID_ITEM", "A stack member requires an item id");
    }
    if (ids.has(id)) {
      return failure(
        "DUPLICATE_ITEM_ID",
        `Grid item #${id} cannot be stacked twice`,
      );
    }
    ids.add(id);
  }
  if (ids.size < MIN_GRID_STACK_MEMBERS) {
    return failure(
      "INVALID_TARGET",
      `A new stack requires at least ${MIN_GRID_STACK_MEMBERS} items`,
    );
  }
  if (request.selectedItemId && !ids.has(request.selectedItemId)) {
    return failure(
      "TAB_NOT_FOUND",
      `Grid tab #${request.selectedItemId} is not a member of stack #${request.id}`,
    );
  }
  const state = normalizeGridStackState({
    area: request.area,
    id: request.id,
    members: request.members,
    metadata: request.metadata ?? {},
    selectedItemId: request.selectedItemId ?? request.members[0].id,
  });
  return ok(
    buildTransition({
      added: state.members,
      operation: "create",
      previous: undefined,
      state,
    }),
  );
};

export interface GridStackPosition {
  readonly placement: "after" | "before";
  readonly targetItemId: GridItemId;
}

export interface GridStackAddRequest {
  readonly member: GridStackMember;
  readonly position?: GridStackPosition;
  /**
   * Select the added member. Defaults to true for a positioned add, matching
   * the legacy tabstrip drop, and to false for an appended add.
   */
  readonly select?: boolean;
}

/** Add a member, optionally positioned relative to an existing member. */
export const addGridStackItem = (
  state: GridStackState,
  { member, position, select }: GridStackAddRequest,
): GridStackResult<GridStackTransition> => {
  if (!member.id) {
    return failure("INVALID_ITEM", "A stack member requires an item id");
  }
  if (findGridStackMember(state, member.id)) {
    return failure(
      "DUPLICATE_ITEM_ID",
      `Grid item #${member.id} is already a member of stack #${state.id}`,
    );
  }
  const members = state.members.map(cloneMember);
  const added = cloneMember(member);
  let index = members.length;
  if (position) {
    const targetIndex = members.findIndex(
      ({ id }) => id === position.targetItemId,
    );
    if (targetIndex === -1) {
      return failure(
        "TAB_NOT_FOUND",
        `Grid tab #${position.targetItemId} not found in stack #${state.id}`,
      );
    }
    index = position.placement === "after" ? targetIndex + 1 : targetIndex;
  }
  members.splice(index, 0, added);
  const selectAdded = select ?? position !== undefined;
  const next = normalizeGridStackState({
    ...state,
    members,
    selectedItemId: selectAdded ? added.id : state.selectedItemId,
  });
  return ok(
    buildTransition({
      added: [added],
      operation: "add",
      positioned: position !== undefined,
      previous: state,
      state: next,
    }),
  );
};

export interface GridStackRemoveRequest {
  readonly itemId: GridItemId;
}

/**
 * Remove a member. When the removed member was selected, selection falls back
 * deterministically to the member that takes its position, or to the new last
 * member when it was the last. A stack that drops below the minimum membership
 * dissolves.
 */
export const removeGridStackItem = (
  state: GridStackState,
  { itemId }: GridStackRemoveRequest,
): GridStackResult<GridStackTransition> => {
  const index = gridStackMemberIndex(state, itemId);
  if (index === -1) {
    return failure(
      "TAB_NOT_FOUND",
      `Grid tab #${itemId} not found in stack #${state.id}`,
    );
  }
  const removed = state.members[index];
  const members = state.members
    .filter(({ id }) => id !== itemId)
    .map(cloneMember);
  const selectedItemId =
    state.selectedItemId === itemId
      ? (members[Math.min(index, members.length - 1)]?.id ?? "")
      : state.selectedItemId;
  const next = normalizeGridStackState({ ...state, members, selectedItemId });
  return ok(
    buildTransition({
      dissolved: members.length < MIN_GRID_STACK_MEMBERS,
      operation: "remove",
      previous: state,
      removed: [removed],
      state: next,
    }),
  );
};

export interface GridStackSelectRequest {
  readonly itemId: GridItemId;
}

/** Select a member by its stable id, never by title or label. */
export const selectGridStackItem = (
  state: GridStackState,
  { itemId }: GridStackSelectRequest,
): GridStackResult<GridStackTransition> => {
  if (!findGridStackMember(state, itemId)) {
    return failure(
      "TAB_NOT_FOUND",
      `Grid tab #${itemId} not found in stack #${state.id}`,
    );
  }
  const next =
    state.selectedItemId === itemId
      ? state
      : cloneGridStackState({ ...state, selectedItemId: itemId });
  return ok(
    buildTransition({ operation: "select", previous: state, state: next }),
  );
};

export interface GridStackReorderRequest {
  /** select the moved member as part of the reorder */
  readonly activate?: boolean;
  readonly itemId: GridItemId;
  readonly placement: "after" | "before";
  readonly targetItemId: GridItemId;
}

/**
 * Move a member relative to another member. Selection is carried by id, so a
 * reorder never changes which item is selected unless `activate` asks for it.
 */
export const reorderGridStackItem = (
  state: GridStackState,
  {
    activate = false,
    itemId,
    placement,
    targetItemId,
  }: GridStackReorderRequest,
): GridStackResult<GridStackTransition> => {
  const index = gridStackMemberIndex(state, itemId);
  if (index === -1) {
    return failure(
      "TAB_NOT_FOUND",
      `Grid tab #${itemId} not found in stack #${state.id}`,
    );
  }
  if (gridStackMemberIndex(state, targetItemId) === -1) {
    return failure(
      "TAB_NOT_FOUND",
      `Grid tab #${targetItemId} not found in stack #${state.id}`,
    );
  }
  if (itemId === targetItemId) {
    return failure(
      "INVALID_TARGET",
      "A tab cannot be reordered relative to itself",
    );
  }
  const members = state.members.map(cloneMember);
  const [moved] = members.splice(index, 1);
  const targetIndex = members.findIndex(({ id }) => id === targetItemId);
  members.splice(
    placement === "after" ? targetIndex + 1 : targetIndex,
    0,
    moved,
  );
  const next = normalizeGridStackState({
    ...state,
    members,
    selectedItemId: activate ? itemId : state.selectedItemId,
  });
  return ok(
    buildTransition({ operation: "reorder", previous: state, state: next }),
  );
};

export interface GridStackRenameRequest {
  readonly itemId: GridItemId;
  readonly title: string;
}

/** Rename a member. Identity, order and selection are unaffected. */
export const renameGridStackItem = (
  state: GridStackState,
  { itemId, title }: GridStackRenameRequest,
): GridStackResult<GridStackTransition> => {
  const member = findGridStackMember(state, itemId);
  if (!member) {
    return failure(
      "TAB_NOT_FOUND",
      `Grid tab #${itemId} not found in stack #${state.id}`,
    );
  }
  const next = cloneGridStackState({
    ...state,
    members: state.members.map((current) =>
      current.id === itemId ? { ...current, label: title, title } : current,
    ),
  });
  return ok(
    buildTransition({ operation: "rename", previous: state, state: next }),
  );
};
