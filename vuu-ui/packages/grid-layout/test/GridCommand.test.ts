import { describe, expect, it } from "vitest";
import {
  GridCommandExecutionError,
  LegacyGridCommandExecutor,
  throwForGridCommandFailure,
  type GridCommand,
  type GridCommandItem,
} from "../src/GridCommand";
import { GridModel } from "../src/GridModel";
import {
  descriptor,
  item,
  normalizeModel,
  snapshotState,
} from "./model-scenario-harness";

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

const execute = (model: GridModel, command: GridCommand) =>
  new LegacyGridCommandExecutor(model).execute(command);

describe("LegacyGridCommandExecutor", () => {
  it.each([
    "north",
    "south",
    "east",
    "west",
  ] as const)("maps add-item and %s move-item to the legacy split engine", (position) => {
    const model = new GridModel(
      `split-${position}`,
      descriptor(["1fr"], ["1fr"], {
        target: item("1/1/2/2", { resizeable: "hv" }),
      }),
    );

    expect(
      execute(model, { item: commandItem("source"), type: "add-item" }),
    ).toEqual({ command: "add-item", ok: true });
    expect(
      execute(model, {
        itemId: "source",
        position,
        targetId: "target",
        type: "move-item",
      }),
    ).toEqual({ command: "move-item", ok: true });

    expect(
      snapshotState(model)
        .items.map(({ id }) => id)
        .toSorted(),
    ).toEqual(["source", "target"]);
    expect(
      position === "east" || position === "west"
        ? model.tracks.columns
        : model.tracks.rows,
    ).toEqual(["1fr", "1fr"]);
  });

  it("maps replace, remove and placeholder regeneration", () => {
    const model = new GridModel(
      "lifecycle",
      descriptor(["1fr", "1fr"], ["1fr"], {
        left: item("1/1/2/2"),
        right: item("1/2/2/3"),
      }),
    );

    expect(
      execute(model, { item: commandItem("replacement"), type: "add-item" }),
    ).toMatchObject({ ok: true });
    expect(
      execute(model, {
        itemId: "replacement",
        targetId: "right",
        type: "replace-item",
      }),
    ).toMatchObject({ ok: true });
    expect(
      execute(model, {
        itemId: "left",
        reason: "close",
        type: "remove-item",
      }),
    ).toMatchObject({ ok: true });
    expect(execute(model, { type: "regenerate-placeholders" })).toMatchObject({
      ok: true,
    });
    expect(model.toGridLayoutDescriptor()).toMatchObject(
      descriptor(["1fr"], ["1fr"], {
        replacement: item("1/1/2/2", {
          contentVisible: true,
          resizeable: false,
        }),
      }),
    );
  });

  it("maps direct, adjacent and proportional track resize inputs", () => {
    const model = new GridModel(
      "resize",
      descriptor(["100px", "100px"], ["100px", "100px", "200px"]),
    );

    expect(
      execute(model, {
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      }),
    ).toMatchObject({ ok: true });
    expect(
      execute(model, {
        contraTrackIndex: 1,
        delta: 25,
        distribution: "adjacent",
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
    ).toMatchObject({ ok: true });
    expect(
      execute(model, {
        afterConstraints: [
          { minimum: 80, trackIndices: [1] },
          { minimum: 80, trackIndices: [2] },
        ],
        afterTrackIndices: [1, 2],
        beforeConstraints: [{ minimum: 80, trackIndices: [0] }],
        beforeTrackIndices: [0],
        delta: -120,
        distribution: "proportional",
        initialSizes: [100, 100, 200],
        track: "row",
        type: "resize-tracks",
      }),
    ).toMatchObject({ ok: true });

    expect(model.tracks.columns).toEqual(["150px", "75px"]);
    expect(model.tracks.rows).toEqual(["220px", "80px", "100px"]);
  });

  it("maps stack create, add, select, reorder, rename and remove semantics", () => {
    const model = new GridModel(
      "stack",
      descriptor(["1fr"], ["1fr"], {
        alpha: item("1/1/2/2", { title: "Alpha" }),
        beta: item("1/1/2/2", { title: "Beta" }),
      }),
    );
    const executor = new LegacyGridCommandExecutor(model);

    expect(
      executor.execute({
        itemId: "beta",
        targetId: "alpha",
        type: "create-stack",
      }),
    ).toMatchObject({ ok: true });
    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }

    expect(
      executor.execute({
        item: commandItem("gamma", "1/1/2/2", "Gamma"),
        stackId,
        type: "add-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(
      executor.execute({
        itemId: "gamma",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(
      executor.execute({
        activate: true,
        itemId: "gamma",
        position: "before",
        stackId,
        targetItemId: "alpha",
        type: "reorder-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(
      executor.execute({
        itemId: "gamma",
        title: "Gamma renamed",
        type: "rename-item",
      }),
    ).toMatchObject({ ok: true });
    expect(
      executor.execute({
        itemId: "beta",
        stackId,
        type: "remove-stack-item",
      }),
    ).toMatchObject({ ok: true });

    expect(model.getTabState(stackId).tabs).toEqual([
      { id: "gamma", label: "Gamma renamed" },
      { id: "alpha", label: "Alpha" },
    ]);
    expect(model.getTabState(stackId).activeTab.id).toBe("gamma");
    expect(normalizeModel(model).tabs[0].tabs).toEqual(["gamma", "alpha"]);
  });

  it("uses tab IDs when duplicate titles are selected and reordered", () => {
    const model = new GridModel(
      "duplicate-tab-titles",
      descriptor(["1fr"], ["1fr"], {
        alpha: item("1/1/2/2", { title: "Same" }),
        beta: item("1/1/2/2", { title: "Same" }),
      }),
    );
    const executor = new LegacyGridCommandExecutor(model);
    executor.execute({
      itemId: "beta",
      targetId: "alpha",
      type: "create-stack",
    });

    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }

    expect(
      executor.execute({
        itemId: "beta",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(model.getTabState(stackId).activeTab.id).toBe("beta");
    expect(
      executor.execute({
        itemId: "beta",
        position: "before",
        stackId,
        targetItemId: "alpha",
        type: "reorder-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(model.getTabState(stackId).tabs.map(({ id }) => id)).toEqual([
      "beta",
      "alpha",
    ]);
  });

  it("aligns added stack items to the stack coordinates", () => {
    const model = new GridModel(
      "stack-position",
      descriptor(["1fr", "1fr"], ["1fr"], {
        alpha: item("1/2/2/3"),
        beta: item("1/2/2/3"),
      }),
    );
    const executor = new LegacyGridCommandExecutor(model);
    executor.execute({
      itemId: "beta",
      targetId: "alpha",
      type: "create-stack",
    });
    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }

    expect(
      executor.execute({
        item: commandItem("gamma", "1/1/2/2"),
        stackId,
        type: "add-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(model.getChildItem("gamma", true).gridArea).toBe("1/2/2/3");
  });

  it("removes the active item from a three-item stack without partial failure", () => {
    const model = new GridModel(
      "remove-active-tab",
      descriptor(["1fr"], ["1fr"], {
        alpha: item("1/1/2/2"),
        beta: item("1/1/2/2"),
      }),
    );
    const executor = new LegacyGridCommandExecutor(model);
    executor.execute({
      itemId: "beta",
      targetId: "alpha",
      type: "create-stack",
    });
    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }
    executor.execute({
      item: commandItem("gamma"),
      stackId,
      type: "add-stack-item",
    });
    executor.execute({
      itemId: "beta",
      stackId,
      type: "select-stack-item",
    });

    expect(
      executor.execute({
        itemId: "beta",
        stackId,
        type: "remove-stack-item",
      }),
    ).toMatchObject({ ok: true });
    expect(model.getTabState(stackId).tabs.map(({ id }) => id)).toEqual([
      "alpha",
      "gamma",
    ]);
    expect(model.getTabState(stackId).activeTab.id).toBe("gamma");
  });

  it("returns stable typed failures without mutating canonical state", () => {
    const model = new GridModel(
      "invalid",
      descriptor(["1fr"], ["1fr"], {
        source: item("1/1/2/2"),
        target: item("1/1/2/2", { resizeable: false }),
      }),
    );
    const before = snapshotState(model);
    const commands: Array<[GridCommand, string]> = [
      [{ item: commandItem("source"), type: "add-item" }, "DUPLICATE_ITEM_ID"],
      [{ item: commandItem("", "1/1/2/2"), type: "add-item" }, "INVALID_ITEM"],
      [
        { itemId: "missing", reason: "close", type: "remove-item" },
        "ITEM_NOT_FOUND",
      ],
      [
        {
          itemId: "source",
          position: "east",
          targetId: "target",
          type: "move-item",
        },
        "NON_RESIZABLE",
      ],
      [
        {
          index: 2,
          size: "10px",
          track: "column",
          type: "resize-track",
        },
        "TRACK_NOT_FOUND",
      ],
      [
        {
          item: commandItem("third"),
          stackId: "missing",
          type: "add-stack-item",
        },
        "STACK_NOT_FOUND",
      ],
      [
        {
          contraTrackIndex: 0,
          delta: 10,
          distribution: "adjacent",
          resizedTrackIndex: 0,
          track: "column",
          type: "resize-tracks",
        },
        "INVALID_TARGET",
      ],
    ];

    for (const [command, code] of commands) {
      expect(execute(model, command)).toMatchObject({
        error: { code },
        ok: false,
      });
    }
    expect(snapshotState(model)).toEqual(before);
  });

  it("rejects invalid stack tabs and targets with stable codes", () => {
    const model = new GridModel(
      "invalid-stack",
      descriptor(["1fr"], ["1fr"], {
        alpha: item("1/1/2/2"),
        beta: item("1/1/2/2"),
      }),
    );
    const executor = new LegacyGridCommandExecutor(model);
    executor.execute({
      itemId: "beta",
      targetId: "alpha",
      type: "create-stack",
    });
    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }
    const before = snapshotState(model);

    expect(
      executor.execute({
        itemId: "missing",
        stackId,
        type: "select-stack-item",
      }),
    ).toMatchObject({ error: { code: "TAB_NOT_FOUND" }, ok: false });
    expect(
      executor.execute({
        itemId: "alpha",
        position: "before",
        stackId,
        targetItemId: "alpha",
        type: "reorder-stack-item",
      }),
    ).toMatchObject({ error: { code: "INVALID_TARGET" }, ok: false });
    expect(snapshotState(model)).toEqual(before);
    expect(
      executor.execute({
        itemId: "alpha",
        position: "east",
        targetId: stackId,
        type: "move-item",
      }),
    ).toMatchObject({ error: { code: "INVALID_TARGET" }, ok: false });
  });

  it("requires explicit measurement data for fractional resize commands", () => {
    const model = new GridModel(
      "measured-resize",
      descriptor(["1fr", "1fr"], ["1fr"]),
    );

    expect(
      execute(model, {
        contraTrackIndex: 1,
        delta: 10,
        distribution: "adjacent",
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
    ).toMatchObject({
      error: { code: "MEASUREMENT_REQUIRED" },
      ok: false,
    });

    expect(
      execute(model, {
        contraTrackIndex: 1,
        delta: 10,
        distribution: "adjacent",
        measuredSizes: [100, 100],
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
    ).toMatchObject({ ok: true });
    expect(model.tracks.columns).toEqual(["110px", "90px"]);
  });

  it("rejects invalid proportional constraints before resizing", () => {
    const model = new GridModel(
      "invalid-constraints",
      descriptor(["100px"], ["100px", "100px"]),
    );
    const before = snapshotState(model);

    expect(
      execute(model, {
        afterConstraints: [{ minimum: 10, trackIndices: [2] }],
        afterTrackIndices: [1],
        beforeTrackIndices: [0],
        delta: 10,
        distribution: "proportional",
        track: "row",
        type: "resize-tracks",
      }),
    ).toMatchObject({ error: { code: "TRACK_NOT_FOUND" }, ok: false });
    expect(snapshotState(model)).toEqual(before);
  });

  it("surfaces typed command failures to compatibility dispatchers", () => {
    const result = execute(
      new GridModel("errors", descriptor(["1fr"], ["1fr"])),
      { itemId: "missing", reason: "close", type: "remove-item" },
    );

    expect(() => throwForGridCommandFailure(result)).toThrow(
      GridCommandExecutionError,
    );
    try {
      throwForGridCommandFailure(result);
      expect.unreachable("expected command failure");
    } catch (error) {
      expect(error).toMatchObject({ code: "ITEM_NOT_FOUND" });
    }
  });
});
