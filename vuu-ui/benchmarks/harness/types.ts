/**
 * Types shared by the in-page harness (benchmarks/app) and the Playwright
 * runner (benchmarks/runner). Keep this file free of runtime imports, it is
 * imported from both browser and node code.
 */

export type ScenarioKind = "load" | "scroll-smooth" | "scroll-jump" | "tick";

export type CellType = "plain" | "formatted" | "flash";

export interface DatasetConfig {
  rows: number;
  cols: number;
  cellType: CellType;
  /** PRNG seed, the same seed always produces the same data and updates */
  seed: number;
}

export interface TableLayout {
  width: number;
  height: number;
  rowHeight: number;
  renderBufferSize: number;
}

export interface ScrollSmoothConfig {
  kind: "scroll-smooth";
  axis: "vertical" | "horizontal";
  /** rows (vertical) or 100px units (horizontal) scrolled per frame */
  step: number;
  frames: number;
}

export interface ScrollJumpConfig {
  kind: "scroll-jump";
  jumps: number;
}

export interface TickConfig {
  kind: "tick";
  /** row updates per second */
  updatesPerSecond: number;
  /** updates are spread over this many visible rows, from the top */
  tickingRows: number;
  /** number of value columns changed in each row update */
  columnsPerUpdate: number;
  durationMs: number;
}

export interface LoadConfig {
  kind: "load";
}

export type RunConfig =
  | LoadConfig
  | ScrollSmoothConfig
  | ScrollJumpConfig
  | TickConfig;

export interface Scenario {
  /** stable id, used for file names and history, e.g. scroll-smooth-100k-20 */
  id: string;
  description: string;
  dataset: DatasetConfig;
  run: RunConfig;
}

export interface MountResult {
  dataGenMs: number;
  dataSourceMs: number;
  /** mount() call until first rows are committed to the DOM */
  firstRowsMs: number;
  /** mount() call until the frame containing the first rows is painted */
  firstPaintMs: number;
}

export interface Distribution {
  count: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

export interface FrameStats extends Distribution {
  /** frames longer than 1.5 x the 16.7ms budget */
  jankyFrames: number;
  jankyPct: number;
}

export interface LongFrameStats {
  count: number;
  blockingMs: number;
}

export interface DomStats {
  /** element count inside the table at the end of the run */
  tableNodes: number;
  rowMounts: number;
  rowMoves: number;
  rowUnmounts: number;
  elementsInserted: number;
  elementsRemoved: number;
  textChanges: number;
  attributeChanges: number;
}

export interface InPageResult {
  durationMs: number;
  frames: FrameStats;
  longFrames: LongFrameStats;
  /** scroll-smooth (vertical): total rows scrolled */
  rowsScrolled?: number;
  /** scroll-jump: time from jump to all visible rows rendered and painted */
  blankRowMs?: Distribution;
  /** tick: time from update emitted to its frame painted */
  updateToPaintMs?: Distribution;
  /** tick: time from update emitted to DOM commit */
  updateToCommitMs?: Distribution;
  updatesEmitted?: number;
  updateBatches?: number;
  /** instrumented pass only */
  dom?: DomStats;
  samples?: { frames: number[]; latencies?: number[] };
}

export interface RunOptions {
  instrument: boolean;
  keepSamples: boolean;
}

export interface VuuBenchApi {
  version: number;
  build: { gitSha: string; mode: "production" | "development" };
  mount: (scenario: Scenario, layout: TableLayout) => Promise<MountResult>;
  run: (scenario: Scenario, options: RunOptions) => Promise<InPageResult>;
  unmount: () => Promise<void>;
}

export interface CdpStats {
  layoutCount: number;
  layoutMs: number;
  recalcStyleCount: number;
  recalcStyleMs: number;
  scriptMs: number;
  taskMs: number;
  /** values at end of run */
  jsHeapUsedMB: number;
  domNodes: number;
  jsEventListeners: number;
}

export interface BenchEnv {
  gitSha: string;
  target: string;
  buildMode: "production" | "development";
  browser: string;
  browserVersion: string;
  headless: boolean;
  gpu: "on" | "off";
  cpuThrottle: number;
  viewport: [number, number];
  devicePixelRatio: number;
  hardwareConcurrency: number;
  platform: string;
  machineId?: string;
}

/** One measured iteration of one scenario against one target */
export interface BenchRun {
  schemaVersion: 1;
  scenarioId: string;
  pass: "timing" | "instrumented";
  iteration: number;
  startedAt: string;
  mount: MountResult;
  result: InPageResult;
  cdp: CdpStats;
}

/** Per-metric medians across timing iterations */
export type MetricSummary = Record<string, number>;

export interface ScenarioResult {
  schemaVersion: 1;
  scenario: Scenario;
  env: BenchEnv;
  runs: BenchRun[];
  summary: MetricSummary;
}

declare global {
  interface Window {
    __vuuBench: VuuBenchApi;
  }
}
