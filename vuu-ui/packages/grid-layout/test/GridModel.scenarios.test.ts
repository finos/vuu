import { describe, expect, it } from "vitest";
import { GridLayoutModel } from "../src/GridLayoutModel";
import { GridModel } from "../src/GridModel";
import {
  descriptor,
  expectedItem,
  item,
  type LayoutScenario,
  runScenario,
} from "./model-scenario-harness";

const oneTrack = ["1fr"] as const;
const twoTracks = ["1fr", "1fr"] as const;

const scenarios: LayoutScenario[] = [
  {
    name: "empty grid is represented by a placeholder",
    initial: descriptor([...oneTrack], [...oneTrack]),
    operations: [{ type: "regenerate-placeholders" }],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [
        expectedItem("placeholder-1", "1/1/2/2", {
          resizeable: "hv",
          type: "placeholder",
        }),
      ],
      tabs: [],
    },
  },
  {
    name: "one item retains model metadata",
    initial: descriptor([...oneTrack], [...oneTrack], {
      main: item("1/1/2/2", {
        dropTarget: true,
        header: true,
        resizeable: "hv",
        title: "Main",
      }),
    }),
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [
        expectedItem("main", "1/1/2/2", {
          dropTarget: true,
          header: true,
          resizeable: "hv",
          title: "Main",
        }),
      ],
      tabs: [],
    },
  },
  ...(["east", "west", "north", "south"] as const).map(
    (direction): LayoutScenario => ({
      name: `single-cell split ${direction}`,
      initial: descriptor([...oneTrack], [...oneTrack], {
        target: item("1/1/2/2", { resizeable: "hv" }),
      }),
      operations: [
        { type: "add", id: "dropped" },
        { type: "split", direction, dropped: "dropped", target: "target" },
      ],
      expected: {
        cols:
          direction === "east" || direction === "west"
            ? [...twoTracks]
            : [...oneTrack],
        rows:
          direction === "north" || direction === "south"
            ? [...twoTracks]
            : [...oneTrack],
        items: [
          expectedItem(
            "dropped",
            direction === "east"
              ? "1/2/2/3"
              : direction === "west"
                ? "1/1/2/2"
                : direction === "north"
                  ? "1/1/2/2"
                  : "2/1/3/2",
          ),
          expectedItem(
            "target",
            direction === "east"
              ? "1/1/2/2"
              : direction === "west"
                ? "1/2/2/3"
                : direction === "north"
                  ? "2/1/3/2"
                  : "1/1/2/2",
            { resizeable: "hv" },
          ),
        ],
        tabs: [],
      },
    }),
  ),
  {
    name: "nested split pattern remains within one model",
    initial: descriptor([...oneTrack], [...oneTrack], {
      main: item("1/1/2/2", { resizeable: "hv" }),
    }),
    operations: [
      { type: "add", id: "right" },
      { type: "split", direction: "east", dropped: "right", target: "main" },
      { type: "add", id: "bottom-left" },
      {
        type: "split",
        direction: "south",
        dropped: "bottom-left",
        target: "main",
      },
    ],
    expected: {
      cols: [...twoTracks],
      rows: [...twoTracks],
      items: [
        expectedItem("bottom-left", "2/1/3/2"),
        expectedItem("main", "1/1/2/2", { resizeable: "hv" }),
        expectedItem("right", "1/2/3/3"),
      ],
      tabs: [],
    },
  },
  {
    name: "row and column spans are preserved",
    initial: descriptor([...twoTracks], [...twoTracks], {
      header: item("1/1/2/3", { resizeable: "h" }),
      left: item("2/1/3/2", { resizeable: false }),
      right: item("2/2/3/3", { resizeable: "v" }),
    }),
    expected: {
      cols: [...twoTracks],
      rows: [...twoTracks],
      items: [
        expectedItem("header", "1/1/2/3", { resizeable: "h" }),
        expectedItem("left", "2/1/3/2"),
        expectedItem("right", "2/2/3/3", { resizeable: "v" }),
      ],
      tabs: [],
    },
  },
  {
    name: "centre replacement adopts target position",
    initial: descriptor([...oneTrack], [...oneTrack], {
      target: item("1/1/2/2"),
    }),
    operations: [
      { type: "add", id: "source" },
      { type: "replace", dropped: "source", target: "target" },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [expectedItem("source", "1/1/2/2")],
      tabs: [],
    },
  },
  {
    name: "removal expands its neighbour and removes the unused track",
    initial: descriptor([...twoTracks], [...oneTrack], {
      left: item("1/1/2/2"),
      right: item("1/2/2/3"),
    }),
    operations: [{ type: "remove", item: "right" }],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [expectedItem("left", "1/1/2/2")],
      tabs: [],
    },
  },
  {
    name: "removal normalizes multiple unused column lines",
    initial: descriptor(["1fr", "1fr", "1fr"], [...oneTrack], {
      left: item("1/1/2/2"),
      wide: item("1/2/2/4"),
    }),
    operations: [{ type: "remove", item: "wide" }],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [expectedItem("left", "1/1/2/2")],
      tabs: [],
    },
  },
  {
    name: "removal normalizes multiple unused row lines",
    initial: descriptor([...oneTrack], ["1fr", "1fr", "1fr"], {
      top: item("1/1/2/2"),
      tall: item("2/1/4/2"),
    }),
    operations: [{ type: "remove", item: "tall" }],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [expectedItem("top", "1/1/2/2")],
      tabs: [],
    },
  },
  {
    name: "multi-track fractional span splits without DOM measurement",
    initial: descriptor(["1fr", "2fr", "1fr"], [...oneTrack], {
      target: item("1/1/2/4", { resizeable: "h" }),
    }),
    operations: [
      { type: "add", id: "dropped" },
      {
        type: "split",
        direction: "east",
        dropped: "dropped",
        target: "target",
      },
    ],
    expected: {
      cols: ["1fr", "1fr", "1fr", "1fr"],
      rows: [...oneTrack],
      items: [
        expectedItem("dropped", "1/3/2/5"),
        expectedItem("target", "1/1/2/3", { resizeable: "h" }),
      ],
      tabs: [],
    },
  },
  {
    name: "row and column track resize preserve item geometry",
    initial: descriptor(["100px", "200px"], ["50px", "150px"], {
      fixed: item("1/1/3/2", { resizeable: false }),
      upper: item("1/2/2/3", { resizeable: "hv" }),
      lower: item("2/2/3/3", { resizeable: "v" }),
    }),
    operations: [
      { type: "resize-track", trackType: "column", index: 0, size: "125px" },
      { type: "resize-track", trackType: "row", index: 1, size: "175px" },
    ],
    expected: {
      cols: ["125px", "200px"],
      rows: ["50px", "175px"],
      items: [
        expectedItem("fixed", "1/1/3/2"),
        expectedItem("lower", "2/2/3/3", { resizeable: "v" }),
        expectedItem("upper", "1/2/2/3", { resizeable: "hv" }),
      ],
      tabs: [],
    },
  },
  {
    name: "tab stack supports selection and ordering",
    initial: descriptor([...oneTrack], [...oneTrack], {
      alpha: item("1/1/2/2", { title: "Alpha" }),
      beta: item("1/1/2/2", { title: "Beta" }),
    }),
    operations: [
      { type: "stack", target: "alpha", item: "beta" },
      { type: "select-tab", stack: { type: "stack" }, tab: "beta" },
      {
        type: "move-tab",
        stack: { type: "stack" },
        tab: "beta",
        target: "alpha",
        position: "before",
        activate: true,
      },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [
        expectedItem("alpha", "1/1/2/2", {
          contentVisible: false,
          stackId: "stack-1",
          title: "Alpha",
        }),
        expectedItem("beta", "1/1/2/2", {
          stackId: "stack-1",
          title: "Beta",
        }),
        expectedItem("stack-1", "1/1/2/2", {
          contentVisible: true,
          type: "stacked-content",
        }),
      ],
      tabs: [{ active: "beta", id: "stack-1", tabs: ["beta", "alpha"] }],
    },
  },
  {
    name: "removing one tab collapses a two-item stack",
    initial: descriptor([...oneTrack], [...oneTrack], {
      alpha: item("1/1/2/2", { title: "Alpha" }),
      beta: item("1/1/2/2", { title: "Beta" }),
    }),
    operations: [
      { type: "stack", target: "alpha", item: "beta" },
      { type: "remove", item: "beta" },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [
        expectedItem("alpha", "1/1/2/2", {
          title: "Alpha",
        }),
      ],
      tabs: [],
    },
  },
  {
    name: "placeholder can be split by a dropped item",
    initial: descriptor([...oneTrack], [...oneTrack]),
    operations: [
      { type: "regenerate-placeholders" },
      { type: "add", id: "content" },
      {
        type: "split",
        direction: "east",
        dropped: "content",
        target: { type: "placeholder" },
      },
    ],
    expected: {
      cols: [...twoTracks],
      rows: [...oneTrack],
      items: [
        expectedItem("content", "1/2/2/3"),
        expectedItem("placeholder-1", "1/1/2/2", {
          resizeable: "hv",
          type: "placeholder",
        }),
      ],
      tabs: [],
    },
  },
  {
    name: "descriptor serialization round trip is stable",
    initial: descriptor([...twoTracks], [...twoTracks], {
      wide: item("1/1/2/3", { resizeable: "h", title: "Wide" }),
      lowerLeft: item("2/1/3/2"),
      lowerRight: item("2/2/3/3"),
    }),
    operations: [{ type: "round-trip" }],
    expected: {
      cols: [...twoTracks],
      rows: [...twoTracks],
      items: [
        expectedItem("lowerLeft", "2/1/3/2"),
        expectedItem("lowerRight", "2/2/3/3"),
        expectedItem("wide", "1/1/2/3", {
          resizeable: "h",
          title: "Wide",
        }),
      ],
      tabs: [],
    },
  },
  {
    name: "multi-operation split replace remove and placeholder sequence",
    initial: descriptor([...oneTrack], [...oneTrack], {
      first: item("1/1/2/2"),
    }),
    operations: [
      { type: "add", id: "second" },
      { type: "split", direction: "east", dropped: "second", target: "first" },
      { type: "add", id: "replacement" },
      { type: "replace", dropped: "replacement", target: "second" },
      { type: "remove", item: "first" },
      { type: "regenerate-placeholders" },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [expectedItem("replacement", "1/1/2/2")],
      tabs: [],
    },
  },
  {
    name: "unsafe model-only operation reports its current error",
    initial: descriptor([...oneTrack], [...oneTrack], {
      only: item("1/1/2/2"),
    }),
    operations: [
      {
        operation: { type: "remove", item: "missing" },
        message: "[GridModel] GridItem #missing not found",
      },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [expectedItem("only", "1/1/2/2")],
      tabs: [],
    },
  },
];

