import { describe, expect, it, vi } from "vitest";
import { GridController } from "../src/GridController";
import {
  GridDragCoordinator,
  createGridDropPlan,
  type GridDragSource,
} from "../src/GridDragCoordinator";
import { GridModel } from "../src/GridModel";
import { descriptor, item } from "./model-scenario-harness";

const createController = (id = "grid") =>
  new GridController(
    new GridModel(
      id,
      descriptor(["1fr", "1fr"], ["1fr"], {
        left: item("1/1/2/2", { resizeable: "hv", title: "Duplicate" }),
        right: item("1/2/2/3", { resizeable: "hv", title: "Duplicate" }),
      }),
    ),
  );

const createThreeItemController = () =>
  new GridController(
    new GridModel(
      "grid",
      descriptor(["1fr", "1fr", "1fr"], ["1fr"], {
        alpha: item("1/1/2/2", { resizeable: "hv", title: "Same" }),
        beta: item("1/2/2/3", { resizeable: "hv", title: "Same" }),
        gamma: item("1/3/2/4", { resizeable: "hv", title: "Gamma" }),
      }),
    ),
  );

const existing = (itemId: string, sourceGridId = "grid"): GridDragSource => ({
  itemId,
  kind: "existing-item",
  sourceGridId,
});

const template: GridDragSource = {
  item: {
    column: { span: 1, start: 1 },
    dropTarget: true,
    header: true,
    id: "template-instance",
    resizeable: "hv",
    row: { span: 1, start: 1 },
    title: "Template",
  },
  kind: "palette-template",
  templateId: "palette-template",
};

describe("createGridDropPlan", () => {
  it.each([
    "north",
    "south",
    "east",
    "west",
  ] as const)("translates an existing-item %s split to typed commands", (position) => {
    expect(
      createGridDropPlan(existing("left"), {
        gridId: "grid",
        intent: { kind: "split", position },
        targetId: "right",
      }),
    ).toMatchObject({
      commands: [
        { itemId: "left", position, targetId: "right", type: "move-item" },
        { type: "regenerate-placeholders" },
      ],
    });
  });

  it("materializes a template before replace, stack create, or stack add", () => {
    expect(
      createGridDropPlan(template, {
        gridId: "grid",
        intent: { kind: "replace" },
        targetId: "left",
      }),
    ).toMatchObject({
      commands: [
        { item: { id: "template-instance" }, type: "add-item" },
        {
          itemId: "template-instance",
          targetId: "left",
          type: "replace-item",
        },
        { type: "regenerate-placeholders" },
      ],
    });
    expect(
      createGridDropPlan(template, {
        gridId: "grid",
        intent: { kind: "create-stack" },
        targetId: "left",
      }),
    ).toMatchObject({
      commands: [
        { item: { id: "template-instance" }, type: "add-item" },
        {
          itemId: "template-instance",
          selectedItemId: "template-instance",
          targetId: "left",
          type: "create-stack",
        },
        { type: "regenerate-placeholders" },
      ],
    });
    expect(
      createGridDropPlan(template, {
        gridId: "grid",
        intent: {
          kind: "stack",
          position: "after",
          targetItemId: "left",
        },
        targetId: "stack",
      }),
    ).toMatchObject({
      commands: [
        {
          item: { id: "template-instance" },
          stackId: "stack",
          type: "add-stack-item",
        },
        {
          itemId: "template-instance",
          stackId: "stack",
          type: "select-stack-item",
        },
        { type: "regenerate-placeholders" },
      ],
    });
  });

  it("blocks existing items across controller scopes while allowing templates", () => {
    expect(
      createGridDropPlan(existing("left", "parent"), {
        gridId: "child",
        intent: { kind: "replace" },
        targetId: "child-item",
      }),
    ).toMatchObject({ code: "CROSS_GRID_DRAG" });
    expect(
      createGridDropPlan(template, {
        gridId: "child",
        intent: { kind: "replace" },
        targetId: "child-item",
      }),
    ).toMatchObject({
      commands: [
        { type: "add-item" },
        { itemId: "template-instance", type: "replace-item" },
        { type: "regenerate-placeholders" },
      ],
    });
  });

  it("uses stable IDs for reorder even when titles are duplicated", () => {
    expect(
      createGridDropPlan(
        {
          itemId: "right",
          kind: "stack-member",
          selected: true,
          sourceGridId: "grid",
          stackId: "stack",
        },
        {
          gridId: "grid",
          intent: {
            kind: "stack",
            position: "before",
            targetItemId: "left",
          },
          targetId: "stack",
        },
      ),
    ).toMatchObject({
      commands: [
        {
          activate: true,
          itemId: "right",
          position: "before",
          stackId: "stack",
          targetItemId: "left",
          type: "reorder-stack-item",
        },
        { type: "regenerate-placeholders" },
      ],
    });
  });
});

