import type { Scenario, TableLayout } from "../harness/types";

export const TABLE_LAYOUT: TableLayout = {
  width: 1200,
  height: 700,
  rowHeight: 20,
  renderBufferSize: 5,
};

export const VIEWPORT = { width: 1280, height: 800 };

const SEED = 20261020;

/**
 * Phase 1 scenarios, all on local data. Ids are stable: they key result
 * files and the history on gh-pages, so rename only with care.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "load-100k-20",
    description: "Mount a table of 100k rows x 20 columns",
    dataset: { rows: 100_000, cols: 20, cellType: "formatted", seed: SEED },
    run: { kind: "load" },
  },
  {
    id: "load-1m-20",
    description: "Mount a table of 1M rows x 20 columns",
    dataset: { rows: 1_000_000, cols: 20, cellType: "formatted", seed: SEED },
    run: { kind: "load" },
  },
  {
    id: "scroll-smooth-100k-20",
    description: "Scroll 3 rows per frame for 300 frames, 20 columns",
    dataset: { rows: 100_000, cols: 20, cellType: "formatted", seed: SEED },
    run: { kind: "scroll-smooth", axis: "vertical", step: 3, frames: 300 },
  },
  {
    id: "scroll-smooth-100k-50",
    description: "Scroll 3 rows per frame for 300 frames, 50 columns",
    dataset: { rows: 100_000, cols: 50, cellType: "formatted", seed: SEED },
    run: { kind: "scroll-smooth", axis: "vertical", step: 3, frames: 300 },
  },
  {
    id: "scroll-horizontal-10k-200",
    description: "Scroll 100px per frame across 200 columns",
    dataset: { rows: 10_000, cols: 200, cellType: "formatted", seed: SEED },
    run: { kind: "scroll-smooth", axis: "horizontal", step: 1, frames: 150 },
  },
  {
    id: "scroll-jump-1m-20",
    description: "20 scrollbar jumps to random positions in 1M rows",
    dataset: { rows: 1_000_000, cols: 20, cellType: "formatted", seed: SEED },
    run: { kind: "scroll-jump", jumps: 20 },
  },
  {
    id: "tick-100-20",
    description: "100 updates/s over the visible rows, flashing cells",
    dataset: { rows: 10_000, cols: 20, cellType: "flash", seed: SEED },
    run: {
      kind: "tick",
      updatesPerSecond: 100,
      tickingRows: 30,
      columnsPerUpdate: 3,
      durationMs: 5000,
    },
  },
  {
    id: "tick-1k-20",
    description: "1,000 updates/s over the visible rows, flashing cells",
    dataset: { rows: 10_000, cols: 20, cellType: "flash", seed: SEED },
    run: {
      kind: "tick",
      updatesPerSecond: 1000,
      tickingRows: 30,
      columnsPerUpdate: 3,
      durationMs: 5000,
    },
  },
  {
    id: "tick-1k-20-plain",
    description: "1,000 updates/s over the visible rows, plain cells",
    dataset: { rows: 10_000, cols: 20, cellType: "plain", seed: SEED },
    run: {
      kind: "tick",
      updatesPerSecond: 1000,
      tickingRows: 30,
      columnsPerUpdate: 3,
      durationMs: 5000,
    },
  },
];

/**
 * The metrics compared between targets and charted on the trends page,
 * by scenario kind. Lower is better for all of them.
 */
export const KEY_METRICS: Record<Scenario["run"]["kind"], string[]> = {
  load: ["mount.dataSourceMs", "mount.firstPaintMs", "cdp.jsHeapUsedMB"],
  "scroll-smooth": [
    "frames.p95",
    "frames.jankyPct",
    "longFrames.blockingMs",
    "cdp.scriptMs",
    "cdp.layoutCount",
  ],
  "scroll-jump": ["blankRowMs.p50", "blankRowMs.p95", "frames.p95"],
  tick: [
    "updateToPaintMs.p50",
    "updateToPaintMs.p95",
    "frames.p95",
    "cdp.scriptMs",
  ],
};
