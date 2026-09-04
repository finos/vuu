import { describe, expect, it } from "vitest";
import {
  applyGeometryUpdates,
  bisectTracks,
  canSplitGridItem,
  computeSplitters,
  findBisectingTrack,
  findUnusedGridLines,
  getProportionalResizeAllowance,
  insertTrack,
  insertTrackForResize,
  readTracks,
  regeneratePlaceholders,
  removeGridItem,
  removeGridTrack,
  removeTrack,
  replaceGridItem,
  resizeTrackTo,
  resizeTracksAdjacent,
  resizeTracksProportionally,
  shiftItemsForInsertedTrack,
  shiftItemsForNewTrack,
  shiftItemsForRemovedTrack,
  splitGridItem,
  splitTrack,
  trackMetrics,
  trackSizes,
  type GridGeometry,
  type GridGeometryItem,
  type GridGeometryResult,
  type GridGeometrySplitDirection,
} from "../src/GridGeometry";
import type { GridTrackSize } from "../src/GridSnapshot";

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
  items: GridGeometryItem[] = [],
): GridGeometry => ({ columns, items, rows });

const tracksOf = (sizes: GridTrackSize[], measured?: number[]) =>
  readTracks(sizes, measured ? trackMetrics(measured) : undefined);

const unwrap = <T>(result: GridGeometryResult<T>): T => {
  if (!result.ok) {
    throw Error(`${result.error.code}: ${result.error.message}`);
  }
  return result.value;
};

const gridAreas = ({ items }: GridGeometry) =>
  items.map(
    ({ column, id, row }) =>
      `${id}@${row.start}/${column.start}/${row.end}/${column.end}`,
  );

let placeholderCount = 0;
const createPlaceholderId = () => `placeholder-${++placeholderCount}`;
const withPlaceholderIds = <T>(run: () => T): T => {
  placeholderCount = 0;
  return run();
};

