import { afterEach, describe, expect, it, vi } from "vitest";
import type { GridCommand } from "../src/GridCommand";
import {
  GridController,
  type GridCommittedTransition,
} from "../src/GridController";
import { GRID_HISTORY_COALESCE_MS, GridHistory } from "../src/GridHistory";
import { GridModel } from "../src/GridModel";
import type { GridSnapshot } from "../src/GridSnapshot";
import { descriptor, item } from "./model-scenario-harness";

const layoutOf = ({ revision: _revision, ...snapshot }: GridSnapshot) =>
  snapshot;

const resizeColumn = (index: number, size: `${number}px`): GridCommand => ({
  index,
  size,
  track: "column",
  type: "resize-track",
});

const rename = (itemId: string, title: string): GridCommand => ({
  itemId,
  title,
  type: "rename-item",
});

const controllerWithTwoItems = (history = new GridHistory(), gridId = "grid") =>
  new GridController(
    new GridModel(
      gridId,
      descriptor(["100px", "100px"], ["1fr"], {
        left: item("1/1/2/2", { title: "Left" }),
        right: item("1/2/2/3", { title: "Right" }),
      }),
    ),
    0,
    undefined,
    { history },
  );

const resizeInTransaction = (
  controller: GridController,
  size: `${number}px`,
  historyKey?: string,
) => {
  const started = controller.beginTransaction("resize", { historyKey });
  if (!started.ok) {
    throw Error(started.error.message);
  }
  expect(started.transaction.dispatch(resizeColumn(0, size))).toMatchObject({
    ok: true,
  });
  expect(started.transaction.commit()).toMatchObject({ ok: true });
};

