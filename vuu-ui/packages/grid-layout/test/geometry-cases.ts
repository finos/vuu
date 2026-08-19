import {
  LegacyGridCommandExecutor,
  type GridCommand,
  type GridCommandResult,
} from "../src/GridCommand";
import { GridLayoutModel } from "../src/GridLayoutModel";
import type { GridLayoutDescriptor } from "../src/GridModel";
import { GridModel } from "../src/GridModel";
import {
  descriptor,
  item,
  normalizeModel,
  normalizeSplitters,
  type NormalizedLayoutState,
  type NormalizedSplitter,
} from "./model-scenario-harness";

/**
 * A geometry step resolves its command lazily, so that generated ids
 * (placeholders, stacks) can be referenced.
 */
export type GeometryStep = (model: GridModel) => GridCommand;

export type GeometryCase = {
  initial: GridLayoutDescriptor;
  name: string;
  /** exercises APIs that are driven by the runtime rather than by commands */
  runtime?: (model: GridModel, layoutModel: GridLayoutModel) => void;
  steps: readonly GeometryStep[];
};

export type GeometryCaseCapture = {
  name: string;
  results: readonly GridCommandResult[];
  splitters: readonly NormalizedSplitter[];
  state: NormalizedLayoutState;
};

const command =
  (value: GridCommand): GeometryStep =>
  () =>
    value;

const addItem = (id: string, gridArea = "1/1/2/2"): GeometryStep => {
  const [rowStart, columnStart, rowEnd, columnEnd] = gridArea
    .split("/")
    .map(Number);
  return command({
    item: {
      column: { span: columnEnd - columnStart, start: columnStart },
      id,
      row: { span: rowEnd - rowStart, start: rowStart },
    },
    type: "add-item",
  });
};

const firstOfType =
  (type: "placeholder" | "stacked-content") => (model: GridModel) => {
    const match = model.childItems.find((child) => child.type === type);
    if (!match) {
      throw Error(`[geometry-cases] no ${type} found`);
    }
    return match.id;
  };

const splitDirections = ["north", "east", "south", "west"] as const;