describe("GridDragCoordinator", () => {
  it.each([
    "north",
    "south",
    "east",
    "west",
  ] as const)("commits a palette template %s split as one revision", (position) => {
    const controller = createController();
    const coordinator = new GridDragCoordinator("grid", controller);
    const committed = vi.fn();
    controller.subscribeCommitted(committed);
    coordinator.begin(template);

    expect(
      coordinator.preview({
        gridId: "grid",
        intent: { kind: "split", position },
        targetId: "left",
      }),
    ).toMatchObject({ ok: true });
    expect(coordinator.commit()).toMatchObject({ ok: true });

    expect(controller.getSnapshot().revision).toBe(1);
    expect(
      controller
        .getSnapshot()
        .items.some(({ id }) => id === "template-instance"),
    ).toBe(true);
    expect(committed).toHaveBeenCalledTimes(1);
  });

  it("creates a stack and moves standalone and stacked members through commands", () => {
    const controller = createThreeItemController();
    const create = new GridDragCoordinator("grid", controller);
    create.begin(existing("beta"));
    create.preview({
      gridId: "grid",
      intent: { kind: "create-stack" },
      targetId: "alpha",
    });

    expect(create.commit()).toMatchObject({ ok: true });
    const stackId = controller.getSnapshot().stacks[0]?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }
    expect(controller.getSnapshot().stacks[0].selectedItemId).toBe("beta");

    const stackedReplacement = new GridDragCoordinator("grid", controller);
    stackedReplacement.begin({
      itemId: "beta",
      kind: "stack-member",
      selected: true,
      sourceGridId: "grid",
      stackId,
    });
    expect(
      stackedReplacement.preview({
        gridId: "grid",
        intent: { kind: "replace" },
        targetId: "alpha",
      }),
    ).toMatchObject({
      error: { code: "TRANSACTION_FAILURE" },
      ok: false,
    });
    expect(controller.getSnapshot().stacks[0].itemIds).toEqual([
      "alpha",
      "beta",
    ]);
    stackedReplacement.cancel();

    const baseline = controller.getSnapshot();
    expect(
      controller.dispatch({
        itemId: "gamma",
        position: "before",
        stackId,
        targetItemId: "missing",
        type: "move-item-to-stack",
      }),
    ).toMatchObject({ error: { code: "TAB_NOT_FOUND" }, ok: false });
    expect(controller.getSnapshot()).toBe(baseline);

    const add = new GridDragCoordinator("grid", controller);
    add.begin(existing("gamma"));
    add.preview({
      gridId: "grid",
      intent: {
        kind: "stack",
        position: "after",
        targetItemId: "alpha",
      },
      targetId: stackId,
    });
    expect(add.commit()).toMatchObject({ ok: true });
    expect(controller.getSnapshot().stacks[0].itemIds).toEqual([
      "alpha",
      "gamma",
      "beta",
    ]);
    expect(controller.getSnapshot().stacks[0].selectedItemId).toBe("gamma");

    const detach = new GridDragCoordinator("grid", controller);
    detach.begin({
      itemId: "gamma",
      kind: "stack-member",
      selected: true,
      sourceGridId: "grid",
      stackId,
    });
    detach.preview({
      gridId: "grid",
      intent: { kind: "split", position: "south" },
      targetId: stackId,
    });
    expect(detach.commit()).toMatchObject({ ok: true });
    expect(controller.getSnapshot().stacks[0].itemIds).toEqual([
      "alpha",
      "beta",
    ]);
    expect(
      controller.getSnapshot().items.find(({ id }) => id === "gamma"),
    ).toMatchObject({ id: "gamma", title: "Gamma" });
  });

  it("moves a member out of a two-item stack without losing the dissolved target", () => {
    const controller = createController();
    const create = new GridDragCoordinator("grid", controller);
    create.begin(existing("right"));
    create.preview({
      gridId: "grid",
      intent: { kind: "create-stack" },
      targetId: "left",
    });
    create.commit();
    const stackId = controller.getSnapshot().stacks[0]?.id;
    expect(stackId).toBeDefined();
    if (!stackId) {
      return;
    }

    const detach = new GridDragCoordinator("grid", controller);
    detach.begin({
      itemId: "right",
      kind: "stack-member",
      selected: true,
      sourceGridId: "grid",
      stackId,
    });
    expect(
      detach.preview({
        gridId: "grid",
        intent: { kind: "split", position: "south" },
        targetId: stackId,
      }),
    ).toMatchObject({ ok: true });
    expect(detach.commit()).toMatchObject({ ok: true });
    expect(controller.getSnapshot().stacks).toEqual([]);
    expect(
      controller
        .getSnapshot()
        .items.filter(({ id }) => id === "left" || id === "right"),
    ).toHaveLength(2);
  });

  it("replaces each preview from the exact baseline and commits once", () => {
    const controller = createController();
    const coordinator = new GridDragCoordinator("grid", controller);
    const committed = vi.fn();
    controller.subscribeCommitted(committed);

    expect(coordinator.begin(existing("left"))).toMatchObject({ ok: true });
    expect(
      coordinator.preview({
        gridId: "grid",
        intent: { kind: "split", position: "north" },
        targetId: "right",
      }),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot().rows).toHaveLength(2);

    expect(
      coordinator.preview({
        gridId: "grid",
        intent: { kind: "split", position: "west" },
        targetId: "right",
      }),
    ).toMatchObject({ ok: true });
    expect(controller.getSnapshot().rows).toHaveLength(1);
    expect(controller.getSnapshot().columns.length).toBeGreaterThanOrEqual(2);

    expect(coordinator.commit()).toMatchObject({ ok: true });
    expect(controller.getSnapshot().revision).toBe(1);
    expect(committed).toHaveBeenCalledTimes(1);
    expect(committed.mock.calls[0][0].commands).toEqual([
      {
        itemId: "left",
        position: "west",
        targetId: "right",
        type: "move-item",
      },
      { type: "regenerate-placeholders" },
    ]);
  });

  it("rolls back cancel, invalid targets, and disposal without a revision", () => {
    for (const close of ["cancel", "dispose"] as const) {
      const controller = createController();
      const baseline = controller.getSnapshot();
      const coordinator = new GridDragCoordinator("grid", controller);
      const committed = vi.fn();
      controller.subscribeCommitted(committed);
      coordinator.begin(existing("left"));
      coordinator.preview({
        gridId: "grid",
        intent: { kind: "replace" },
        targetId: "right",
      });

      coordinator[close]();

      expect(controller.getSnapshot()).toBe(baseline);
      expect(committed).not.toHaveBeenCalled();
    }

    const controller = createController();
    const baseline = controller.getSnapshot();
    const coordinator = new GridDragCoordinator("grid", controller);
    coordinator.begin(existing("left"));
    expect(
      coordinator.preview({
        gridId: "other",
        intent: { kind: "replace" },
        targetId: "right",
      }),
    ).toMatchObject({ error: { code: "CROSS_GRID_DRAG" }, ok: false });
    expect(controller.getSnapshot()).toBe(baseline);
  });

  it("returns typed invalid-transition and command failures", () => {
    const controller = createController();
    const coordinator = new GridDragCoordinator("grid", controller);
    expect(coordinator.commit()).toMatchObject({
      error: { code: "INVALID_TRANSITION" },
      ok: false,
    });
    coordinator.begin(existing("left"));
    expect(
      coordinator.preview({
        gridId: "grid",
        intent: { kind: "replace" },
        targetId: "missing",
      }),
    ).toMatchObject({
      error: { code: "TRANSACTION_FAILURE" },
      ok: false,
    });
    expect(controller.getSnapshot().revision).toBe(0);
  });
});
