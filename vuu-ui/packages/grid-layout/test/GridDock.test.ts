import { describe, expect, it } from "vitest";
import {
  dockGridItem,
  GRID_DOCK_MIN_SIZE,
  trackMetrics,
  type GridGeometry,
  type GridGeometryItem,
  type GridGeometryResult,
} from "../src/GridGeometry";
import { GridController } from "../src/GridController";
import { createGridDropPlan } from "../src/GridDragCoordinator";
import { GridModel } from "../src/GridModel";
import type { GridTrackSize } from "../src/GridSnapshot";
import { descriptor, item as modelItem } from "./model-scenario-harness";

const item = (
  id: string,
  gridArea: string,
  overrides: Partial<GridGeometryItem> = {},
): GridGeometryItem => {
  const [rowStart, colStart, rowEnd, colEnd] = gridArea.split("/").map(Number);
  return {
    column: { end: colEnd, start: colStart },
    id,
    resizeable: "hv",
    row: { end: rowEnd, start: rowStart },
    type: "content",
    ...overrides,
  };
};

const geometry = (
  columns: GridTrackSize[],
  rows: GridTrackSize[],
  items: GridGeometryItem[],
): GridGeometry => ({ columns, items, rows });

const unwrap = <T>(result: GridGeometryResult<T>): T => {
  if (!result.ok) {
    throw Error(result.error.message);
  }
  return result.value;
};

const areaOf = (geometry: GridGeometry, id: string) => {
  const found = geometry.items.find((candidate) => candidate.id === id);
  return found
    ? `${found.row.start}/${found.column.start}/${found.row.end}/${found.column.end}`
    : undefined;
};

/** a and b side by side, c below them across both columns, d to dock */
const twoByTwo = () =>
  geometry(
    ["1fr", "1fr"],
    ["1fr", "1fr"],
    [
      item("a", "1/1/2/2"),
      item("b", "1/2/2/3"),
      item("c", "2/1/3/3"),
      item("d", "1/1/2/2", { dragging: true }),
    ],
  );

const measured = {
  column: trackMetrics([400, 400]),
  row: trackMetrics([300, 300]),
};

describe("dockGridItem", () => {
  it("docks west in a new first column spanning every row", () => {
    const { columns, geometry: next } = unwrap(
      dockGridItem(
        twoByTwo(),
        { edge: "west", itemId: "d", size: 200 },
        measured,
      ),
    );
    expect(next.columns).toEqual(["200px", "1fr", "1fr"]);
    expect(next.rows).toEqual(["1fr", "1fr"]);
    expect(columns?.sources).toEqual([-1, 0, 1]);
    expect(areaOf(next, "d")).toBe("1/1/3/2");
    expect(areaOf(next, "a")).toBe("1/2/2/3");
    expect(areaOf(next, "b")).toBe("1/3/2/4");
    expect(areaOf(next, "c")).toBe("2/2/3/4");
  });

  it("docks east in a new last column", () => {
    const { columns, geometry: next } = unwrap(
      dockGridItem(
        twoByTwo(),
        { edge: "east", itemId: "d", size: 200 },
        measured,
      ),
    );
    expect(next.columns).toEqual(["1fr", "1fr", "200px"]);
    expect(columns?.sources).toEqual([0, 1, -1]);
    expect(areaOf(next, "d")).toBe("1/3/3/4");
    expect(areaOf(next, "a")).toBe("1/1/2/2");
    expect(areaOf(next, "c")).toBe("2/1/3/3");
  });

  it("docks north and south in a new row spanning every column", () => {
    const north = unwrap(
      dockGridItem(
        twoByTwo(),
        { edge: "north", itemId: "d", size: 120 },
        measured,
      ),
    ).geometry;
    expect(north.rows).toEqual(["120px", "1fr", "1fr"]);
    expect(north.columns).toEqual(["1fr", "1fr"]);
    expect(areaOf(north, "d")).toBe("1/1/2/3");
    expect(areaOf(north, "a")).toBe("2/1/3/2");
    expect(areaOf(north, "c")).toBe("3/1/4/3");

    const south = unwrap(
      dockGridItem(
        twoByTwo(),
        { edge: "south", itemId: "d", size: 120 },
        measured,
      ),
    ).geometry;
    expect(south.rows).toEqual(["1fr", "1fr", "120px"]);
    expect(areaOf(south, "d")).toBe("3/1/4/3");
    expect(areaOf(south, "c")).toBe("2/1/3/3");
  });

  it("limits the docked size to half the flexible space and a minimum", () => {
    const large = unwrap(
      dockGridItem(
        twoByTwo(),
        { edge: "west", itemId: "d", size: 2000 },
        measured,
      ),
    ).geometry;
    expect(large.columns[0]).toBe("400px");

    const small = unwrap(
      dockGridItem(
        twoByTwo(),
        { edge: "west", itemId: "d", size: 10 },
        measured,
      ),
    ).geometry;
    expect(small.columns[0]).toBe(`${GRID_DOCK_MIN_SIZE}px`);
  });

  it("only takes space from fractional tracks when there are any", () => {
    const mixed = geometry(
      ["300px", "1fr"],
      ["1fr"],
      [item("a", "1/1/2/2"), item("b", "1/2/2/3"), item("d", "1/1/2/2")],
    );
    const { geometry: next } = unwrap(
      dockGridItem(
        mixed,
        { edge: "east", itemId: "d", size: 400 },
        { column: trackMetrics([300, 500]) },
      ),
    );
    expect(next.columns).toEqual(["300px", "1fr", "250px"]);
  });

  it("shrinks pixel tracks in proportion when there are no fractional tracks", () => {
    const fixed = geometry(
      ["300px", "500px"],
      ["1fr"],
      [item("a", "1/1/2/2"), item("b", "1/2/2/3"), item("d", "1/1/2/2")],
    );
    const { geometry: next } = unwrap(
      dockGridItem(fixed, { edge: "west", itemId: "d", size: 200 }),
    );
    expect(next.columns).toEqual(["200px", "225px", "375px"]);
  });

  it("needs fractional tracks measured", () => {
    const result = dockGridItem(twoByTwo(), {
      edge: "west",
      itemId: "d",
      size: 200,
    });
    expect(result).toMatchObject({
      error: { code: "MEASUREMENT_REQUIRED", trackType: "column" },
      ok: false,
    });
  });

  it("refuses when there is no room", () => {
    const narrow = geometry(
      ["60px"],
      ["1fr"],
      [item("a", "1/1/2/2"), item("d", "1/1/2/2")],
    );
    expect(
      dockGridItem(narrow, { edge: "west", itemId: "d", size: 200 }),
    ).toMatchObject({ error: { code: "NON_RESIZABLE" }, ok: false });
  });

  it("fails for an unknown item", () => {
    expect(
      dockGridItem(
        twoByTwo(),
        { edge: "west", itemId: "x", size: 200 },
        measured,
      ),
    ).toMatchObject({ error: { code: "ITEM_NOT_FOUND" }, ok: false });
  });

  it("moves the members of a docked stack with it", () => {
    const stacked = geometry(
      ["1fr", "1fr"],
      ["1fr"],
      [
        item("a", "1/1/2/2"),
        item("stack", "1/2/2/3", { type: "stacked-content" }),
        item("s1", "1/2/2/3", { stackId: "stack" }),
        item("s2", "1/2/2/3", { stackId: "stack" }),
      ],
    );
    const { geometry: next } = unwrap(
      dockGridItem(
        stacked,
        { edge: "north", itemId: "stack", size: 100 },
        { row: trackMetrics([600]) },
      ),
    );
    expect(areaOf(next, "stack")).toBe("1/1/2/3");
    expect(areaOf(next, "s1")).toBe("1/1/2/3");
    expect(areaOf(next, "s2")).toBe("1/1/2/3");
    expect(areaOf(next, "a")).toBe("2/1/3/2");
  });
});