describe("GridModel declarative layout scenarios", () => {
  it.each(scenarios)("$name", (scenario) => {
    runScenario(scenario);
  });

  it("rejects every axis-incompatible split path without changing geometry", () => {
    const model = new GridModel(
      "non-resizable-splits",
      descriptor([...twoTracks], [...twoTracks], {
        source: item("1/1/3/2", { resizeable: "hv" }),
        target: item("1/2/3/3", { resizeable: false }),
      }),
    );
    const layoutModel = new GridLayoutModel(model);
    const before = model.toGridLayoutDescriptor();

    for (const direction of ["north", "south", "east", "west"] as const) {
      expect(layoutModel.dropSplitGridItem("source", "target", direction)).toBe(
        false,
      );
      expect(model.toGridLayoutDescriptor()).toEqual(before);
    }
  });

  it("inherits split constraints when items become a tab stack", () => {
    const model = new GridModel(
      "stack-constraints",
      descriptor([...oneTrack], [...oneTrack], {
        alpha: item("1/1/2/2", { resizeable: false }),
        beta: item("1/1/2/2", { resizeable: "hv" }),
      }),
    );
    model.stackChildItems("alpha", "beta");
    const stack = model.childItems.find(
      ({ type }) => type === "stacked-content",
    );
    expect(stack?.resizeable).toBe(false);
    expect(
      new GridLayoutModel(model).canSplitGridItem(stack?.id ?? "", "east"),
    ).toBe(false);
  });

  it("creates one shared splitter when only one track item opts into resizing", () => {
    const model = new GridModel(
      "shared-splitter",
      descriptor(["200px", "400px"], ["100px", "200px"], {
        nav: item("1/1/3/2", { resizeable: "hv" }),
        toolbar: item("1/2/2/3", { resizeable: "h" }),
        content: item("2/2/3/3", { resizeable: false }),
      }),
    );

    const [splitter] = model.getSplitters();
    expect(splitter).toMatchObject({
      ariaOrientation: "vertical",
      resizedChildItems: {
        before: ["nav"],
        after: ["toolbar", "content"],
      },
    });
    expect(model.getSplitters()).toHaveLength(1);
  });

  it("resizes track groups proportionally and redistributes at minimums", () => {
    const model = new GridModel(
      "proportional-row-resize",
      descriptor(["1fr"], ["100px", "100px", "200px"], {
        header: item("1/1/2/2"),
        middle: item("2/1/3/2"),
        bottom: item("3/1/4/2"),
      }),
    );

    model.tracks.resizeGroupsProportionally(
      "row",
      [0],
      [1, 2],
      -120,
      [{ minimum: 80, trackIndices: [0] }],
      [
        { minimum: 80, trackIndices: [1] },
        { minimum: 80, trackIndices: [2] },
      ],
      [100, 100, 200],
    );

    expect(model.toGridLayoutDescriptor().rows).toEqual([
      "220px",
      "80px",
      "100px",
    ]);

    model.tracks.resizeGroupsProportionally(
      "row",
      [0],
      [1, 2],
      0,
      [{ minimum: 80, trackIndices: [0] }],
      [
        { minimum: 80, trackIndices: [1] },
        { minimum: 80, trackIndices: [2] },
      ],
      [100, 100, 200],
    );
    expect(model.toGridLayoutDescriptor().rows).toEqual([
      "100px",
      "100px",
      "200px",
    ]);
  });

  it("honors aggregate spanning minimums without over-constraining tracks", () => {
    const model = new GridModel(
      "proportional-spanning-minimum",
      descriptor(["1fr"], ["100px", "100px", "100px"]),
    );

    model.tracks.resizeGroupsProportionally(
      "row",
      [0],
      [1, 2],
      -40,
      [],
      [
        { minimum: 90, trackIndices: [1] },
        { minimum: 160, trackIndices: [1, 2] },
      ],
    );

    expect(model.toGridLayoutDescriptor().rows).toEqual([
      "140px",
      "90px",
      "70px",
    ]);
  });

  it("distributes expansion evenly across a zero-sized track group", () => {
    const model = new GridModel(
      "proportional-zero-sized-group",
      descriptor(["1fr"], ["100px", "0px", "0px"]),
    );

    model.tracks.resizeGroupsProportionally("row", [0], [1, 2], 20);

    expect(model.toGridLayoutDescriptor().rows).toEqual([
      "80px",
      "10px",
      "10px",
    ]);
  });

  it("redistributes through overlapping aggregate minimums", () => {
    const model = new GridModel(
      "proportional-overlapping-minimums",
      descriptor(["1fr"], ["100px", "100px", "100px", "100px"]),
    );

    model.tracks.resizeGroupsProportionally(
      "row",
      [0],
      [1, 2, 3],
      -100,
      [],
      [
        { minimum: 150, trackIndices: [1, 2] },
        { minimum: 150, trackIndices: [2, 3] },
      ],
    );

    expect(model.toGridLayoutDescriptor().rows).toEqual([
      "200px",
      "50px",
      "100px",
      "50px",
    ]);
  });

  it.todo(
    "treats nested GridLayout component content as opaque because GridModel only owns one grid",
  );

  it.todo(
    "does not restore runtime tab state from descriptors because stacked-content wrappers are intentionally not serialized",
  );
});
