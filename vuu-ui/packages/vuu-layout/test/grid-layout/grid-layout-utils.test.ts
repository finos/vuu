import { describe, expect, it } from "vitest";
import {
  type IGridLayoutModelItem,
  getMatchingColspan,
  removeTrackFromTracks,
  splitTracks,
  splitTrack,
  insertTrack,
} from "../../src";

describe("splitTrack", () => {
  it("splits an existing track in two", () => {
    expect(splitTrack([100, 100], 1)).toEqual([100, 50, 50]);
    expect(splitTrack([100, 100, 100], 1)).toEqual([100, 50, 50, 100]);
    expect(splitTrack([100, 100, 100], 0)).toEqual([50, 50, 100, 100]);
  });
  it("assigns new sizes in whole values", () => {
    const newTracks = splitTrack([100, 101], 1);
    expect(newTracks).toEqual([100, 50, 51]);
  });

  it("works with zero size value", () => {
    const newTracks = splitTrack([100, 0], 1);
    expect(newTracks).toEqual([100, 0, 0]);
  });
});

describe("insertTrack", () => {
  it("inserts a new track, defaulting to size value zero", () => {
    expect(insertTrack([100, 100], 1)).toEqual([100, 0, 100]);
    expect(insertTrack([100, 100], 0)).toEqual([0, 100, 100]);
  });
  it("maintains overall size of divided track", () => {
    expect(insertTrack([100, 100], 1, 20)).toEqual([100, 20, 80]);
    expect(insertTrack([100, 100], 0, 50)).toEqual([50, 50, 100]);
  });
});

describe("splitTracks", () => {
  it("splits a two track range at start of tracks", () => {
    const { newTracks, newTrackIndex } = splitTracks([70, 130, 100], 1, 3);
    expect(newTracks).toEqual([70, 30, 100, 100]);
    expect(newTrackIndex).toEqual(1);
  });
  it("splits a two track range at end of tracks", () => {
    const { newTracks, newTrackIndex } = splitTracks([100, 70, 130], 2, 4);
    expect(newTracks).toEqual([100, 70, 30, 100]);
    expect(newTrackIndex).toEqual(2);
  });
  it("splits a two track range in middle of tracks", () => {
    const { newTracks, newTrackIndex } = splitTracks([100, 50, 150, 100], 2, 4);
    expect(newTracks).toEqual([100, 50, 50, 100, 100]);
    expect(newTrackIndex).toEqual(2);
  });
  it("splits all three tracks", () => {
    const { newTracks, newTrackIndex } = splitTracks([100, 100, 100], 1, 4);
    expect(newTracks).toEqual([100, 50, 50, 100]);
    expect(newTrackIndex).toEqual(1);
  });
});

/**
 * Called when performing a vertical resize. We resize not only the targetItem but
 * all contras on other side of splitter, plus any siblings alongside the target
 * item.
 */