describe("GridController history", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with nothing to undo or redo", () => {
    const controller = controllerWithTwoItems();
    expect(controller.history.canUndo()).toBe(false);
    expect(controller.history.canRedo()).toBe(false);
    expect(controller.history.undo()).toBe(false);
    expect(controller.history.redo()).toBe(false);
  });

  it("undoes and redoes committed dispatches in order", () => {
    const controller = controllerWithTwoItems();
    const initial = layoutOf(controller.getSnapshot());
    controller.dispatch(rename("left", "Renamed"));
    const renamed = layoutOf(controller.getSnapshot());
    controller.dispatch(resizeColumn(0, "150px"));
    const resized = layoutOf(controller.getSnapshot());

    expect(controller.history.undo()).toBe(true);
    expect(layoutOf(controller.getSnapshot())).toEqual(renamed);
    expect(controller.history.undo()).toBe(true);
    expect(layoutOf(controller.getSnapshot())).toEqual(initial);
    expect(controller.history.canUndo()).toBe(false);
    expect(controller.history.canRedo()).toBe(true);

    expect(controller.history.redo()).toBe(true);
    expect(layoutOf(controller.getSnapshot())).toEqual(renamed);
    expect(controller.history.redo()).toBe(true);
    expect(layoutOf(controller.getSnapshot())).toEqual(resized);
    expect(controller.history.canRedo()).toBe(false);
  });

  it("publishes undo and redo as committed transitions with a new revision", () => {
    const controller = controllerWithTwoItems();
    controller.dispatch(rename("left", "Renamed"));
    const committed: GridCommittedTransition[] = [];
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.subscribeCommitted((transition) => committed.push(transition));
    const before = controller.getSnapshot();

    controller.history.undo();
    const undone = controller.getSnapshot();
    controller.history.redo();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(committed.map(({ kind }) => kind)).toEqual(["undo", "redo"]);
    expect(committed[0]).toMatchObject({ previous: before, snapshot: undone });
    expect(undone.revision).toBe(before.revision + 1);
    expect(controller.getSnapshot().revision).toBe(before.revision + 2);
  });

  it("discards redo steps when a new change is committed", () => {
    const controller = controllerWithTwoItems();
    controller.dispatch(rename("left", "First"));
    controller.dispatch(rename("left", "Second"));
    controller.history.undo();
    controller.dispatch(rename("left", "Third"));

    expect(controller.history.canRedo()).toBe(false);
    controller.history.undo();
    expect(controller.getSnapshot().items[0]).toMatchObject({ title: "First" });
  });

  it("does not record rejected or no-op commands", () => {
    const controller = controllerWithTwoItems();
    controller.dispatch(rename("missing", "Missing"));
    controller.dispatch(rename("left", "Left"));
    expect(controller.history.canUndo()).toBe(false);
  });

  it("restores a removed item and keeps its id in the history", () => {
    const controller = controllerWithTwoItems();
    const initial = layoutOf(controller.getSnapshot());
    controller.dispatch({
      itemId: "left",
      reason: "close",
      type: "remove-item",
    });
    expect(controller.getSnapshot().items.map(({ id }) => id)).toEqual([
      "right",
    ]);
    expect(controller.history.getItemIds(controller)).toContain("left");

    controller.history.undo();
    expect(layoutOf(controller.getSnapshot())).toEqual(initial);
    controller.history.redo();
    expect(controller.getSnapshot().items.map(({ id }) => id)).toEqual([
      "right",
    ]);
  });

  it("undoes a transaction as one step", () => {
    const controller = controllerWithTwoItems();
    const initial = layoutOf(controller.getSnapshot());
    const started = controller.beginTransaction("resize");
    if (!started.ok) {
      throw Error(started.error.message);
    }
    started.transaction.dispatch(resizeColumn(0, "120px"));
    started.transaction.dispatch(resizeColumn(0, "140px"));
    started.transaction.commit();

    controller.history.undo();
    expect(layoutOf(controller.getSnapshot())).toEqual(initial);
    expect(controller.history.canUndo()).toBe(false);
  });

  it("does not record a rolled-back transaction", () => {
    const controller = controllerWithTwoItems();
    const started = controller.beginTransaction("resize");
    if (!started.ok) {
      throw Error(started.error.message);
    }
    started.transaction.dispatch(resizeColumn(0, "120px"));
    started.transaction.rollback();
    expect(controller.history.canUndo()).toBe(false);
  });

  it("refuses undo and redo while a transaction is active", () => {
    const controller = controllerWithTwoItems();
    controller.dispatch(rename("left", "Renamed"));
    controller.dispatch(rename("left", "Again"));
    controller.history.undo();
    const started = controller.beginTransaction("drag");
    if (!started.ok) {
      throw Error(started.error.message);
    }
    expect(controller.history.undo()).toBe(false);
    expect(controller.history.redo()).toBe(false);
    started.transaction.rollback();
    expect(controller.history.canUndo()).toBe(true);
    expect(controller.history.canRedo()).toBe(true);
  });

  it("merges commits with the same history key made close together", () => {
    vi.useFakeTimers();
    const controller = controllerWithTwoItems();
    const initial = layoutOf(controller.getSnapshot());
    resizeInTransaction(controller, "110px", "splitter");
    vi.advanceTimersByTime(GRID_HISTORY_COALESCE_MS - 1);
    resizeInTransaction(controller, "120px", "splitter");
    vi.advanceTimersByTime(GRID_HISTORY_COALESCE_MS - 1);
    resizeInTransaction(controller, "130px", "splitter");

    controller.history.undo();
    expect(layoutOf(controller.getSnapshot())).toEqual(initial);
    expect(controller.history.canUndo()).toBe(false);
  });

  it("keeps commits separate when keys differ, are missing or are far apart", () => {
    vi.useFakeTimers();
    const controller = controllerWithTwoItems();
    resizeInTransaction(controller, "110px", "a");
    resizeInTransaction(controller, "120px", "b");
    resizeInTransaction(controller, "130px");
    resizeInTransaction(controller, "140px");
    resizeInTransaction(controller, "150px", "b");
    vi.advanceTimersByTime(GRID_HISTORY_COALESCE_MS + 1);
    resizeInTransaction(controller, "160px", "b");

    let steps = 0;
    while (controller.history.undo()) {
      steps += 1;
    }
    expect(steps).toBe(6);
  });

  it("drops the oldest steps beyond the history limit", () => {
    const controller = controllerWithTwoItems(new GridHistory({ limit: 2 }));
    controller.dispatch(rename("left", "One"));
    controller.dispatch(rename("left", "Two"));
    controller.dispatch(rename("left", "Three"));

    controller.history.undo();
    controller.history.undo();
    expect(controller.history.canUndo()).toBe(false);
    expect(controller.getSnapshot().items[0]).toMatchObject({ title: "One" });
  });

  it("notifies history listeners when steps are added or moved", () => {
    const controller = controllerWithTwoItems();
    const listener = vi.fn();
    controller.history.subscribe(listener);
    controller.dispatch(rename("left", "One"));
    controller.history.undo();
    controller.history.redo();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("clears the history", () => {
    const controller = controllerWithTwoItems();
    controller.dispatch(rename("left", "One"));
    controller.dispatch(rename("left", "Two"));
    controller.history.undo();
    const listener = vi.fn();
    controller.history.subscribe(listener);

    controller.history.clear();
    expect(controller.history.canUndo()).toBe(false);
    expect(controller.history.canRedo()).toBe(false);
    expect(controller.history.getItemIds(controller).size).toBe(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("GridController history with stacks", () => {
  const stackedController = () => {
    const controller = new GridController(
      new GridModel(
        "grid",
        descriptor(["1fr", "1fr"], ["1fr"], {
          alpha: item("1/1/2/2", { title: "Alpha" }),
          beta: item("1/2/2/3", { title: "Beta" }),
        }),
      ),
    );
    controller.dispatch({
      itemId: "beta",
      targetId: "alpha",
      type: "create-stack",
    });
    const [stack] = controller.getSnapshot().stacks;
    if (!stack) {
      throw Error("expected a stack");
    }
    return { controller, stackId: stack.id };
  };

  it("does not make selecting a tab an undo step of its own", () => {
    const { controller, stackId } = stackedController();
    controller.dispatch(rename("alpha", "Renamed"));
    const selected = controller.getSnapshot().stacks[0]?.selectedItemId;
    const other = selected === "alpha" ? "beta" : "alpha";

    controller.dispatch({ itemId: other, stackId, type: "select-stack-item" });
    expect(controller.getSnapshot().stacks[0]?.selectedItemId).toBe(other);

    controller.history.undo();
    expect(
      controller.getSnapshot().items.find(({ id }) => id === "alpha"),
    ).toMatchObject({ title: "Alpha" });
    expect(controller.getSnapshot().stacks[0]?.selectedItemId).toBe(selected);

    controller.history.redo();
    expect(controller.getSnapshot().stacks[0]?.selectedItemId).toBe(other);
  });

  it("undoes stack creation", () => {
    const { controller } = stackedController();
    controller.history.undo();
    expect(controller.getSnapshot().stacks).toEqual([]);
    expect(
      controller
        .getSnapshot()
        .items.map(({ id }) => id)
        .sort(),
    ).toEqual(["alpha", "beta"]);
  });
});

describe("GridHistory shared between grids", () => {
  it("undoes and redoes the most recent change whichever grid made it", () => {
    const history = new GridHistory();
    const outer = controllerWithTwoItems(history, "outer");
    const inner = controllerWithTwoItems(history, "inner");
    outer.dispatch(rename("left", "Outer"));
    inner.dispatch(rename("left", "Inner"));

    const titleOf = (controller: GridController) =>
      controller.getSnapshot().items.find(({ id }) => id === "left")?.title;

    history.undo();
    expect(titleOf(inner)).toBe("Left");
    expect(titleOf(outer)).toBe("Outer");
    history.undo();
    expect(titleOf(outer)).toBe("Left");

    history.redo();
    expect(titleOf(outer)).toBe("Outer");
    expect(titleOf(inner)).toBe("Left");
    history.redo();
    expect(titleOf(inner)).toBe("Inner");
  });

  it("only blocks undo while the grid that made the change has a transaction", () => {
    const history = new GridHistory();
    const outer = controllerWithTwoItems(history, "outer");
    const inner = controllerWithTwoItems(history, "inner");
    outer.dispatch(rename("left", "Outer"));
    const started = inner.beginTransaction("drag");
    expect(history.undo()).toBe(true);
    if (started.ok) {
      started.transaction.rollback();
    }

    inner.dispatch(rename("left", "Inner"));
    const again = inner.beginTransaction("drag");
    expect(history.undo()).toBe(false);
    if (again.ok) {
      again.transaction.rollback();
    }
  });

  it("removes one grid's steps and item ids", () => {
    const history = new GridHistory();
    const outer = controllerWithTwoItems(history, "outer");
    const inner = controllerWithTwoItems(history, "inner");
    outer.dispatch(rename("left", "Outer"));
    inner.dispatch({ itemId: "right", reason: "close", type: "remove-item" });
    expect(history.getItemIds(inner)).toContain("right");

    history.clear(inner);
    expect(history.getItemIds(inner).size).toBe(0);
    expect(history.undo()).toBe(true);
    expect(history.canUndo()).toBe(false);
    expect(outer.getSnapshot().items[0]).toMatchObject({ title: "Left" });
  });
});
