import { describe, expect, it, vi } from "vitest";
import {
  LegacyGridCommandExecutor,
  type GridCommand,
  type GridCommandItem,
} from "../src/GridCommand";
import { GridController } from "../src/GridController";
import {
  gridLayoutDescriptorToSnapshot,
  gridSnapshotToGridLayoutDescriptor,
  gridSnapshotToGridStackStates,
} from "../src/grid-snapshot-adapters";
import { GridModel, type TrackSize } from "../src/GridModel";
import { GridSnapshotValidationError } from "../src/GridSnapshot";
import {
  addGridStackItem,
  assertValidGridStackState,
  cloneGridStackState,
  createGridStack,
  findGridStackMember,
  gridStackItemIds,
  gridStackSelectedIndex,
  isSameGridStackState,
  normalizeGridStackState,
  removeGridStackItem,
  renameGridStackItem,
  reorderGridStackItem,
  selectGridStackItem,
  toGridStackSnapshot,
  validateGridStackState,
  type GridStackMember,
  type GridStackResult,
  type GridStackState,
} from "../src/GridStack";
import { descriptor, item, normalizeModel } from "./model-scenario-harness";

const area = (column = { span: 1, start: 1 }, row = { span: 1, start: 1 }) => ({
  column,
  row,
});

const member = (id: string, title?: string): GridStackMember => ({
  id,
  label: title ?? id,
  title,
});

const stackState = (
  ids: string[],
  selectedItemId = ids[0],
  titles: Record<string, string> = {},
): GridStackState => ({
  area: area(),
  id: "stack",
  members: ids.map((id) => member(id, titles[id])),
  metadata: {},
  selectedItemId,
});

const value = <T>(result: GridStackResult<T>): T => {
  expect(result).toMatchObject({ ok: true });
  if (!result.ok) {
    throw Error(result.error.message);
  }
  return result.value;
};

const commandItem = (
  id: string,
  gridArea = "1/1/2/2",
  title?: string,
): GridCommandItem => {
  const [rowStart, columnStart, rowEnd, columnEnd] = gridArea
    .split("/")
    .map(Number);
  return {
    column: { span: columnEnd - columnStart, start: columnStart },
    id,
    row: { span: rowEnd - rowStart, start: rowStart },
    title,
  };
};

/**
 * A two item stack built through the public command surface, returning the
 * generated (stable) stack id alongside the model and executor.
 */
const stackedModel = (
  id: string,
  items: Record<string, ReturnType<typeof item>> = {
    alpha: item("1/1/2/2", { title: "Alpha" }),
    beta: item("1/1/2/2", { title: "Beta" }),
  },
  cols: TrackSize[] = ["1fr"],
  rows: TrackSize[] = ["1fr"],
) => {
  const model = new GridModel(id, descriptor([...cols], [...rows], items));
  const executor = new LegacyGridCommandExecutor(model);
  const [first, second] = Object.keys(items);
  expect(
    executor.execute({
      itemId: second,
      targetId: first,
      type: "create-stack",
    }),
  ).toMatchObject({ ok: true });
  const stackId = model.childItems.find(
    ({ type }) => type === "stacked-content",
  )?.id;
  if (!stackId) {
    throw Error("expected a stack to be created");
  }
  return { executor, model, stackId };
};

/** The legacy runtime projection, as the React layer observes it. */
const legacyStackView = (model: GridModel, stackId: string) => {
  const tabState = model.getTabState(stackId);
  return {
    active: tabState.activeTab?.id,
    contentVisible: model
      .getStackedChildItems(stackId)
      .filter(({ contentVisible }) => contentVisible)
      .map(({ id }) => id),
    labels: tabState.tabs.map(({ label }) => label),
    tabs: tabState.tabs.map(({ id }) => id),
  };
};

const canonicalStackView = (model: GridModel, stackId: string) => {
  const state = model.getStackState(stackId);
  return {
    active: state.selectedItemId,
    contentVisible: [state.selectedItemId],
    labels: state.members.map(({ label }) => label),
    tabs: [...gridStackItemIds(state)],
  };
};