describe("getMatchingColspan", () => {
  /*
      ----------------------------------------------------------------------------------
      |                                                                               |
      |       contra1                                                                 |
      |                                                                               |
      ----------------------------------------------------------------------------------
      |                                                                               |
      |       gridItem                                                                |
      |                                                                               |
      ----------------------------------------------------------------------------------
  */
  it("correctly returns a single column match in a grid with only 1 column", () => {
    const contra1 = { column: { start: 1, end: 2 } } as IGridLayoutModelItem;
    const gridItem = { column: { start: 1, end: 2 } } as IGridLayoutModelItem;
    const siblings = [];
    const contras = [contra1];
    expect(getMatchingColspan(gridItem, siblings, contras)).toEqual({
      contras,
      position: {
        start: 1,
        end: 2,
      },
      siblings,
    });
  });
  /*
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |       contra1                |         contra2                                 |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |       gridItem               |         sibling 1                               |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
  */
  it("correctly returns a single column match in a grid with 2 columns gridItem in first column", () => {
    const contra1 = { column: { start: 1, end: 2 } } as IGridLayoutModelItem;
    const contra2 = { column: { start: 2, end: 3 } } as IGridLayoutModelItem;
    const sibling1 = { column: { start: 2, end: 3 } } as IGridLayoutModelItem;

    const gridItem = { column: { start: 1, end: 2 } } as IGridLayoutModelItem;
    const siblings = [sibling1] as IGridLayoutModelItem[];
    const contras = [contra1, contra2] as IGridLayoutModelItem[];
    expect(getMatchingColspan(gridItem, siblings, contras)).toEqual({
      contras: [contra1],
      position: {
        start: 1,
        end: 2,
      },
      siblings: [],
    });
  });

  /*
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |                              |         contra1                                 |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |                              |         gridItem                                |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
  */
  it("correctly returns a single column match in a grid with 2 columns gridItem in second column", () => {
    const contra1 = { column: { start: 2, end: 3 } } as IGridLayoutModelItem;
    const gridItem = { column: { start: 2, end: 3 } } as IGridLayoutModelItem;
    const siblings = [] as IGridLayoutModelItem[];
    const contras = [contra1] as IGridLayoutModelItem[];
    expect(getMatchingColspan(gridItem, siblings, contras)).toEqual({
      contras,
      position: {
        start: 2,
        end: 3,
      },
      siblings: [],
    });
  });

  /*
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |       contra1                |         contra2                                 |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
      |                                                                                |
      |           gridItem                                                             |
      |                                                                                |
      ----------------------------------------------------------------------------------
  */
  it("correctly returns a two colpan match in a grid with 2 columns gridItem spanning 2 columns", () => {
    const gridItem = { column: { start: 1, end: 3 } } as IGridLayoutModelItem;
    const siblings = [] as IGridLayoutModelItem[];
    const contras = [
      { column: { start: 1, end: 2 } },
      { column: { start: 2, end: 3 } },
    ] as IGridLayoutModelItem[];
    expect(getMatchingColspan(gridItem, siblings, contras)).toEqual({
      contras,
      position: {
        start: 1,
        end: 3,
      },
      siblings: [],
    });
  });

  /*
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |       contra1                |         contra2                                 |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
      |                         |                                                      |
      |           gridItem      |               sibling                                |
      |                         |                                                      |
      ----------------------------------------------------------------------------------
  */
  it("correctly returns a two colpan match in a grid with 2 columns, gridItems misaligned, gridItem is narrower than first contra", () => {
    const gridItem = { column: { start: 1, end: 2 } } as IGridLayoutModelItem;
    const siblings = [
      { column: { start: 2, end: 4 } },
    ] as IGridLayoutModelItem[];
    const contras = [
      { column: { start: 1, end: 3 } },
      { column: { start: 3, end: 4 } },
    ] as IGridLayoutModelItem[];
    expect(getMatchingColspan(gridItem, siblings, contras)).toEqual({
      contras,
      position: {
        start: 1,
        end: 4,
      },
      siblings,
    });
  });

  /*
      ----------------------------------------------------------------------------------
      |                      |                                                         |
      |       contra1        |         contra2                                         |
      |                      |                                                         |
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |           gridItem           |               sibling                           |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
  */
  it("correctly returns a 2 col span in a 4 col grid, gridItems misaligned, gridItem is wider than first contra", () => {
    const gridItem = { column: { start: 1, end: 3 } } as IGridLayoutModelItem;
    const siblings = [
      { column: { start: 3, end: 4 } },
    ] as IGridLayoutModelItem[];
    const contras = [
      { column: { start: 1, end: 2 } },
      { column: { start: 2, end: 4 } },
    ] as IGridLayoutModelItem[];
    expect(getMatchingColspan(gridItem, siblings, contras)).toEqual({
      contras,
      position: {
        start: 1,
        end: 4,
      },
      siblings,
    });
  });

  /*
      ----------------------------------------------------------------------------------
      |                      |                             |                           |
      |       contra 1       |         contra 2            |   contra 3                |
      |                      |                             |                           |
      ----------------------------------------------------------------------------------
      |                              |                                                 |
      |           gridItem           |               sibling                           |
      |                              |                                                 |
      ----------------------------------------------------------------------------------
  */
  it("correctly returns a four colpan match in a grid with 4 columns where gridItems are misaligned", () => {
    const gridItem = { column: { start: 1, end: 3 } } as IGridLayoutModelItem;
    const siblings = [
      { column: { start: 3, end: 5 } },
    ] as IGridLayoutModelItem[];
    const contras = [
      { column: { start: 1, end: 2 } },
      { column: { start: 2, end: 4 } },
      { column: { start: 4, end: 5 } },
    ] as IGridLayoutModelItem[];
    expect(getMatchingColspan(gridItem, siblings, contras)).toEqual({
      contras,
      position: {
        start: 1,
        end: 5,
      },
      siblings,
    });
  });
});

describe("removeTracksFromTrack", () => {
  it("removes first track", () => {
    const newTracks = removeTrackFromTracks([1, 499, 500], 0);
    expect(newTracks).toEqual([500, 500]);
  });
  it("removes last track", () => {
    const newTracks = removeTrackFromTracks([500, 499, 1], 2);
    expect(newTracks).toEqual([500, 500]);
  });
  it("removes track anywhere in middle of tracks, defaulting to fwd reassignment", () => {
    expect(removeTrackFromTracks([500, 1, 499], 1)).toEqual([500, 500]);
    expect(removeTrackFromTracks([500, 1, 499, 500], 1)).toEqual([
      500, 500, 500,
    ]);
    expect(removeTrackFromTracks([500, 500, 1, 499], 2)).toEqual([
      500, 500, 500,
    ]);
  });

  it("removes track anywhere in middle of tracks, with explicit fwd reassignment", () => {
    expect(removeTrackFromTracks([500, 1, 499], 1, "fwd")).toEqual([500, 500]);
    expect(removeTrackFromTracks([500, 1, 499, 500], 1, "fwd")).toEqual([
      500, 500, 500,
    ]);
    expect(removeTrackFromTracks([500, 500, 1, 499], 2, "fwd")).toEqual([
      500, 500, 500,
    ]);
  });

  it("removes track anywhere in middle of tracks, respecting bwd reassignment", () => {
    expect(removeTrackFromTracks([499, 1, 500], 1, "bwd")).toEqual([500, 500]);
    expect(removeTrackFromTracks([500, 499, 1, 500], 2, "bwd")).toEqual([
      500, 500, 500,
    ]);
  });
});