describe("GridGeometry track transitions", () => {
  it("splits a fractional track by doubling every other fraction", () => {
    const transition = unwrap(
      splitTrack(tracksOf(["1fr", "2fr", "100px"]), 0, "column"),
    );

    expect(trackSizes(transition.tracks)).toEqual([
      "1fr",
      "1fr",
      "4fr",
      "100px",
    ]);
    expect(transition.sources).toEqual([-1, 0, 1, 2]);
  });

  it("splits a pixel track in half, rounding the new track down", () => {
    const transition = unwrap(splitTrack(tracksOf(["101px"]), 0, "column"));

    expect(trackSizes(transition.tracks)).toEqual(["50px", "51px"]);
    expect(transition.sources).toEqual([-1, 0]);
  });

  it("finds an existing bisecting grid line, or reports none", () => {
    expect(
      unwrap(findBisectingTrack(tracksOf(["1fr", "1fr"]), 1, 3, "column")),
    ).toBe(2);
    expect(
      unwrap(findBisectingTrack(tracksOf(["1fr", "2fr"]), 1, 3, "column")),
    ).toBe(-1);
    expect(
      unwrap(
        findBisectingTrack(tracksOf(["100px", "50px", "50px"]), 1, 4, "column"),
      ),
    ).toBe(2);
  });

  it("requires measurement before bisecting unmeasured fractional tracks", () => {
    const result = findBisectingTrack(
      tracksOf(["1fr", "100px"]),
      1,
      3,
      "column",
    );

    expect(result).toMatchObject({
      error: { code: "MEASUREMENT_REQUIRED", trackType: "column" },
      ok: false,
    });
  });

  it("bisects fractional and measured pixel track ranges", () => {
    const fractional = unwrap(
      bisectTracks(tracksOf(["1fr", "2fr", "1fr"]), 1, 4, "column"),
    );
    expect(trackSizes(fractional.transition.tracks)).toEqual([
      "1fr",
      "1fr",
      "1fr",
      "1fr",
    ]);
    expect(fractional.newTrackIndex).toBe(1);

    const pixels = unwrap(
      bisectTracks(tracksOf(["100px", "300px"]), 1, 3, "column"),
    );
    expect(trackSizes(pixels.transition.tracks)).toEqual([
      "100px",
      "100px",
      "200px",
    ]);
    expect(pixels.newTrackIndex).toBe(1);
  });

  it("inserts a track, reducing the track it displaces", () => {
    expect(
      trackSizes(
        unwrap(
          insertTrack(
            tracksOf(["100px", "100px"]),
            { index: 1, position: "before" },
            25,
            "column",
          ),
        )?.tracks ?? [],
      ),
    ).toEqual(["75px", "25px", "100px"]);

    expect(
      trackSizes(
        unwrap(
          insertTrack(
            tracksOf(["100px", "100px"]),
            { index: 1, position: "after" },
            25,
            "column",
          ),
        )?.tracks ?? [],
      ),
    ).toEqual(["100px", "25px", "75px"]);
  });

  it("treats an insertion with no track to reduce as a no-op", () => {
    expect(
      unwrap(
        insertTrack(
          tracksOf(["100px"]),
          { index: 0, position: "before" },
          25,
          "column",
        ),
      ),
    ).toBeUndefined();
  });

  it("assigns a removed track size to its contra track", () => {
    expect(
      trackSizes(
        unwrap(removeTrack(tracksOf(["1fr", "1fr", "1fr"]), 1, "bwd", "column"))
          .tracks,
      ),
    ).toEqual(["2fr", "1fr"]);

    expect(
      trackSizes(
        unwrap(
          removeTrack(tracksOf(["100px", "50px", "1fr"]), 1, "bwd", "column"),
        ).tracks,
      ),
    ).toEqual(["150px", "1fr"]);

    // a lone pair of fractions needs no redistribution
    expect(
      trackSizes(
        unwrap(removeTrack(tracksOf(["1fr", "1fr"]), 1, "bwd", "column"))
          .tracks,
      ),
    ).toEqual(["1fr"]);
  });

  it("requires measurement to absorb an unmeasured fractional track", () => {
    expect(
      removeTrack(tracksOf(["100px", "1fr", "1fr"]), 1, "bwd", "column"),
    ).toMatchObject({
      error: { code: "MEASUREMENT_REQUIRED" },
      ok: false,
    });
    expect(
      trackSizes(
        unwrap(
          removeTrack(
            tracksOf(["100px", "1fr", "1fr"], [100, 60, 60]),
            1,
            "bwd",
            "column",
          ),
        ).tracks,
      ),
    ).toEqual(["160px", "1fr"]);
  });

  it("resizes a single track directly", () => {
    expect(
      trackSizes(
        unwrap(resizeTrackTo(tracksOf(["100px", "1fr"]), 0, "125px", "column"))
          .tracks,
      ),
    ).toEqual(["125px", "1fr"]);
    expect(
      resizeTrackTo(tracksOf(["100px"]), 4, "125px", "column"),
    ).toMatchObject({ error: { code: "TRACK_NOT_FOUND" }, ok: false });
  });

  it("resizes adjacent tracks, requiring measurement for fractions", () => {
    expect(
      resizeTracksAdjacent(
        tracksOf(["1fr", "1fr"]),
        { contraTrackIndex: 1, delta: 10, resizedTrackIndex: 0 },
        "column",
      ),
    ).toMatchObject({ error: { code: "MEASUREMENT_REQUIRED" }, ok: false });

    expect(
      trackSizes(
        unwrap(
          resizeTracksAdjacent(
            tracksOf(["1fr", "1fr"], [100, 100]),
            { contraTrackIndex: 1, delta: 10, resizedTrackIndex: 0 },
            "column",
          ),
        ).tracks,
      ),
    ).toEqual(["110px", "90px"]);
  });

  it("distributes a proportional resize across each group by size", () => {
    expect(
      trackSizes(
        unwrap(
          resizeTracksProportionally(
            tracksOf(["120px", "120px", "120px"]),
            {
              afterTrackIndices: [1, 2],
              beforeTrackIndices: [0],
              delta: 30,
            },
            "row",
          ),
        ).tracks,
      ),
    ).toEqual(["90px", "135px", "135px"]);
  });

  it("honours explicit minimums and redistributes overlapping minimums", () => {
    expect(
      trackSizes(
        unwrap(
          resizeTracksProportionally(
            tracksOf(["100px", "100px", "200px"]),
            {
              afterConstraints: [
                { minimum: 80, trackIndices: [1] },
                { minimum: 80, trackIndices: [2] },
              ],
              afterTrackIndices: [1, 2],
              beforeConstraints: [{ minimum: 80, trackIndices: [0] }],
              beforeTrackIndices: [0],
              delta: -120,
              initialSizes: [100, 100, 200],
            },
            "row",
          ),
        ).tracks,
      ),
    ).toEqual(["220px", "80px", "100px"]);

    expect(
      trackSizes(
        unwrap(
          resizeTracksProportionally(
            tracksOf(["100px", "100px", "100px", "100px"]),
            {
              afterConstraints: [
                { minimum: 150, trackIndices: [1, 2] },
                { minimum: 150, trackIndices: [2, 3] },
              ],
              afterTrackIndices: [1, 2, 3],
              beforeTrackIndices: [0],
              delta: -100,
            },
            "row",
          ),
        ).tracks,
      ),
    ).toEqual(["200px", "50px", "100px", "50px"]);
  });

  it("reports the reduction a constrained group can absorb", () => {
    expect(
      unwrap(
        getProportionalResizeAllowance(
          tracksOf(["100px", "100px"]),
          [0, 1],
          [{ minimum: 150, trackIndices: [0, 1] }],
          "row",
        ),
      ),
    ).toBe(50);
  });

  it("does not mutate its inputs", () => {
    const tracks = tracksOf(["1fr", "1fr"], [100, 100]);
    const before = JSON.stringify(tracks);

    unwrap(splitTrack(tracks, 0, "column"));
    unwrap(
      resizeTracksAdjacent(
        tracks,
        { contraTrackIndex: 1, delta: 10, resizedTrackIndex: 0 },
        "column",
      ),
    );
    unwrap(removeTrack(tracks, 1, "bwd", "column"));

    expect(JSON.stringify(tracks)).toBe(before);
  });
});