describe("canonical stack state", () => {
  it("creates a stack with a stable id, ordered members and a selection", () => {
    const transition = value(
      createGridStack({
        area: area({ span: 2, start: 1 }, { span: 1, start: 2 }),
        id: "stack-1",
        members: [member("alpha", "Same"), member("beta", "Same")],
        metadata: { minHeight: 40, minWidth: 80, resizeable: "hv" },
      }),
    );

    expect(transition).toMatchObject({
      changed: true,
      dissolved: false,
      operation: "create",
      previous: undefined,
      stackId: "stack-1",
    });
    expect(gridStackItemIds(transition.state)).toEqual(["alpha", "beta"]);
    expect(transition.state.selectedItemId).toBe("alpha");
    expect(transition.state.area).toEqual(
      area({ span: 2, start: 1 }, { span: 1, start: 2 }),
    );
    expect(transition.state.metadata).toEqual({
      minHeight: 40,
      minWidth: 80,
      resizeable: "hv",
    });
    expect(validateGridStackState(transition.state)).toEqual([]);
  });

  it.each([
    {
      code: "DUPLICATE_ITEM_ID",
      request: {
        area: area(),
        id: "stack-1",
        members: [member("alpha"), member("alpha")],
      },
    },
    {
      code: "INVALID_TARGET",
      request: { area: area(), id: "stack-1", members: [member("alpha")] },
    },
    {
      code: "INVALID_ITEM",
      request: {
        area: area(),
        id: "",
        members: [member("alpha"), member("beta")],
      },
    },
    {
      code: "TAB_NOT_FOUND",
      request: {
        area: area(),
        id: "stack-1",
        members: [member("alpha"), member("beta")],
        selectedItemId: "missing",
      },
    },
  ])("rejects invalid stack creation with $code", ({ code, request }) => {
    expect(createGridStack(request)).toMatchObject({
      error: { code },
      ok: false,
    });
  });

  it("adds members at the end or at an explicit position", () => {
    const initial = stackState(["alpha", "beta"]);

    const appended = value(
      addGridStackItem(initial, { member: member("gamma") }),
    );
    expect(gridStackItemIds(appended.state)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    expect(appended.state.selectedItemId).toBe("alpha");
    expect(appended.positioned).toBe(false);

    const positioned = value(
      addGridStackItem(initial, {
        member: member("gamma"),
        position: { placement: "before", targetItemId: "beta" },
      }),
    );
    expect(gridStackItemIds(positioned.state)).toEqual([
      "alpha",
      "gamma",
      "beta",
    ]);
    expect(positioned.state.selectedItemId).toBe("gamma");
    expect(positioned.positioned).toBe(true);

    expect(
      addGridStackItem(initial, {
        member: member("gamma"),
        position: { placement: "after", targetItemId: "missing" },
      }),
    ).toMatchObject({ error: { code: "TAB_NOT_FOUND" }, ok: false });
    expect(
      addGridStackItem(initial, { member: member("alpha") }),
    ).toMatchObject({ error: { code: "DUPLICATE_ITEM_ID" }, ok: false });
    expect(gridStackItemIds(initial)).toEqual(["alpha", "beta"]);
  });

  it("selects the first member when a stack is filled from empty", () => {
    const empty: GridStackState = {
      area: area(),
      id: "stack",
      members: [],
      metadata: {},
      selectedItemId: "",
    };
    const filled = value(addGridStackItem(empty, { member: member("alpha") }));

    expect(filled.state.selectedItemId).toBe("alpha");
    expect(validateGridStackState(filled.state)).toEqual([
      expect.objectContaining({ code: "INVALID_STACK_MEMBERSHIP" }),
    ]);
  });

  it.each([
    { expected: "beta", removed: "alpha", selected: "alpha" },
    { expected: "gamma", removed: "beta", selected: "beta" },
    { expected: "beta", removed: "gamma", selected: "gamma" },
    { expected: "alpha", removed: "gamma", selected: "alpha" },
    { expected: "gamma", removed: "alpha", selected: "gamma" },
  ])("falls back deterministically from $selected when $removed is removed", ({
    expected,
    removed,
    selected,
  }) => {
    const transition = value(
      removeGridStackItem(stackState(["alpha", "beta", "gamma"], selected), {
        itemId: removed,
      }),
    );

    expect(transition.state.selectedItemId).toBe(expected);
    expect(transition.dissolved).toBe(false);
    expect(transition.removed.map(({ id }) => id)).toEqual([removed]);
  });

  it("dissolves a stack that falls below the minimum membership", () => {
    const transition = value(
      removeGridStackItem(stackState(["alpha", "beta"], "beta"), {
        itemId: "beta",
      }),
    );

    expect(transition).toMatchObject({ changed: true, dissolved: true });
    expect(gridStackItemIds(transition.state)).toEqual(["alpha"]);
    expect(transition.state.selectedItemId).toBe("alpha");
    expect(
      removeGridStackItem(stackState(["alpha", "beta"]), {
        itemId: "missing",
      }),
    ).toMatchObject({ error: { code: "TAB_NOT_FOUND" }, ok: false });
  });

  it("selects and reorders by stable id, never by duplicate title", () => {
    const duplicates = stackState(["alpha", "beta", "gamma"], "alpha", {
      alpha: "Same",
      beta: "Same",
      gamma: "Same",
    });

    const selected = value(
      selectGridStackItem(duplicates, { itemId: "gamma" }),
    );
    expect(selected.state.selectedItemId).toBe("gamma");
    expect(selected.selectionChanged).toBe(true);

    const noop = value(selectGridStackItem(duplicates, { itemId: "alpha" }));
    expect(noop.changed).toBe(false);
    expect(noop.state).toBe(duplicates);

    const reordered = value(
      reorderGridStackItem(selected.state, {
        itemId: "alpha",
        placement: "after",
        targetItemId: "gamma",
      }),
    );
    expect(gridStackItemIds(reordered.state)).toEqual([
      "beta",
      "gamma",
      "alpha",
    ]);
    expect(reordered.state.selectedItemId).toBe("gamma");
  });

  it.each([
    { expected: ["beta", "alpha", "gamma"], moved: "alpha", target: "beta" },
    { expected: ["alpha", "gamma", "beta"], moved: "beta", target: "gamma" },
    { expected: ["gamma", "alpha", "beta"], moved: "gamma", target: "alpha" },
  ])("reorders $moved before/after $target preserving the selected id", ({
    expected,
    moved,
    target,
  }) => {
    const initial = stackState(["alpha", "beta", "gamma"], "beta");
    const placement =
      expected.indexOf(moved) > expected.indexOf(target) ? "after" : "before";
    const transition = value(
      reorderGridStackItem(initial, {
        itemId: moved,
        placement,
        targetItemId: target,
      }),
    );

    expect(gridStackItemIds(transition.state)).toEqual(expected);
    expect(transition.state.selectedItemId).toBe("beta");
    expect(transition.selectionChanged).toBe(false);
  });

  it("activates a reordered member only when asked", () => {
    const initial = stackState(["alpha", "beta", "gamma"], "alpha");
    const transition = value(
      reorderGridStackItem(initial, {
        activate: true,
        itemId: "gamma",
        placement: "before",
        targetItemId: "alpha",
      }),
    );

    expect(gridStackItemIds(transition.state)).toEqual([
      "gamma",
      "alpha",
      "beta",
    ]);
    expect(transition.state.selectedItemId).toBe("gamma");
    expect(
      reorderGridStackItem(initial, {
        itemId: "alpha",
        placement: "before",
        targetItemId: "alpha",
      }),
    ).toMatchObject({ error: { code: "INVALID_TARGET" }, ok: false });
    expect(
      reorderGridStackItem(initial, {
        itemId: "missing",
        placement: "before",
        targetItemId: "alpha",
      }),
    ).toMatchObject({ error: { code: "TAB_NOT_FOUND" }, ok: false });
  });

  it("renames without changing identity, order or selection", () => {
    const initial = stackState(["alpha", "beta"], "beta");
    const transition = value(
      renameGridStackItem(initial, { itemId: "alpha", title: "Renamed" }),
    );

    expect(gridStackItemIds(transition.state)).toEqual(["alpha", "beta"]);
    expect(transition.state.selectedItemId).toBe("beta");
    expect(findGridStackMember(transition.state, "alpha")).toEqual({
      id: "alpha",
      label: "Renamed",
      title: "Renamed",
    });
    expect(transition).toMatchObject({
      changed: true,
      orderChanged: false,
      selectionChanged: false,
    });
    expect(
      renameGridStackItem(initial, { itemId: "missing", title: "x" }),
    ).toMatchObject({ error: { code: "TAB_NOT_FOUND" }, ok: false });
  });

  it("normalizes inconsistent state and validates canonical invariants", () => {
    const normalized = normalizeGridStackState({
      ...stackState(["alpha", "alpha", "", "beta"], "missing"),
    });
    expect(gridStackItemIds(normalized)).toEqual(["alpha", "beta"]);
    expect(normalized.selectedItemId).toBe("alpha");
    expect(gridStackSelectedIndex(normalized)).toBe(0);

    expect(
      validateGridStackState({
        ...stackState(["alpha"], "alpha"),
        id: "",
      }),
    ).toEqual([
      expect.objectContaining({ code: "EMPTY_ID", path: "$.id" }),
      expect.objectContaining({ code: "INVALID_STACK_MEMBERSHIP" }),
    ]);
    expect(
      validateGridStackState({
        ...stackState(["alpha", "beta"], "missing"),
      }),
    ).toEqual([
      expect.objectContaining({
        code: "INVALID_STACK_SELECTION",
        path: "$.selectedItemId",
      }),
    ]);
    expect(
      validateGridStackState({
        ...stackState(["alpha", "alpha"], "alpha"),
      }),
    ).toEqual([expect.objectContaining({ code: "DUPLICATE_ID" })]);
    expect(
      validateGridStackState({
        ...stackState(["alpha", "beta"]),
        area: { column: { span: 0, start: 1 }, row: { span: 1, start: 0 } },
      }),
    ).toEqual([
      expect.objectContaining({ code: "INVALID_SPAN", path: "$.area.column" }),
      expect.objectContaining({ code: "INVALID_SPAN", path: "$.area.row" }),
    ]);
  });

  it("validates membership and placement against the wider layout", () => {
    const state = stackState(["alpha", "beta"]);
    const itemAreas = new Map([
      ["alpha", area()],
      ["beta", area({ span: 1, start: 2 })],
    ]);

    expect(validateGridStackState(state, { itemAreas })).toEqual([
      expect.objectContaining({ code: "INVALID_STACK_POSITION" }),
    ]);
    expect(
      validateGridStackState(state, {
        itemAreas: new Map([["alpha", area()]]),
      }),
    ).toEqual([expect.objectContaining({ code: "INVALID_STACK_MEMBERSHIP" })]);
    expect(() => assertValidGridStackState(state, { itemAreas })).toThrow(
      GridSnapshotValidationError,
    );
    expect(
      assertValidGridStackState(state, {
        itemAreas: new Map([
          ["alpha", area()],
          ["beta", area()],
        ]),
      }),
    ).toBe(state);
  });

  it("returns immutable, detached state from every transition", () => {
    const initial = stackState(["alpha", "beta"]);
    const transition = value(
      addGridStackItem(initial, { member: member("gamma") }),
    );
    const clone = cloneGridStackState(transition.state);

    expect(isSameGridStackState(clone, transition.state)).toBe(true);
    expect(clone.members).not.toBe(transition.state.members);
    expect(clone.area).not.toBe(transition.state.area);
    expect(gridStackItemIds(initial)).toEqual(["alpha", "beta"]);
    expect(transition.previous).toBe(initial);
    expect(toGridStackSnapshot(transition.state)).toEqual({
      id: "stack",
      itemIds: ["alpha", "beta", "gamma"],
      selectedItemId: "alpha",
    });
  });
});

describe("legacy stack projection", () => {
  it("keeps the legacy runtime aligned with canonical state for every command", () => {
    const { executor, model, stackId } = stackedModel("projection");
    const assertParity = () => {
      expect(legacyStackView(model, stackId)).toEqual(
        canonicalStackView(model, stackId),
      );
    };

    assertParity();
    expect(
      executor.execute({
        item: commandItem("gamma", "1/1/2/2", "Gamma"),
        stackId,
        type: "add-stack-item",
      }),
    ).toMatchObject({ ok: true });
    assertParity();
    expect(
      executor.execute({ itemId: "gamma", stackId, type: "select-stack-item" }),
    ).toMatchObject({ ok: true });
    assertParity();
    expect(
      executor.execute({
        itemId: "gamma",
        position: "before",
        stackId,
        targetItemId: "alpha",
        type: "reorder-stack-item",
      }),
    ).toMatchObject({ ok: true });
    assertParity();
    expect(
      executor.execute({
        itemId: "beta",
        title: "Beta renamed",
        type: "rename-item",
      }),
    ).toMatchObject({ ok: true });
    assertParity();
    expect(legacyStackView(model, stackId)).toEqual({
      active: "gamma",
      contentVisible: ["gamma"],
      labels: ["Gamma", "Alpha", "Beta renamed"],
      tabs: ["gamma", "alpha", "beta"],
    });

    expect(
      executor.execute({ itemId: "alpha", stackId, type: "remove-stack-item" }),
    ).toMatchObject({ ok: true });
    assertParity();
    expect(canonicalStackView(model, stackId).tabs).toEqual(["gamma", "beta"]);
  });

  it("notifies legacy observers exactly as the legacy engine did", () => {
    const { executor, model, stackId } = stackedModel("observers");
    const created = vi.fn();
    const changed = vi.fn();
    const removed = vi.fn();
    const selectionChanged = vi.fn();
    model.on("tabs-created", created);
    model.on("tabs-change", changed);
    model.on("tabs-removed", removed);
    model.on("tab-selection-change", selectionChanged);

    executor.execute({
      item: commandItem("gamma", "1/1/2/2", "Gamma"),
      stackId,
      type: "add-stack-item",
    });
    expect(changed).not.toHaveBeenCalled();

    executor.execute({ itemId: "beta", stackId, type: "select-stack-item" });
    expect(selectionChanged).toHaveBeenCalledExactlyOnceWith(stackId, 1);

    executor.execute({
      itemId: "gamma",
      position: "before",
      stackId,
      targetItemId: "alpha",
      type: "reorder-stack-item",
    });
    expect(changed).toHaveBeenCalledExactlyOnceWith(stackId, 2, [
      { id: "gamma", label: "Gamma" },
      { id: "alpha", label: "Alpha" },
      { id: "beta", label: "Beta" },
    ]);

    executor.execute({ itemId: "gamma", stackId, type: "remove-stack-item" });
    executor.execute({ itemId: "alpha", stackId, type: "remove-stack-item" });
    expect(removed).toHaveBeenCalledExactlyOnceWith(stackId);
    expect(created).not.toHaveBeenCalled();
    expect(model.getChildItem(stackId)).toBeUndefined();
    expect(model.getChildItem("beta", true)).toMatchObject({
      contentVisible: true,
      stackId: undefined,
    });
  });

  it("does not let a legacy observer overwrite canonical selection", () => {
    const { executor, model, stackId } = stackedModel("observer-writes");
    const canonical = {
      active: "beta",
      contentVisible: ["beta"],
      labels: ["Alpha", "Beta"],
      tabs: ["alpha", "beta"],
    };
    model.on("tab-selection-change", () => {
      // a presentation observer reacting to selection must not be able to
      // change canonical membership, order or selection
      model.getTabState(stackId).tabs = [];
    });

    expect(
      executor.execute({ itemId: "beta", stackId, type: "select-stack-item" }),
    ).toMatchObject({ ok: true });
    expect(canonicalStackView(model, stackId)).toEqual(canonical);

    // an observer rewriting the runtime projection is ignored, and the
    // projection is rebuilt from canonical state by the next transition
    model.getTabState(stackId).tabs = [
      { id: "beta", label: "Renamed by observer" },
    ];
    expect(canonicalStackView(model, stackId)).toEqual(canonical);
    expect(
      executor.execute({
        itemId: "alpha",
        position: "before",
        stackId,
        targetItemId: "beta",
        type: "reorder-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(canonicalStackView(model, stackId)).toEqual(canonical);
    expect(legacyStackView(model, stackId)).toEqual(canonical);
  });

  it("keeps stacks in the same grid independent and scoped", () => {
    const model = new GridModel(
      "two-stacks",
      descriptor(["1fr", "1fr"], ["1fr"], {
        alpha: item("1/1/2/2", { title: "Alpha" }),
        beta: item("1/1/2/2", { title: "Beta" }),
        gamma: item("1/2/2/3", { title: "Gamma" }),
        delta: item("1/2/2/3", { title: "Delta" }),
      }),
    );
    const executor = new LegacyGridCommandExecutor(model);
    executor.execute({
      itemId: "beta",
      targetId: "alpha",
      type: "create-stack",
    });
    executor.execute({
      itemId: "delta",
      targetId: "gamma",
      type: "create-stack",
    });
    const [left, right] = model.getStackStates().map(({ id }) => id);

    expect(
      executor.execute({
        itemId: "beta",
        position: "before",
        stackId: left,
        targetItemId: "alpha",
        type: "reorder-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(
      executor.execute({
        itemId: "delta",
        stackId: right,
        type: "select-stack-item",
      }),
    ).toMatchObject({ ok: true });

    expect(canonicalStackView(model, left)).toEqual({
      active: "alpha",
      contentVisible: ["alpha"],
      labels: ["Beta", "Alpha"],
      tabs: ["beta", "alpha"],
    });
    expect(canonicalStackView(model, right)).toEqual({
      active: "delta",
      contentVisible: ["delta"],
      labels: ["Gamma", "Delta"],
      tabs: ["gamma", "delta"],
    });
    expect(
      executor.execute({
        itemId: "gamma",
        stackId: left,
        type: "select-stack-item",
      }),
    ).toMatchObject({ error: { code: "TAB_NOT_FOUND" }, ok: false });
  });

  it("returns canonical state detached from later runtime mutation", () => {
    const { model, stackId } = stackedModel("detached-state");
    const state = model.getStackState(stackId);

    model.updateChildTitle("alpha", "Alpha renamed");
    model.selectStackItem(stackId, "beta");
    model.getChildItem(stackId, true).column.end = 3;

    expect(state.members).toEqual([
      { id: "alpha", label: "Alpha", title: "Alpha" },
      { id: "beta", label: "Beta", title: "Beta" },
    ]);
    expect(state.selectedItemId).toBe("alpha");
    expect(state.area).toEqual(area());
    expect(model.getStackState(stackId)).not.toBe(state);
    expect(model.getStackState(stackId).selectedItemId).toBe("beta");
  });

  it("preserves identity when every member shares a title", () => {
    const { executor, model, stackId } = stackedModel("duplicate-titles", {
      alpha: item("1/1/2/2", { title: "Same" }),
      beta: item("1/1/2/2", { title: "Same" }),
    });

    executor.execute({
      item: commandItem("gamma", "1/1/2/2", "Same"),
      stackId,
      type: "add-stack-item",
    });
    executor.execute({ itemId: "gamma", stackId, type: "select-stack-item" });
    executor.execute({
      itemId: "gamma",
      position: "before",
      stackId,
      targetItemId: "alpha",
      type: "reorder-stack-item",
    });

    expect(canonicalStackView(model, stackId)).toEqual({
      active: "gamma",
      contentVisible: ["gamma"],
      labels: ["Same", "Same", "Same"],
      tabs: ["gamma", "alpha", "beta"],
    });

    executor.execute({ itemId: "gamma", stackId, type: "remove-stack-item" });
    expect(canonicalStackView(model, stackId)).toEqual({
      active: "alpha",
      contentVisible: ["alpha"],
      labels: ["Same", "Same"],
      tabs: ["alpha", "beta"],
    });
  });

  it("keeps stacks scoped, opaque and consistent alongside other items", () => {
    const { executor, model, stackId } = stackedModel(
      "mixed-layout",
      {
        alpha: item("1/1/2/2", { title: "Alpha" }),
        beta: item("1/1/2/2", { title: "Beta" }),
        wide: item("2/1/3/3", { resizeable: "hv", title: "Wide" }),
        side: item("1/2/2/3", { title: "Side" }),
      },
      ["1fr", "1fr"],
      ["1fr", "1fr"],
    );

    executor.execute({
      item: commandItem("gamma", "1/1/2/2", "Gamma"),
      stackId,
      type: "add-stack-item",
    });
    executor.execute({ type: "regenerate-placeholders" });

    const stack = model.getChildItem(stackId, true);
    expect(stack.gridArea).toBe("1/1/2/2");
    for (const memberId of gridStackItemIds(model.getStackState(stackId))) {
      expect(model.getChildItem(memberId, true).gridArea).toBe("1/1/2/2");
    }
    expect(model.getChildItem("wide", true).gridArea).toBe("2/1/3/3");
    expect(model.getChildItem("side", true).gridArea).toBe("1/2/2/3");
    // items outside the stack are unaffected by stack membership
    expect(
      normalizeModel(model)
        .items.filter(({ stackId: memberStackId }) => memberStackId)
        .map(({ id }) => id)
        .toSorted(),
    ).toEqual(["alpha", "beta", "gamma"]);
  });
});

describe("canonical stacks, descriptors and the controller", () => {
  it("round-trips canonical order and selection through a v1 descriptor", () => {
    const { executor, model, stackId } = stackedModel("descriptor");
    executor.execute({
      item: commandItem("gamma", "1/1/2/2", "Gamma"),
      stackId,
      type: "add-stack-item",
    });
    executor.execute({ itemId: "beta", stackId, type: "select-stack-item" });
    executor.execute({
      itemId: "gamma",
      position: "before",
      stackId,
      targetItemId: "alpha",
      type: "reorder-stack-item",
    });

    const serialized = model.toGridLayoutDescriptor();
    const snapshot = gridLayoutDescriptorToSnapshot(serialized, {
      gridId: model.id,
    });
    expect(gridSnapshotToGridLayoutDescriptor(snapshot)).toEqual(serialized);

    const [restoredStack] = gridSnapshotToGridStackStates(snapshot);
    expect(restoredStack.selectedItemId).toBe("beta");
    expect(restoredStack.area).toEqual(area());
    // a descriptor carries membership and selection; canonical tab order is a
    // runtime concern, so it is restored from the persisted item order
    expect(gridStackItemIds(restoredStack).toSorted()).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);

    const restored = new GridModel("descriptor-restored", serialized);
    expect(restored.toGridLayoutDescriptor()).toEqual(serialized);
  });

  it("publishes canonical stack state in controller snapshots", () => {
    const { model, stackId } = stackedModel("controller");
    const controller = new GridController(model, 3);
    const stateListener = vi.fn();
    const commitListener = vi.fn();
    controller.subscribe(stateListener);
    controller.subscribeCommitted(commitListener);

    expect(controller.getSnapshot().stacks).toEqual([
      { id: stackId, itemIds: ["alpha", "beta"], selectedItemId: "alpha" },
    ]);

    expect(
      controller.dispatch({
        itemId: "beta",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot()).toMatchObject({
      revision: 4,
      stacks: [{ selectedItemId: "beta" }],
    });
    expect(stateListener).toHaveBeenCalledTimes(1);
    expect(commitListener).toHaveBeenCalledTimes(1);

    // re-selecting the selected member is a no-op: no revision, no event
    expect(
      controller.dispatch({
        itemId: "beta",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot().revision).toBe(4);
    expect(stateListener).toHaveBeenCalledTimes(1);
    expect(commitListener).toHaveBeenCalledTimes(1);
  });

  it("restores stack order, selection and lifecycle exactly on rollback", () => {
    const { model, stackId } = stackedModel("rollback");
    const controller = new GridController(model, 5);
    const baseline = controller.getSnapshot();
    const before = normalizeModel(model);
    const stateListener = vi.fn();
    const commitListener = vi.fn();
    controller.subscribe(stateListener);
    controller.subscribeCommitted(commitListener);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    start.transaction.dispatch({
      itemId: "beta",
      stackId,
      type: "select-stack-item",
    });
    start.transaction.dispatch({
      itemId: "beta",
      position: "before",
      stackId,
      targetItemId: "alpha",
      type: "reorder-stack-item",
    });
    expect(controller.getSnapshot()).toMatchObject({
      revision: 5,
      stacks: [{ itemIds: ["beta", "alpha"], selectedItemId: "beta" }],
    });
    expect(commitListener).not.toHaveBeenCalled();

    expect(start.transaction.rollback()).toEqual({
      ok: true,
      snapshot: baseline,
    });
    expect(controller.getSnapshot()).toBe(baseline);
    expect(normalizeModel(model)).toEqual(before);
    expect(canonicalStackView(model, stackId)).toEqual({
      active: "alpha",
      contentVisible: ["alpha"],
      labels: ["Alpha", "Beta"],
      tabs: ["alpha", "beta"],
    });
    expect(commitListener).not.toHaveBeenCalled();
  });

  it("previews stack transitions without a durable event and commits once", () => {
    const { model, stackId } = stackedModel("transaction");
    const controller = new GridController(model, 11);
    const stateListener = vi.fn();
    const commitListener = vi.fn();
    controller.subscribe(stateListener);
    controller.subscribeCommitted(commitListener);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    expect(
      start.transaction.dispatch({
        itemId: "beta",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(
      start.transaction.dispatch({
        activate: true,
        itemId: "beta",
        position: "before",
        stackId,
        targetItemId: "alpha",
        type: "reorder-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot()).toMatchObject({
      revision: 11,
      stacks: [{ itemIds: ["beta", "alpha"], selectedItemId: "beta" }],
    });
    expect(commitListener).not.toHaveBeenCalled();
    // a stack command cannot be dispatched outside the open transaction
    expect(
      controller.dispatch({
        itemId: "alpha",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ error: { code: "TRANSACTION_ACTIVE" }, ok: false });

    expect(start.transaction.commit()).toMatchObject({
      ok: true,
      snapshot: {
        revision: 12,
        stacks: [{ itemIds: ["beta", "alpha"], selectedItemId: "beta" }],
      },
    });
    expect(commitListener).toHaveBeenCalledTimes(1);
    expect(commitListener.mock.calls[0][0]).toMatchObject({
      commands: [{ type: "select-stack-item" }, { type: "reorder-stack-item" }],
      kind: "drag",
      previous: { revision: 11 },
      snapshot: { revision: 12 },
    });
    expect(
      start.transaction.dispatch({
        itemId: "alpha",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ error: { code: "TRANSACTION_CLOSED" }, ok: false });
  });

  it("tracks stack placement across mixed spans and track resizes", () => {
    const { executor, model, stackId } = stackedModel(
      "mixed-spans",
      {
        alpha: item("1/1/2/3", { resizeable: "hv", title: "Alpha" }),
        beta: item("1/1/2/3", { title: "Beta" }),
        below: item("2/1/3/3", { title: "Below" }),
      },
      ["1fr", "1fr"],
      ["1fr", "1fr"],
    );

    expect(model.getStackState(stackId).area).toEqual(
      area({ span: 2, start: 1 }, { span: 1, start: 1 }),
    );
    expect(model.getStackState(stackId).metadata.resizeable).toBe("hv");

    expect(
      executor.execute({
        item: commandItem("gamma", "1/1/2/2", "Gamma"),
        stackId,
        type: "add-stack-item",
      }),
    ).toMatchObject({ ok: true });
    // a member added with a narrower span is placed in the stack area
    expect(model.getChildItem("gamma", true).gridArea).toBe("1/1/2/3");

    expect(
      executor.execute({
        index: 0,
        size: "200px",
        track: "column",
        type: "resize-track",
      }),
    ).toMatchObject({ ok: true });
    expect(model.tracks.columns).toEqual(["200px", "1fr"]);
    expect(model.getStackState(stackId).area).toEqual(
      area({ span: 2, start: 1 }, { span: 1, start: 1 }),
    );
    expect(gridStackItemIds(model.getStackState(stackId))).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });

  it("keeps nested grid layouts opaque to each other", () => {
    const outer = stackedModel("outer");
    const inner = stackedModel("inner");
    const outerController = new GridController(outer.model);
    const innerController = new GridController(inner.model);

    expect(
      innerController.dispatch({
        itemId: "beta",
        stackId: inner.stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ ok: true });

    expect(outerController.getSnapshot()).toMatchObject({
      gridId: "outer",
      revision: 0,
      stacks: [{ selectedItemId: "alpha" }],
    });
    expect(innerController.getSnapshot()).toMatchObject({
      gridId: "inner",
      revision: 1,
      stacks: [{ selectedItemId: "beta" }],
    });
    expect(canonicalStackView(outer.model, outer.stackId).active).toBe("alpha");
    expect(() => outer.model.getStackState(inner.stackId)).toThrow();
  });

  it("commits stack dissolution once, with a single revision and event", () => {
    const { model, stackId } = stackedModel("dissolve");
    const controller = new GridController(model, 2);
    const commitListener = vi.fn();
    controller.subscribeCommitted(commitListener);

    expect(
      controller.dispatch({
        itemId: "beta",
        stackId,
        type: "remove-stack-item",
      }),
    ).toMatchObject({ ok: true });

    expect(controller.getSnapshot()).toMatchObject({ revision: 3, stacks: [] });
    expect(commitListener).toHaveBeenCalledTimes(1);
    expect(model.getChildItem(stackId)).toBeUndefined();
    expect(model.getChildItem("alpha", true)).toMatchObject({
      contentVisible: true,
      stackId: undefined,
    });
  });

  it("rejects stack commands with stable typed failures", () => {
    const { executor, model, stackId } = stackedModel("failures");
    const before = normalizeModel(model);
    const failures: Array<[GridCommand, string]> = [
      [
        { itemId: "missing", stackId, type: "select-stack-item" },
        "TAB_NOT_FOUND",
      ],
      [
        { itemId: "alpha", stackId: "missing", type: "select-stack-item" },
        "STACK_NOT_FOUND",
      ],
      [
        {
          itemId: "alpha",
          position: "before",
          stackId,
          targetItemId: "alpha",
          type: "reorder-stack-item",
        },
        "INVALID_TARGET",
      ],
      [
        { itemId: "missing", stackId, type: "remove-stack-item" },
        "TAB_NOT_FOUND",
      ],
      [
        {
          item: commandItem("alpha"),
          stackId,
          type: "add-stack-item",
        },
        "DUPLICATE_ITEM_ID",
      ],
      [
        { itemId: "alpha", targetId: "beta", type: "create-stack" },
        "INVALID_TARGET",
      ],
    ];

    for (const [command, code] of failures) {
      expect(executor.execute(command)).toMatchObject({
        error: { code },
        ok: false,
      });
    }
    expect(normalizeModel(model)).toEqual(before);
  });
});
