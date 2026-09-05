import { describe, expect, it, vi } from "vitest";
import {
  GridController,
  type GridCommittedTransition,
} from "../src/GridController";
import type { GridCommand } from "../src/GridCommand";
import { GridModel } from "../src/GridModel";
import { descriptor, item, normalizeModel } from "./model-scenario-harness";

const resizeColumn = (index: number, size: `${number}px`): GridCommand => ({
  index,
  size,
  track: "column",
  type: "resize-track",
});

const modelWithTwoItems = (id = "grid") =>
  new GridModel(
    id,
    descriptor(["100px", "100px"], ["1fr"], {
      left: item("1/1/2/2", { title: "Left" }),
      right: item("1/2/2/3", { title: "Right" }),
    }),
  );

describe("GridController external store", () => {
  it("keeps snapshot identity stable until semantic state changes", () => {
    const controller = new GridController(modelWithTwoItems());
    const initial = controller.getSnapshot();

    expect(controller.getSnapshot()).toBe(initial);
    expect(
      controller.dispatch({
        itemId: "left",
        title: "Left",
        type: "rename-item",
      }),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot()).toBe(initial);

    expect(
      controller.dispatch({
        itemId: "left",
        title: "Renamed",
        type: "rename-item",
      }),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot()).not.toBe(initial);
  });

  it("notifies once per visible transition and never for rejects or no-ops", () => {
    const controller = new GridController(modelWithTwoItems());
    const listener = vi.fn();
    const commitListener = vi.fn();
    controller.subscribe(listener);
    controller.subscribeCommitted(commitListener);

    controller.dispatch({
      itemId: "missing",
      title: "Missing",
      type: "rename-item",
    });
    controller.dispatch({
      itemId: "left",
      title: "Left",
      type: "rename-item",
    });
    expect(listener).not.toHaveBeenCalled();
    expect(commitListener).not.toHaveBeenCalled();

    controller.dispatch({
      itemId: "left",
      title: "Renamed",
      type: "rename-item",
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("supports idempotent unsubscribe and reentrant listener changes", () => {
    const controller = new GridController(modelWithTwoItems());
    const late = vi.fn();
    const removed = vi.fn();
    let unsubscribeRemoved = () => {};
    const first = vi.fn(() => {
      unsubscribeRemoved();
      controller.subscribe(late);
    });
    const unsubscribeFirst = controller.subscribe(first);
    unsubscribeRemoved = controller.subscribe(removed);

    controller.dispatch(resizeColumn(0, "120px"));
    expect(first).toHaveBeenCalledTimes(1);
    expect(removed).not.toHaveBeenCalled();
    expect(late).not.toHaveBeenCalled();

    unsubscribeFirst();
    unsubscribeFirst();
    controller.dispatch(resizeColumn(0, "130px"));
    expect(first).toHaveBeenCalledTimes(1);
    expect(late).toHaveBeenCalledTimes(1);
  });

  it("keeps published snapshots detached from later legacy mutations", () => {
    const model = modelWithTwoItems();
    const controller = new GridController(model);
    const initial = controller.getSnapshot();

    model.tracks.resizeTo("column", 0, "175px");
    model.updateChildTitle("left", "Mutated directly");

    expect(initial.columns[0].size).toBe("100px");
    expect(initial.items.find(({ id }) => id === "left")?.title).toBe("Left");
    expect(controller.getSnapshot()).toBe(initial);
  });

  it("commits ordinary dispatches with one revision and commit event", () => {
    const controller = new GridController(modelWithTwoItems(), 7);
    const stateListener = vi.fn();
    const transitions: GridCommittedTransition[] = [];
    controller.subscribe(stateListener);
    controller.subscribeCommitted((transition) => transitions.push(transition));

    controller.dispatch(resizeColumn(0, "125px"));

    expect(controller.getSnapshot().revision).toBe(8);
    expect(stateListener).toHaveBeenCalledTimes(1);
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({
      commands: [{ type: "resize-track" }],
      kind: "dispatch",
      previous: { revision: 7 },
      snapshot: { revision: 8 },
    });
  });

  it("isolates subscriptions between controller instances", () => {
    const outer = new GridController(modelWithTwoItems("outer"));
    const inner = new GridController(modelWithTwoItems("inner"));
    const outerListener = vi.fn();
    const innerListener = vi.fn();
    outer.subscribe(outerListener);
    inner.subscribe(innerListener);

    inner.dispatch(resizeColumn(1, "140px"));

    expect(innerListener).toHaveBeenCalledTimes(1);
    expect(outerListener).not.toHaveBeenCalled();
    expect(outer.getSnapshot().revision).toBe(0);
  });
});

describe("GridController transactions", () => {
  it("atomically replaces a preview from the transaction baseline", () => {
    const controller = new GridController(modelWithTwoItems(), 3);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    expect(start.transaction.replace([resizeColumn(0, "125px")])).toMatchObject(
      {
        ok: true,
      },
    );
    expect(controller.getSnapshot().columns[0].size).toBe("125px");
    expect(start.transaction.replace([resizeColumn(1, "80px")])).toMatchObject({
      ok: true,
    });

    expect(controller.getSnapshot().columns.map(({ size }) => size)).toEqual([
      "100px",
      "80px",
    ]);

    expect(
      start.transaction.replace([
        {
          itemId: "missing",
          title: "Missing",
          type: "rename-item",
        },
      ]),
    ).toMatchObject({ error: { code: "ITEM_NOT_FOUND" }, ok: false });
    expect(controller.getSnapshot().columns.map(({ size }) => size)).toEqual([
      "100px",
      "100px",
    ]);
    expect(start.transaction.commit()).toEqual({
      ok: true,
      snapshot: controller.getSnapshot(),
    });
    expect(controller.getSnapshot().revision).toBe(3);
  });

  it("replaces target previews from an explicit working baseline", () => {
    const controller = new GridController(modelWithTwoItems(), 3);
    const baseline = controller.getSnapshot();
    const committed = vi.fn();
    controller.subscribeCommitted(committed);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    expect(
      start.transaction.establishWorkingBaseline([
        { itemId: "left", reason: "drag", type: "remove-item" },
      ]),
    ).toMatchObject({ ok: true });
    const working = controller.getSnapshot();
    expect(working.items.map(({ id }) => id)).toEqual(["right"]);
    expect(working.columns).toHaveLength(1);

    expect(start.transaction.replace([resizeColumn(0, "125px")])).toMatchObject(
      {
        ok: true,
      },
    );
    expect(controller.getSnapshot().columns[0].size).toBe("125px");
    expect(start.transaction.replace([])).toMatchObject({ ok: true });
    expect(controller.getSnapshot()).toEqual(working);
    expect(start.transaction.rollback()).toMatchObject({ ok: true });
    expect(controller.getSnapshot()).toBe(baseline);
    expect(committed).not.toHaveBeenCalled();
  });

  it("validates a replacement without publishing it over the working baseline", () => {
    const controller = new GridController(modelWithTwoItems(), 3);
    const listener = vi.fn();
    controller.subscribe(listener);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    expect(
      start.transaction.establishWorkingBaseline([
        { itemId: "left", reason: "drag", type: "remove-item" },
      ]),
    ).toMatchObject({ ok: true });
    const workingBaseline = controller.getSnapshot();
    listener.mockClear();

    expect(
      start.transaction.validateReplacement([resizeColumn(0, "125px")]),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot()).toBe(workingBaseline);
    expect(controller.getSnapshot().columns).toEqual(workingBaseline.columns);
    expect(listener).not.toHaveBeenCalled();

    expect(start.transaction.replace([resizeColumn(0, "125px")])).toMatchObject(
      { ok: true },
    );
    expect(start.transaction.commit()).toMatchObject({
      ok: true,
      snapshot: { revision: 4 },
    });
  });

  it("publishes previews at the committed revision and commits once", () => {
    const controller = new GridController(modelWithTwoItems(), 4);
    const stateListener = vi.fn();
    const commitListener = vi.fn();
    controller.subscribe(stateListener);
    controller.subscribeCommitted(commitListener);
    const start = controller.beginTransaction("resize");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    start.transaction.dispatch(resizeColumn(0, "125px"));
    expect(controller.getSnapshot()).toMatchObject({ revision: 4 });
    start.transaction.dispatch(resizeColumn(1, "75px"));
    expect(controller.getSnapshot()).toMatchObject({ revision: 4 });
    expect(stateListener).toHaveBeenCalledTimes(2);
    expect(commitListener).not.toHaveBeenCalled();

    expect(start.transaction.commit()).toMatchObject({
      ok: true,
      snapshot: { revision: 5 },
    });
    expect(stateListener).toHaveBeenCalledTimes(3);
    expect(commitListener).toHaveBeenCalledTimes(1);
    expect(commitListener.mock.calls[0][0]).toMatchObject({
      commands: [{ type: "resize-track" }, { type: "resize-track" }],
      kind: "resize",
      previous: { revision: 4 },
      snapshot: { revision: 5 },
    });
  });

  it("closes a net-unchanged transaction without a revision or commit event", () => {
    const controller = new GridController(modelWithTwoItems(), 4);
    const baseline = controller.getSnapshot();
    const stateListener = vi.fn();
    const commitListener = vi.fn();
    controller.subscribe(stateListener);
    controller.subscribeCommitted(commitListener);
    const start = controller.beginTransaction("resize");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    start.transaction.dispatch(resizeColumn(0, "125px"));
    start.transaction.dispatch(resizeColumn(0, "100px"));
    expect(controller.getSnapshot()).toBe(baseline);
    expect(start.transaction.commit()).toEqual({
      ok: true,
      snapshot: baseline,
    });
    expect(controller.getSnapshot()).toBe(baseline);
    expect(controller.getSnapshot().revision).toBe(4);
    expect(stateListener).toHaveBeenCalledTimes(2);
    expect(commitListener).not.toHaveBeenCalled();
  });

  it("publishes and commits runtime tab order", () => {
    const model = modelWithTwoItems();
    model.stackChildItems("left", "right");
    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }
    const controller = new GridController(model);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    start.transaction.dispatch({
      itemId: "right",
      position: "before",
      stackId,
      targetItemId: "left",
      type: "reorder-stack-item",
    });

    expect(controller.getSnapshot().stacks[0].itemIds).toEqual([
      "right",
      "left",
    ]);
    expect(start.transaction.commit()).toMatchObject({
      ok: true,
      snapshot: {
        revision: 1,
        stacks: [{ itemIds: ["right", "left"] }],
      },
    });
  });

  it("closes a no-op tab reorder without publishing a revision", () => {
    const model = modelWithTwoItems();
    model.stackChildItems("left", "right");
    const stackId = model.getStackStates()[0].id;
    const controller = new GridController(model);
    const baseline = controller.getSnapshot();
    const committed = vi.fn();
    controller.subscribeCommitted(committed);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    expect(
      start.transaction.replace([
        {
          itemId: "left",
          position: "before",
          stackId,
          targetItemId: "right",
          type: "reorder-stack-item",
        },
      ]),
    ).toMatchObject({ ok: true });
    expect(start.transaction.commit()).toEqual({
      ok: true,
      snapshot: baseline,
    });
    expect(controller.getSnapshot()).toBe(baseline);
    expect(committed).not.toHaveBeenCalled();
  });

  it("reconciles legacy stack observers when structural previews roll back", () => {
    const model = modelWithTwoItems();
    const removed = vi.fn();
    model.on("tabs-removed", removed);
    const controller = new GridController(model);
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    start.transaction.dispatch({
      itemId: "right",
      targetId: "left",
      type: "create-stack",
    });
    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    start.transaction.rollback();

    expect(removed).toHaveBeenCalledExactlyOnceWith(stackId);
  });

  it("rejects nested transactions and command failure leaves the transaction active", () => {
    const controller = new GridController(modelWithTwoItems());
    const start = controller.beginTransaction("drag");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    expect(controller.beginTransaction("resize")).toEqual({
      error: {
        code: "TRANSACTION_ACTIVE",
        message: "Cannot begin resize; a grid transaction is already active",
      },
      ok: false,
    });
    expect(
      start.transaction.dispatch({
        itemId: "missing",
        title: "No item",
        type: "rename-item",
      }),
    ).toMatchObject({ error: { code: "ITEM_NOT_FOUND" }, ok: false });
    expect(start.transaction.dispatch(resizeColumn(0, "115px"))).toMatchObject({
      ok: true,
    });
    expect(start.transaction.commit()).toMatchObject({ ok: true });
  });

  it("restores stacks, tabs, placeholders, fractional tracks and runtime metadata exactly", () => {
    const model = new GridModel(
      "rollback",
      descriptor(["1fr", "2fr"], ["1fr"], {
        alpha: item("1/1/2/2", { title: "Alpha" }),
        beta: item("1/1/2/2", { title: "Beta" }),
      }),
    );
    model.stackChildItems("alpha", "beta");
    const stackId = model.childItems.find(
      ({ type }) => type === "stacked-content",
    )?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }
    model.createPlaceholders();
    const alpha = model.getChildItem("alpha", true);
    const stack = model.getChildItem(stackId, true);
    alpha.dragging = true;
    stack.horizontalSplitter = true;
    model.tracks.getTracks("column")[0].measuredValue = 100;
    model.tracks.getTracks("column")[1].measuredValue = 200;
    const before = normalizeModel(model);
    const beforePlaceholders = model.getPlaceholders();
    const beforeTracks = model.tracks.getTracks("column");
    const controller = new GridController(model, 9);
    const baseline = controller.getSnapshot();
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
      activate: true,
      itemId: "beta",
      position: "before",
      stackId,
      targetItemId: "alpha",
      type: "reorder-stack-item",
    });
    start.transaction.dispatch({
      contraTrackIndex: 1,
      delta: 25,
      distribution: "adjacent",
      measuredSizes: [100, 200],
      resizedTrackIndex: 0,
      track: "column",
      type: "resize-tracks",
    });
    start.transaction.dispatch({ type: "regenerate-placeholders" });
    const previewNotificationCount = stateListener.mock.calls.length;

    expect(start.transaction.rollback()).toEqual({
      ok: true,
      snapshot: baseline,
    });
    expect(controller.getSnapshot()).toBe(baseline);
    expect(normalizeModel(model)).toEqual(before);
    expect(model.getPlaceholders()).toEqual(beforePlaceholders);
    expect(model.getChildItem("alpha", true)).toBe(alpha);
    expect(model.getChildItem(stackId, true)).toBe(stack);
    expect(alpha.dragging).toBe(true);
    expect(stack.horizontalSplitter).toBe(true);
    expect(model.tracks.columns).toEqual(["1fr", "2fr"]);
    expect(
      model.tracks
        .getTracks("column")
        .map(({ measuredValue }) => measuredValue),
    ).toEqual([100, 200]);
    expect(model.tracks.getTracks("column")).toEqual(beforeTracks);
    expect(controller.getSnapshot().revision).toBe(9);
    expect(stateListener).toHaveBeenCalledTimes(previewNotificationCount + 1);
    expect(commitListener).not.toHaveBeenCalled();
  });

  it("returns typed errors for dispatch and repeated close after closure", () => {
    const controller = new GridController(modelWithTwoItems());
    const start = controller.beginTransaction("resize");
    expect(start.ok).toBe(true);
    if (!start.ok) {
      return;
    }

    expect(controller.dispatch(resizeColumn(0, "150px"))).toMatchObject({
      error: { code: "TRANSACTION_ACTIVE" },
      ok: false,
    });
    expect(start.transaction.rollback()).toMatchObject({ ok: true });
    expect(start.transaction.dispatch(resizeColumn(0, "160px"))).toMatchObject({
      error: { code: "TRANSACTION_CLOSED" },
      ok: false,
    });
    expect(start.transaction.commit()).toMatchObject({
      error: { code: "TRANSACTION_CLOSED" },
      ok: false,
    });
    expect(start.transaction.rollback()).toMatchObject({
      error: { code: "TRANSACTION_CLOSED" },
      ok: false,
    });
  });
});