describe("GridGeometry item transitions", () => {
  const singleCell = () =>
    geometry(
      ["1fr"],
      ["1fr"],
      [item("target", "1/1/2/2"), item("dropped", "1/1/2/2")],
    );

  it.each([
    ["north", ["dropped@1/1/2/2", "target@2/1/3/2"], "rows"],
    ["south", ["dropped@2/1/3/2", "target@1/1/2/2"], "rows"],
    ["east", ["dropped@1/2/2/3", "target@1/1/2/2"], "columns"],
    ["west", ["dropped@1/1/2/2", "target@1/2/2/3"], "columns"],
  ] as const)("splits a single cell target %s", (splitDirection, expected, changedTracks) => {
    const transition = unwrap(
      splitGridItem(singleCell(), {
        droppedItemId: "dropped",
        splitDirection,
        targetItemId: "target",
      }),
    );

    expect(gridAreas(transition.geometry).sort()).toEqual([...expected].sort());
    expect(transition.geometry[changedTracks]).toEqual(["1fr", "1fr"]);
    // the split target and dropped item are broadcast, track shifts are not
    expect(transition.updates.map(({ id }) => id)).toEqual([
      "target",
      "dropped",
    ]);
  });

  it("reuses an existing bisecting grid line for a spanning target", () => {
    const transition = unwrap(
      splitGridItem(
        geometry(
          ["1fr", "1fr"],
          ["1fr"],
          [item("target", "1/1/2/3"), item("dropped", "1/1/2/2")],
        ),
        {
          droppedItemId: "dropped",
          splitDirection: "east",
          targetItemId: "target",
        },
      ),
    );

    expect(transition.columns).toBeUndefined();
    expect(transition.silentUpdates).toEqual([]);
    expect(gridAreas(transition.geometry)).toEqual([
      "target@1/1/2/2",
      "dropped@1/2/2/3",
    ]);
    expect(transition.updates.map(({ id }) => id)).toEqual([
      "dropped",
      "target",
    ]);
  });

  it("bisects a fractional span that has no bisecting grid line", () => {
    const transition = unwrap(
      splitGridItem(
        geometry(
          ["1fr", "2fr", "1fr"],
          ["1fr"],
          [item("target", "1/1/2/4"), item("dropped", "1/1/2/2")],
        ),
        {
          droppedItemId: "dropped",
          splitDirection: "east",
          targetItemId: "target",
        },
      ),
    );

    expect(transition.geometry.columns).toEqual(["1fr", "1fr", "1fr", "1fr"]);
    expect(gridAreas(transition.geometry)).toEqual([
      "target@1/1/2/3",
      "dropped@1/3/2/5",
    ]);
  });

  it.each([
    ["north", false],
    ["east", false],
  ] as const)("rejects a split of a non resizable target (%s)", (splitDirection) => {
    const target = item("target", "1/1/2/2", { resizeable: false });
    expect(canSplitGridItem(target, splitDirection)).toBe(false);
    expect(
      splitGridItem(
        geometry(["1fr"], ["1fr"], [target, item("dropped", "1/1/2/2")]),
        {
          droppedItemId: "dropped",
          splitDirection,
          targetItemId: "target",
        },
      ),
    ).toMatchObject({
      error: {
        code: "NON_RESIZABLE",
        message: `Grid item #target cannot be split ${splitDirection}`,
      },
      ok: false,
    });
  });

  it.each([
    ["h", "north", "east"],
    ["v", "east", "north"],
  ] as const)("wires resizeable %s to the directions it allows", (resizeable, rejected, allowed) => {
    const target = item("target", "1/1/2/2", { resizeable });
    expect(
      canSplitGridItem(target, rejected as GridGeometrySplitDirection),
    ).toBe(false);
    expect(
      canSplitGridItem(target, allowed as GridGeometrySplitDirection),
    ).toBe(true);
  });

  it("gives the dropped item the target position on centre replacement", () => {
    const transition = unwrap(
      replaceGridItem(
        geometry(
          ["1fr", "1fr"],
          ["1fr"],
          [item("target", "1/2/2/3"), item("dropped", "1/1/2/2")],
        ),
        { droppedItemId: "dropped", targetItemId: "target" },
      ),
    );

    expect(transition.removals).toEqual([{ id: "target", reason: "close" }]);
    expect(gridAreas(transition.geometry)).toEqual(["dropped@1/2/2/3"]);
    expect(transition.updates).toEqual([]);
  });

  it("extends a contra item over the space left by a removed item", () => {
    const transition = withPlaceholderIds(() =>
      unwrap(
        removeGridItem(
          geometry(
            ["1fr", "1fr"],
            ["1fr"],
            [item("left", "1/1/2/2"), item("right", "1/2/2/3")],
          ),
          { itemId: "right", reason: "close" },
          { createPlaceholderId },
        ),
      ),
    );

    expect(gridAreas(transition.geometry)).toEqual(["left@1/1/2/2"]);
    expect(transition.geometry.columns).toEqual(["1fr"]);
    expect(transition.notify).toBe(true);
    expect(transition.placeholders?.added).toEqual([]);
  });

  it("normalizes several irregular column and row lines", () => {
    const columnTransition = withPlaceholderIds(() =>
      unwrap(
        removeGridItem(
          geometry(
            ["1fr", "1fr", "1fr"],
            ["1fr"],
            [item("left", "1/1/2/2"), item("wide", "1/2/2/4")],
          ),
          { itemId: "wide", reason: "close" },
          { createPlaceholderId },
        ),
      ),
    );
    expect(columnTransition.geometry.columns).toEqual(["1fr"]);
    expect(gridAreas(columnTransition.geometry)).toEqual(["left@1/1/2/2"]);

    const rowTransition = withPlaceholderIds(() =>
      unwrap(
        removeGridItem(
          geometry(
            ["1fr"],
            ["1fr", "1fr", "1fr"],
            [item("top", "1/1/2/2"), item("tall", "2/1/4/2")],
          ),
          { itemId: "tall", reason: "close" },
          { createPlaceholderId },
        ),
      ),
    );
    expect(rowTransition.geometry.rows).toEqual(["1fr"]);
    expect(gridAreas(rowTransition.geometry)).toEqual(["top@1/1/2/2"]);
  });

  it("regenerates a placeholder for space no contra can fill", () => {
    // a pinwheel layout has no contra that can be extended over its centre
    const transition = withPlaceholderIds(() =>
      unwrap(
        removeGridItem(
          geometry(
            ["1fr", "1fr", "1fr"],
            ["1fr", "1fr", "1fr"],
            [
              item("north", "1/1/2/3"),
              item("east", "1/3/3/4"),
              item("south", "3/2/4/4"),
              item("west", "2/1/4/2"),
              item("centre", "2/2/3/3"),
            ],
          ),
          { itemId: "centre", reason: "close" },
          { createPlaceholderId },
        ),
      ),
    );

    expect(transition.geometry.columns).toEqual(["1fr", "1fr", "1fr"]);
    expect(gridAreas(transition.geometry)).toEqual([
      "north@1/1/2/3",
      "east@1/3/3/4",
      "south@3/2/4/4",
      "west@2/1/4/2",
      "placeholder-1@2/2/3/3",
    ]);
    expect(transition.placeholders?.added).toHaveLength(1);
  });

  it("keeps a dragged item in the model and skips its grid lines", () => {
    const transition = withPlaceholderIds(() =>
      unwrap(
        removeGridItem(
          geometry(
            ["1fr", "1fr"],
            ["1fr"],
            [item("left", "1/1/2/2"), item("right", "1/2/2/3")],
          ),
          { itemId: "right", reason: "drag" },
          { createPlaceholderId },
        ),
      ),
    );

    expect(
      transition.geometry.items.find(({ id }) => id === "right")?.dragging,
    ).toBe(true);
    expect(transition.geometry.columns).toEqual(["1fr"]);
  });

  it("reports a stack member removal without touching geometry", () => {
    const transition = unwrap(
      removeGridItem(
        geometry(
          ["1fr"],
          ["1fr"],
          [
            item("stack", "1/1/2/2", { type: "stacked-content" }),
            item("alpha", "1/1/2/2", { stackId: "stack" }),
            item("beta", "1/1/2/2", { stackId: "stack" }),
          ],
        ),
        { itemId: "beta", reason: "close" },
        { createPlaceholderId },
      ),
    );

    expect(transition.stackMember).toBe(true);
    expect(transition.notify).toBe(false);
    expect(transition.geometry.columns).toEqual(["1fr"]);
  });

  it("covers every empty extent with non overlapping placeholders", () => {
    const transition = withPlaceholderIds(() =>
      regeneratePlaceholders(
        geometry(
          ["1fr", "1fr", "1fr"],
          ["1fr", "1fr"],
          [item("only", "1/1/2/2")],
        ),
        createPlaceholderId,
      ),
    );

    expect(gridAreas(transition.geometry)).toEqual([
      "only@1/1/2/2",
      "placeholder-1@1/2/3/4",
      "placeholder-2@2/1/3/2",
    ]);

    const occupancy = new Map<string, number>();
    for (const { column, row } of transition.geometry.items) {
      for (let r = row.start; r < row.end; r++) {
        for (let c = column.start; c < column.end; c++) {
          const key = `${r}:${c}`;
          occupancy.set(key, (occupancy.get(key) ?? 0) + 1);
        }
      }
    }
    expect([...occupancy.values()]).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("replaces existing placeholders rather than duplicating them", () => {
    const first = withPlaceholderIds(() =>
      regeneratePlaceholders(
        geometry(["1fr", "1fr"], ["1fr"], [item("only", "1/1/2/2")]),
        createPlaceholderId,
      ),
    );
    const second = regeneratePlaceholders(first.geometry, createPlaceholderId);

    expect(second.removedIds).toEqual(["placeholder-1"]);
    expect(second.geometry.items).toHaveLength(2);
  });

  it("identifies grid lines that are neither a start nor an end", () => {
    expect(
      findUnusedGridLines(
        geometry(
          ["1fr", "1fr", "1fr"],
          ["1fr"],
          [item("left", "1/1/2/2"), item("right", "1/2/2/4")],
        ),
      ),
    ).toEqual([[3], []]);
    expect(
      findUnusedGridLines(
        geometry(
          ["1fr", "1fr"],
          ["1fr"],
          [item("left", "1/1/2/2"), item("right", "1/2/2/3")],
        ),
      ),
    ).toEqual([[], []]);
  });

  it("shifts items for inserted and removed tracks", () => {
    const items = [item("left", "1/1/2/2"), item("right", "1/2/2/3")];

    expect(shiftItemsForNewTrack(items, "column", 0)).toEqual([
      { column: { end: 3, start: 1 }, id: "left" },
      { column: { end: 4, start: 3 }, id: "right" },
    ]);
    expect(shiftItemsForInsertedTrack(items, "column", 1, "before")).toEqual([
      { column: { end: 3, start: 1 }, id: "left" },
      { column: { end: 4, start: 3 }, id: "right" },
    ]);
    expect(shiftItemsForRemovedTrack(items, "column", 1)).toEqual([
      { column: { end: 2, start: 2 }, id: "right" },
    ]);
  });

  it("anchors resized and contra items to an inserted track", () => {
    const transition = unwrap(
      insertTrackForResize(
        geometry(
          ["100px", "100px"],
          ["1fr"],
          [item("left", "1/1/2/2"), item("right", "1/2/2/3")],
        ),
        {
          contraItemIds: ["left"],
          index: 1,
          position: "before",
          resizeItemIds: ["right"],
          size: 20,
          trackType: "column",
        },
      ),
    );

    expect(transition.geometry.columns).toEqual(["80px", "20px", "100px"]);
    expect(gridAreas(transition.geometry)).toEqual([
      "left@1/1/2/2",
      "right@1/2/2/4",
    ]);
  });

  it("removes a grid track and rebinds the items beyond it", () => {
    const transition = unwrap(
      removeGridTrack(
        geometry(
          ["100px", "50px", "100px"],
          ["1fr"],
          [item("left", "1/1/2/2"), item("right", "1/3/2/4")],
        ),
        { trackIndex: 1, trackType: "column" },
      ),
    );

    expect(transition.geometry.columns).toEqual(["100px", "150px"]);
    expect(gridAreas(transition.geometry)).toEqual([
      "left@1/1/2/2",
      "right@1/2/2/3",
    ]);
  });

  it("computes splitters for intersecting shared track edges", () => {
    const { horizontalSplitterItemIds, splitters, verticalSplitterItemIds } =
      computeSplitters(
        geometry(
          ["1fr", "1fr", "1fr"],
          ["1fr", "1fr"],
          [
            item("upperLeft", "1/1/2/3"),
            item("upperRight", "1/3/2/4"),
            item("lowerLeft", "2/1/3/2"),
            item("lowerMiddle", "2/2/3/3"),
            item("lowerRight", "2/3/3/4"),
          ],
        ),
      );

    expect(
      splitters.map(({ id, resizedGridTracks }) => [id, resizedGridTracks]),
    ).toEqual([
      ["upperRight-splitter-h", [1, 2]],
      ["lowerLeft-splitter-v", [0, 1]],
      ["lowerMiddle-splitter-h", [0, 1]],
      ["lowerRight-splitter-h", [1, 2]],
      ["lowerRight-splitter-v", [0, 1]],
    ]);
    expect(horizontalSplitterItemIds).toEqual([
      "lowerLeft",
      "lowerMiddle",
      "lowerRight",
    ]);
    expect(verticalSplitterItemIds).toEqual([
      "upperRight",
      "lowerMiddle",
      "lowerRight",
    ]);
  });

  it("does not offer splitters for fixed items or stack members", () => {
    const { splitters } = computeSplitters(
      geometry(
        ["1fr", "1fr"],
        ["1fr", "1fr"],
        [
          item("fixedRow", "1/1/2/3", { resizeable: "h" }),
          item("lower", "2/1/3/3"),
          item("stacked", "2/1/3/3", { stackId: "lower" }),
        ],
      ),
    );

    expect(splitters.map(({ id }) => id)).toEqual(["lower-splitter-v"]);
  });

  it("references stack containers rather than their compatibility members", () => {
    const horizontal = computeSplitters(
      geometry(
        ["1fr"],
        ["1fr", "1fr"],
        [
          item("upper", "1/1/2/2"),
          item("stack", "2/1/3/2", { type: "stacked-content" }),
          item("teal", "2/1/3/2", { stackId: "stack" }),
          item("coral", "2/1/3/2", { stackId: "stack" }),
        ],
      ),
    ).splitters;
    const vertical = computeSplitters(
      geometry(
        ["1fr", "1fr"],
        ["1fr"],
        [
          item("left", "1/1/2/2"),
          item("stack", "1/2/2/3", { type: "stacked-content" }),
          item("teal", "1/2/2/3", { stackId: "stack" }),
          item("coral", "1/2/2/3", { stackId: "stack" }),
        ],
      ),
    ).splitters;

    expect(horizontal).toMatchObject([
      {
        orientation: "vertical",
        resizedChildItems: { after: ["stack"], before: ["upper"] },
      },
    ]);
    expect(vertical).toMatchObject([
      {
        orientation: "horizontal",
        resizedChildItems: { after: ["stack"], before: ["left"] },
      },
    ]);
  });

  it("propagates stacked-content updates to stack members", () => {
    const next = applyGeometryUpdates(
      geometry(
        ["1fr", "1fr"],
        ["1fr"],
        [
          item("stack", "1/1/2/2", { type: "stacked-content" }),
          item("alpha", "1/1/2/2", { stackId: "stack" }),
        ],
      ),
      [{ column: { end: 3, start: 1 }, id: "stack" }],
    );

    expect(gridAreas(next)).toEqual(["stack@1/1/2/3", "alpha@1/1/2/3"]);
  });

  it("leaves the geometry it is given untouched", () => {
    const source = geometry(
      ["1fr", "1fr"],
      ["1fr"],
      [item("left", "1/1/2/2"), item("right", "1/2/2/3")],
    );
    const before = JSON.stringify(source);

    unwrap(
      splitGridItem(source, {
        droppedItemId: "right",
        splitDirection: "east",
        targetItemId: "left",
      }),
    );
    withPlaceholderIds(() =>
      unwrap(
        removeGridItem(
          source,
          { itemId: "right", reason: "close" },
          { createPlaceholderId },
        ),
      ),
    );
    unwrap(
      replaceGridItem(source, {
        droppedItemId: "right",
        targetItemId: "left",
      }),
    );

    expect(JSON.stringify(source)).toBe(before);
  });
});