export const geometryCases: readonly GeometryCase[] = [
  ...splitDirections.map(
    (position): GeometryCase => ({
      initial: descriptor(["1fr"], ["1fr"], {
        target: item("1/1/2/2", { resizeable: "hv" }),
      }),
      name: `single cell split ${position}`,
      steps: [
        addItem("dropped"),
        command({
          itemId: "dropped",
          position,
          targetId: "target",
          type: "move-item",
        }),
      ],
    }),
  ),
  ...splitDirections.map(
    (position): GeometryCase => ({
      initial: descriptor(["1fr", "1fr"], ["1fr", "1fr"], {
        target: item("1/1/3/3", { resizeable: "hv" }),
      }),
      name: `bisecting span split ${position}`,
      steps: [
        addItem("dropped"),
        command({
          itemId: "dropped",
          position,
          targetId: "target",
          type: "move-item",
        }),
      ],
    }),
  ),
  {
    initial: descriptor(["1fr", "2fr", "1fr"], ["1fr"], {
      target: item("1/1/2/4", { resizeable: "hv" }),
    }),
    name: "non bisecting fractional span split east",
    steps: [
      addItem("dropped"),
      command({
        itemId: "dropped",
        position: "east",
        targetId: "target",
        type: "move-item",
      }),
    ],
  },
  {
    initial: descriptor(["100px", "300px"], ["1fr"], {
      target: item("1/1/2/3", { resizeable: "hv" }),
    }),
    name: "non bisecting pixel span split west",
    steps: [
      addItem("dropped"),
      command({
        itemId: "dropped",
        position: "west",
        targetId: "target",
        type: "move-item",
      }),
    ],
  },
  {
    initial: descriptor(["1fr"], ["100px", "300px"], {
      target: item("1/1/3/2", { resizeable: "hv" }),
    }),
    name: "non bisecting pixel span split south",
    steps: [
      addItem("dropped"),
      command({
        itemId: "dropped",
        position: "south",
        targetId: "target",
        type: "move-item",
      }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr", "1fr"], {
      left: item("1/1/3/2", { resizeable: "hv" }),
      lowerRight: item("2/2/3/3", { resizeable: "hv" }),
      upperRight: item("1/2/2/3", { resizeable: "hv" }),
    }),
    name: "split within a column of stacked siblings",
    steps: [
      addItem("dropped"),
      command({
        itemId: "dropped",
        position: "south",
        targetId: "upperRight",
        type: "move-item",
      }),
    ],
  },
  {
    initial: descriptor(["1fr"], ["1fr"], {
      target: item("1/1/2/2", { resizeable: "hv", title: "Target" }),
    }),
    name: "centre replacement adopts target geometry",
    steps: [
      addItem("dropped"),
      command({
        itemId: "dropped",
        targetId: "target",
        type: "replace-item",
      }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr", "1fr"], ["1fr"], {
      left: item("1/1/2/2", { resizeable: "hv" }),
      wide: item("1/2/2/4", { resizeable: "hv" }),
    }),
    name: "removal normalizes multiple unused column lines",
    steps: [command({ itemId: "wide", reason: "close", type: "remove-item" })],
  },
  {
    initial: descriptor(["1fr"], ["1fr", "1fr", "1fr"], {
      tall: item("2/1/4/2", { resizeable: "hv" }),
      top: item("1/1/2/2", { resizeable: "hv" }),
    }),
    name: "removal normalizes multiple unused row lines",
    steps: [command({ itemId: "tall", reason: "close", type: "remove-item" })],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr", "1fr"], {
      lowerLeft: item("2/1/3/2", { resizeable: "hv" }),
      right: item("1/2/3/3", { resizeable: "hv" }),
      upperLeft: item("1/1/2/2", { resizeable: "hv" }),
    }),
    name: "irregular removal fills from column contras",
    steps: [command({ itemId: "right", reason: "close", type: "remove-item" })],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr", "1fr"], {
      bottom: item("2/1/3/3", { resizeable: "hv" }),
      upperLeft: item("1/1/2/2", { resizeable: "hv" }),
      upperRight: item("1/2/2/3", { resizeable: "hv" }),
    }),
    name: "irregular removal fills a row from two contras",
    steps: [
      command({ itemId: "bottom", reason: "close", type: "remove-item" }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr", "1fr"], {
      left: item("1/1/3/2", { resizeable: "hv" }),
      lowerRight: item("2/2/3/3", { resizeable: "hv" }),
      upperRight: item("1/2/2/3", { resizeable: "hv" }),
    }),
    name: "removal leaves a placeholder when no contra can fill",
    steps: [command({ itemId: "left", reason: "close", type: "remove-item" })],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr"], {
      left: item("1/1/2/2", { resizeable: "hv" }),
      right: item("1/2/2/3", { resizeable: "hv" }),
    }),
    name: "drag removal preserves tracks and regenerates placeholders",
    steps: [
      command({ itemId: "right", reason: "drag", type: "remove-item" }),
      command({ type: "regenerate-placeholders" }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr", "1fr"], {
      only: item("1/1/2/2", { resizeable: "hv" }),
    }),
    name: "placeholder regeneration covers the empty extents",
    steps: [
      command({ type: "regenerate-placeholders" }),
      command({ type: "regenerate-placeholders" }),
    ],
  },
  {
    initial: descriptor(["1fr"], ["1fr"]),
    name: "placeholder can be split by a dropped item",
    steps: [
      command({ type: "regenerate-placeholders" }),
      addItem("content"),
      (model) => ({
        itemId: "content",
        position: "east",
        targetId: firstOfType("placeholder")(model),
        type: "move-item",
      }),
    ],
  },
  {
    initial: descriptor(["1fr"], ["1fr"], {
      fixed: item("1/1/2/2", { resizeable: false }),
    }),
    name: "non resizable target rejects every split direction",
    steps: [
      addItem("dropped"),
      ...splitDirections.map((position) =>
        command({
          itemId: "dropped",
          position,
          targetId: "fixed",
          type: "move-item",
        }),
      ),
    ],
  },
  {
    initial: descriptor(["1fr"], ["1fr"], {
      horizontalOnly: item("1/1/2/2", { resizeable: "h" }),
    }),
    name: "horizontally resizable target rejects vertical splits",
    steps: [
      addItem("dropped"),
      command({
        itemId: "dropped",
        position: "north",
        targetId: "horizontalOnly",
        type: "move-item",
      }),
      command({
        itemId: "dropped",
        position: "east",
        targetId: "horizontalOnly",
        type: "move-item",
      }),
    ],
  },
  {
    initial: descriptor(["100px", "200px"], ["50px", "150px"], {
      fixed: item("1/1/3/2", { resizeable: false }),
      lower: item("2/2/3/3", { resizeable: "v" }),
      upper: item("1/2/2/3", { resizeable: "hv" }),
    }),
    name: "direct track resize preserves item geometry",
    steps: [
      command({
        index: 0,
        size: "125px",
        track: "column",
        type: "resize-track",
      }),
      command({ index: 1, size: "175px", track: "row", type: "resize-track" }),
      command({
        index: 2,
        size: "10px",
        track: "column",
        type: "resize-track",
      }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr"]),
    name: "fractional adjacent resize requires measurement",
    steps: [
      command({
        contraTrackIndex: 1,
        delta: 10,
        distribution: "adjacent",
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
      command({
        contraTrackIndex: 1,
        delta: 10,
        distribution: "adjacent",
        measuredSizes: [100, 100],
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
      command({
        contraTrackIndex: 1,
        delta: -35,
        distribution: "adjacent",
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
      command({
        contraTrackIndex: 1,
        delta: 1000,
        distribution: "adjacent",
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
    ],
  },
  {
    initial: descriptor(["1fr"], ["100px", "100px", "200px"]),
    name: "proportional resize honours explicit minimums",
    steps: [
      command({
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
    ],
  },
  {
    initial: descriptor(["1fr"], ["100px", "100px", "100px", "100px"]),
    name: "proportional resize redistributes overlapping minimums",
    steps: [
      command({
        afterConstraints: [
          { minimum: 150, trackIndices: [1, 2] },
          { minimum: 150, trackIndices: [2, 3] },
        ],
        afterTrackIndices: [1, 2, 3],
        beforeTrackIndices: [0],
        delta: -100,
        distribution: "proportional",
        track: "row",
        type: "resize-tracks",
      }),
    ],
  },
  {
    initial: descriptor(["1fr"], ["120px", "120px", "120px"]),
    name: "proportional resize without constraints distributes by size",
    steps: [
      command({
        afterTrackIndices: [1, 2],
        beforeTrackIndices: [0],
        delta: 30,
        distribution: "proportional",
        track: "row",
        type: "resize-tracks",
      }),
      command({
        afterTrackIndices: [2],
        beforeTrackIndices: [0, 1],
        delta: -45,
        distribution: "proportional",
        track: "row",
        type: "resize-tracks",
      }),
    ],
  },
  {
    initial: descriptor(["100px", "100px"], ["100px"]),
    name: "invalid resize commands are rejected without mutation",
    steps: [
      command({
        contraTrackIndex: 0,
        delta: 10,
        distribution: "adjacent",
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
      command({
        afterTrackIndices: [1],
        beforeTrackIndices: [1],
        delta: 10,
        distribution: "proportional",
        track: "column",
        type: "resize-tracks",
      }),
      command({
        afterConstraints: [{ minimum: -1, trackIndices: [1] }],
        afterTrackIndices: [1],
        beforeTrackIndices: [0],
        delta: 10,
        distribution: "proportional",
        track: "column",
        type: "resize-tracks",
      }),
      command({
        contraTrackIndex: 1,
        delta: Number.NaN,
        distribution: "adjacent",
        resizedTrackIndex: 0,
        track: "column",
        type: "resize-tracks",
      }),
      command({
        index: 7,
        size: "10px",
        track: "row",
        type: "resize-track",
      }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr", "1fr"], ["1fr", "1fr"], {
      lowerLeft: item("2/1/3/2", { resizeable: "hv" }),
      lowerMiddle: item("2/2/3/3", { resizeable: "hv" }),
      lowerRight: item("2/3/3/4", { resizeable: "hv" }),
      upperLeft: item("1/1/2/3", { resizeable: "hv" }),
      upperRight: item("1/3/2/4", { resizeable: "hv" }),
    }),
    name: "splitter intersections across shared track edges",
    steps: [],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr", "1fr"], {
      fixedRow: item("1/1/2/3", { resizeable: "h" }),
      lower: item("2/1/3/3", { resizeable: "hv" }),
    }),
    name: "splitters skip fixed height items",
    steps: [],
  },
  {
    initial: descriptor(["1fr"], ["1fr"], {
      first: item("1/1/2/2", { resizeable: "hv" }),
    }),
    name: "split replace remove and placeholder sequence",
    steps: [
      addItem("second"),
      command({
        itemId: "second",
        position: "east",
        targetId: "first",
        type: "move-item",
      }),
      addItem("replacement"),
      command({
        itemId: "replacement",
        targetId: "second",
        type: "replace-item",
      }),
      command({ itemId: "first", reason: "close", type: "remove-item" }),
      command({ type: "regenerate-placeholders" }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr"], {
      left: item("1/1/2/2", { resizeable: "hv", title: "Left" }),
      right: item("1/2/2/3", { resizeable: "hv", title: "Right" }),
    }),
    name: "no op and failing commands leave geometry untouched",
    steps: [
      command({ itemId: "left", title: "Left", type: "rename-item" }),
      command({ itemId: "missing", reason: "close", type: "remove-item" }),
      command({
        itemId: "left",
        position: "east",
        targetId: "left",
        type: "move-item",
      }),
      command({
        item: {
          column: { span: 1, start: 4 },
          id: "outOfBounds",
          row: { span: 1, start: 1 },
        },
        type: "add-item",
      }),
    ],
  },
  {
    initial: descriptor(["1fr"], ["1fr"], {
      alpha: item("1/1/2/2", { resizeable: "hv", title: "Alpha" }),
      beta: item("1/1/2/2", { resizeable: "hv", title: "Beta" }),
    }),
    name: "stack member removal restores single item geometry",
    steps: [
      command({ itemId: "beta", targetId: "alpha", type: "create-stack" }),
      (model) => ({
        itemId: "beta",
        stackId: firstOfType("stacked-content")(model),
        type: "remove-stack-item",
      }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr", "1fr"], ["1fr", "1fr", "1fr"], {
      centre: item("2/2/3/3", { resizeable: "hv" }),
      east: item("1/3/3/4", { resizeable: "hv" }),
      north: item("1/1/2/3", { resizeable: "hv" }),
      south: item("3/2/4/4", { resizeable: "hv" }),
      west: item("2/1/4/2", { resizeable: "hv" }),
    }),
    name: "pinwheel centre removal leaves a placeholder",
    steps: [
      command({ itemId: "centre", reason: "close", type: "remove-item" }),
    ],
  },
  {
    initial: descriptor(["1fr", "1fr"], ["1fr"], {
      alpha: item("1/1/2/3", { resizeable: "hv", title: "Alpha" }),
      beta: item("1/1/2/3", { resizeable: "hv", title: "Beta" }),
    }),
    name: "replacing a stack container unstacks its members",
    steps: [
      command({ itemId: "beta", targetId: "alpha", type: "create-stack" }),
      addItem("gamma", "1/1/2/2"),
      (model) => ({
        itemId: "gamma",
        targetId: firstOfType("stacked-content")(model),
        type: "replace-item",
      }),
    ],
  },
  {
    initial: descriptor(["100px", "100px"], ["100px"], {
      left: item("1/1/2/2", { resizeable: "hv" }),
      right: item("1/2/2/3", { resizeable: "hv" }),
    }),
    name: "runtime track insertion anchors the resized items",
    runtime: (model, layoutModel) => {
      const [splitter] = layoutModel.createSplitters();
      layoutModel.addTrackForResize(
        "column",
        20,
        "expand",
        splitter.resizedGridTracks[1],
        {
          maxMousePos: 0,
          minMousePos: 0,
          mousePos: 0,
          resizeTrackIsShared: true,
          splitter,
        },
      );
    },
    steps: [],
  },
  {
    initial: descriptor(["100px", "50px", "100px"], ["100px"], {
      left: item("1/1/2/2", { resizeable: "hv" }),
      middle: item("1/2/2/3", { resizeable: "hv" }),
      right: item("1/3/2/4", { resizeable: "hv" }),
    }),
    name: "runtime track removal rebinds following items",
    runtime: (model) => {
      model.removeGridTrack("column", 1, "bwd");
    },
    steps: [],
  },
];

export const captureGeometryCase = (
  geometryCase: GeometryCase,
): GeometryCaseCapture => {
  const model = new GridModel(
    `geometry-${geometryCase.name}`,
    structuredClone(geometryCase.initial),
  );
  const layoutModel = new GridLayoutModel(model);
  const executor = new LegacyGridCommandExecutor(model, layoutModel);
  const results = geometryCase.steps.map((step) =>
    executor.execute(step(model)),
  );
  geometryCase.runtime?.(model, layoutModel);
  return {
    name: geometryCase.name,
    results,
    splitters: normalizeSplitters(model),
    state: normalizeModel(model),
  };
};