describe("dock drop plan and command", () => {
  const controller = () =>
    new GridController(
      new GridModel(
        "grid",
        descriptor(["300px", "300px"], ["200px"], {
          left: modelItem("1/1/2/2", { title: "Left" }),
          right: modelItem("1/2/2/3", { title: "Right" }),
        }),
      ),
    );

  it("plans a dock of an existing item as a dock-item command", () => {
    const plan = createGridDropPlan(
      { itemId: "left", kind: "existing-item", sourceGridId: "grid" },
      {
        gridId: "grid",
        intent: { edge: "south", kind: "dock", size: 80 },
        targetId: "grid",
      },
    );
    expect("commands" in plan && plan.commands).toEqual([
      { edge: "south", itemId: "left", size: 80, type: "dock-item" },
      { type: "regenerate-placeholders" },
    ]);
  });

  it("adds a template before docking it", () => {
    const plan = createGridDropPlan(
      {
        item: {
          column: { span: 1, start: 1 },
          id: "new",
          row: { span: 1, start: 1 },
        },
        kind: "palette-template",
        templateId: "t",
      },
      {
        gridId: "grid",
        intent: { edge: "west", kind: "dock", size: 80 },
        targetId: "grid",
      },
    );
    expect("commands" in plan && plan.commands.map(({ type }) => type)).toEqual(
      ["add-item", "dock-item", "regenerate-placeholders"],
    );
  });

  it("refuses to dock a stack member", () => {
    expect(
      createGridDropPlan(
        {
          itemId: "a",
          kind: "stack-member",
          selected: true,
          sourceGridId: "grid",
          stackId: "stack",
        },
        {
          gridId: "grid",
          intent: { edge: "west", kind: "dock", size: 80 },
          targetId: "grid",
        },
      ),
    ).toMatchObject({ code: "UNSUPPORTED_DROP" });
  });

  it("docks through the controller", () => {
    const grid = controller();
    expect(
      grid.dispatch({
        edge: "north",
        itemId: "right",
        size: 60,
        type: "dock-item",
      }),
    ).toMatchObject({ ok: true });
    const snapshot = grid.getSnapshot();
    expect(snapshot.rows.map(({ size }) => size)).toEqual(["60px", "140px"]);
    expect(snapshot.items.find(({ id }) => id === "right")).toMatchObject({
      column: { span: 2, start: 1 },
      row: { span: 1, start: 1 },
    });
  });

  it("rejects an unknown item", () => {
    expect(
      controller().dispatch({
        edge: "north",
        itemId: "missing",
        size: 60,
        type: "dock-item",
      }),
    ).toMatchObject({ error: { code: "ITEM_NOT_FOUND" }, ok: false });
  });
});
