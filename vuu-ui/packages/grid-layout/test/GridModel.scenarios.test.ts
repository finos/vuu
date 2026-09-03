import { describe, expect, it } from "vitest";
import { GridLayoutModel } from "../src/GridLayoutModel";
import { GridModel } from "../src/GridModel";
import {
  gridLayoutDescriptorToSnapshot,
  gridSnapshotToGridLayoutDescriptor,
  normalizeGridSnapshot,
  validateGridSnapshot,
} from "../src/grid-snapshot-adapters";
import {
  GridSnapshotValidationError,
  type GridSnapshot,
} from "../src/GridSnapshot";
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
    name: "adding a tab keeps the selected item and stack placement",
    initial: descriptor([...oneTrack], [...oneTrack], {
      alpha: item("1/1/2/2", { title: "Alpha" }),
      beta: item("1/1/2/2", { title: "Beta" }),
    }),
    operations: [
      { type: "stack", target: "alpha", item: "beta" },
      {
        type: "add-tab",
        gridArea: "1/1/2/2",
        id: "gamma",
        stack: { type: "stack" },
        title: "Gamma",
      },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [
        expectedItem("alpha", "1/1/2/2", {
          stackId: "stack-1",
          title: "Alpha",
        }),
        expectedItem("beta", "1/1/2/2", {
          contentVisible: false,
          stackId: "stack-1",
          title: "Beta",
        }),
        expectedItem("gamma", "1/1/2/2", {
          contentVisible: false,
          stackId: "stack-1",
          title: "Gamma",
        }),
        expectedItem("stack-1", "1/1/2/2", {
          contentVisible: true,
          type: "stacked-content",
        }),
      ],
      tabs: [
        { active: "alpha", id: "stack-1", tabs: ["alpha", "beta", "gamma"] },
      ],
    },
  },
  {
    name: "removing an unselected tab leaves the selection untouched",
    initial: descriptor([...oneTrack], [...oneTrack], {
      alpha: item("1/1/2/2", { title: "Alpha" }),
      beta: item("1/1/2/2", { title: "Beta" }),
    }),
    operations: [
      { type: "stack", target: "alpha", item: "beta" },
      {
        type: "add-tab",
        id: "gamma",
        stack: { type: "stack" },
        title: "Gamma",
      },
      { type: "remove-tab", stack: { type: "stack" }, tab: "beta" },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [
        expectedItem("alpha", "1/1/2/2", {
          stackId: "stack-1",
          title: "Alpha",
        }),
        expectedItem("gamma", "1/1/2/2", {
          contentVisible: false,
          stackId: "stack-1",
          title: "Gamma",
        }),
        expectedItem("stack-1", "1/1/2/2", {
          contentVisible: true,
          type: "stacked-content",
        }),
      ],
      tabs: [{ active: "alpha", id: "stack-1", tabs: ["alpha", "gamma"] }],
    },
  },
  {
    name: "removing the selected tab falls back to the item that replaces it",
    initial: descriptor([...oneTrack], [...oneTrack], {
      alpha: item("1/1/2/2", { title: "Alpha" }),
      beta: item("1/1/2/2", { title: "Beta" }),
    }),
    operations: [
      { type: "stack", target: "alpha", item: "beta" },
      {
        type: "add-tab",
        id: "gamma",
        stack: { type: "stack" },
        title: "Gamma",
      },
      { type: "select-tab", stack: { type: "stack" }, tab: "beta" },
      { type: "remove-tab", stack: { type: "stack" }, tab: "beta" },
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
        expectedItem("gamma", "1/1/2/2", {
          stackId: "stack-1",
          title: "Gamma",
        }),
        expectedItem("stack-1", "1/1/2/2", {
          contentVisible: true,
          type: "stacked-content",
        }),
      ],
      tabs: [{ active: "gamma", id: "stack-1", tabs: ["alpha", "gamma"] }],
    },
  },
  {
    name: "duplicate tab titles keep stable identity through every operation",
    initial: descriptor([...oneTrack], [...oneTrack], {
      alpha: item("1/1/2/2", { title: "Same" }),
      beta: item("1/1/2/2", { title: "Same" }),
    }),
    operations: [
      { type: "stack", target: "alpha", item: "beta" },
      {
        type: "add-tab",
        id: "gamma",
        stack: { type: "stack" },
        title: "Same",
      },
      { type: "select-tab", stack: { type: "stack" }, tab: "beta" },
      {
        type: "move-tab",
        stack: { type: "stack" },
        tab: "gamma",
        target: "alpha",
        position: "before",
      },
      { type: "rename", item: "alpha", title: "Renamed" },
    ],
    expected: {
      cols: [...oneTrack],
      rows: [...oneTrack],
      items: [
        expectedItem("alpha", "1/1/2/2", {
          contentVisible: false,
          stackId: "stack-1",
          title: "Renamed",
        }),
        expectedItem("beta", "1/1/2/2", {
          stackId: "stack-1",
          title: "Same",
        }),
        expectedItem("gamma", "1/1/2/2", {
          contentVisible: false,
          stackId: "stack-1",
          title: "Same",
        }),
        expectedItem("stack-1", "1/1/2/2", {
          contentVisible: true,
          type: "stacked-content",
        }),
      ],
      tabs: [
        { active: "beta", id: "stack-1", tabs: ["gamma", "alpha", "beta"] },
      ],
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
      first: item("1/1/2/2", { resizeable: "hv" }),
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

  describe("canonical snapshots", () => {
    const expectStableDescriptor = (
      gridId: string,
      value: ReturnType<typeof descriptor>,
    ) => {
      const snapshot = gridLayoutDescriptorToSnapshot(value, { gridId });
      expect(gridSnapshotToGridLayoutDescriptor(snapshot)).toEqual(value);
    };

    it("round-trips simple grids, spans, resize metadata, stacks, and placeholders", () => {
      expectStableDescriptor(
        "simple",
        descriptor(["1fr", "240px"], ["80px", "1fr"], {
          header: item("1/1/2/3", {
            dropTarget: "workspace",
            header: true,
            minHeight: 48,
            minWidth: 120,
            resizeable: "h",
            title: "Header",
          }),
          left: item("2/1/3/2"),
          right: item("2/2/3/3", { resizeable: "hv" }),
        }),
      );
      expectStableDescriptor(
        "stack",
        descriptor(["1fr"], ["1fr"], {
          alpha: item("1/1/2/2", {
            contentVisible: false,
            stackId: "stack-1",
            title: "Alpha",
          }),
          beta: item("1/1/2/2", {
            contentVisible: true,
            stackId: "stack-1",
            title: "Beta",
          }),
        }),
      );
      expectStableDescriptor(
        "legacy-placeholder",
        descriptor(["1fr"], ["1fr"], {
          "generated-placeholder-id": item("1/1/2/2", {
            resizeable: "hv",
          }),
        }),
      );
      const withComponentId = descriptor(["1fr"], ["1fr"], {
        main: {
          ...item("1/1/2/2"),
          componentId: "component-1",
        },
      });
      const componentSnapshot = gridLayoutDescriptorToSnapshot(
        withComponentId,
        {
          gridId: "component-identity",
        },
      );
      expect(componentSnapshot.items[0].componentInstanceId).toBe(
        "component-1",
      );
      expect(gridSnapshotToGridLayoutDescriptor(componentSnapshot)).toEqual(
        withComponentId,
      );
    });

    it.each([
      {
        code: "DUPLICATE_ID",
        mutate: (snapshot: GridSnapshot): GridSnapshot => ({
          ...snapshot,
          items: [...snapshot.items, snapshot.items[0]],
        }),
      },
      {
        code: "INVALID_SPAN",
        mutate: (snapshot: GridSnapshot): GridSnapshot => ({
          ...snapshot,
          items: [
            {
              ...snapshot.items[0],
              column: { span: 0, start: 1 },
            },
          ],
        }),
      },
      {
        code: "INVALID_TRACK_REFERENCE",
        mutate: (snapshot: GridSnapshot): GridSnapshot => ({
          ...snapshot,
          items: [
            {
              ...snapshot.items[0],
              row: { span: 1, start: 2 },
            },
          ],
        }),
      },
      {
        code: "INVALID_STACK_MEMBERSHIP",
        mutate: (snapshot: GridSnapshot): GridSnapshot => ({
          ...snapshot,
          stacks: [
            {
              id: "stack",
              itemIds: ["main", "missing"],
              selectedItemId: "main",
            },
          ],
        }),
      },
      {
        code: "INVALID_STACK_SELECTION",
        mutate: (snapshot: GridSnapshot): GridSnapshot => ({
          ...snapshot,
          items: [
            snapshot.items[0],
            {
              ...snapshot.items[0],
              id: "secondary",
            },
          ],
          stacks: [
            {
              id: "stack",
              itemIds: ["main", "secondary"],
              selectedItemId: "missing",
            },
          ],
        }),
      },
      {
        code: "INVALID_STACK_POSITION",
        mutate: (snapshot: GridSnapshot): GridSnapshot => ({
          ...snapshot,
          items: [
            snapshot.items[0],
            {
              ...snapshot.items[0],
              column: { span: 1, start: 2 },
              id: "secondary",
            },
          ],
          columns: [{ size: "1fr" }, { size: "1fr" }],
          stacks: [
            {
              id: "stack",
              itemIds: ["main", "secondary"],
              selectedItemId: "main",
            },
          ],
        }),
      },
      {
        code: "MALFORMED_TRACK",
        mutate: (snapshot: GridSnapshot): GridSnapshot => ({
          ...snapshot,
          columns: [{ size: "auto" as "1fr" }],
        }),
      },
    ])("reports typed $code validation failures", ({ code, mutate }) => {
      const valid = gridLayoutDescriptorToSnapshot(
        descriptor(["1fr"], ["1fr"], { main: item("1/1/2/2") }),
        { gridId: "invalid-cases" },
      );
      const invalid = mutate(valid);
      expect(validateGridSnapshot(invalid)).toEqual(
        expect.arrayContaining([expect.objectContaining({ code })]),
      );
      try {
        normalizeGridSnapshot(invalid);
        expect.unreachable("expected snapshot validation to fail");
      } catch (error) {
        expect(error).toBeInstanceOf(GridSnapshotValidationError);
        expect((error as GridSnapshotValidationError).issues).toEqual(
          expect.arrayContaining([expect.objectContaining({ code })]),
        );
      }
    });

    it("reports malformed legacy grid areas as typed validation failures", () => {
      expect(() =>
        gridLayoutDescriptorToSnapshot(
          descriptor(["1fr"], ["1fr"], { main: item("not-a-grid-area") }),
          { gridId: "malformed-area" },
        ),
      ).toThrow(GridSnapshotValidationError);
    });

    it("returns structured issues for malformed persisted input", () => {
      expect(validateGridSnapshot({ revision: "latest" })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "EMPTY_ID" }),
          expect.objectContaining({ code: "INVALID_REVISION" }),
          expect.objectContaining({ code: "INVALID_STRUCTURE" }),
        ]),
      );
      const snapshot = gridLayoutDescriptorToSnapshot(
        descriptor(["1fr"], ["1fr"], { main: item("1/1/2/2") }),
        { gridId: "unexpected-field" },
      );
      expect(
        validateGridSnapshot({
          ...snapshot,
          items: [{ ...snapshot.items[0], minWidht: 100 }],
        }),
      ).toEqual([
        expect.objectContaining({
          code: "UNEXPECTED_FIELD",
          path: "items[0].minWidht",
        }),
      ]);
    });

    it("returns snapshots detached from later model and descriptor changes", () => {
      const initial = descriptor(["1fr"], ["1fr"], {
        main: item("1/1/2/2", { title: "Initial" }),
      });
      const model = new GridModel("detached", initial);
      const snapshot = gridLayoutDescriptorToSnapshot(
        model.toGridLayoutDescriptor(),
        { gridId: model.id, revision: 7 },
      );

      model.updateChildTitle("main", "Changed");
      initial.cols[0] = "200px";

      expect(snapshot).toMatchObject({
        columns: [{ size: "1fr" }],
        items: [{ title: "Initial" }],
        revision: 7,
      });
    });
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
