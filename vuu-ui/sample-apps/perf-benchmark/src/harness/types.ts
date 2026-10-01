import type { BurstResult, TickStats } from "./TickEngine";
import type { FpsResult, FrameMetrics } from "./frameMetrics";

export type FilterOp = "eq" | "gt" | "lt";

export type SortDirection = "asc" | "desc";

/**
 * The common surface every grid-under-test must implement. Scenario test
 * files are written once against this shape (exposed on window.__benchmark)
 * so the same test can be pointed at the VUU page or the ag-grid page.
 */
export interface BenchmarkApi {
  rowCount: number;
  /**
   * Regenerates the dataset from its original seed and rewinds the tick
   * PRNG, so every test starts from the exact same data and random-update
   * sequence regardless of what any earlier test already did to the shared
   * server-side state. For ag-grid-client/ag-grid-server this is a no-op -
   * their reset already happened over HTTP before this page even navigated
   * (see gotoGrid) - implemented here only so the contract is uniform across
   * every variant.
   */
  resetDataset: () => void | Promise<void>;
  startTicking: (updatesPerSecond: number, updatesPerMessage?: number) => void;
  stopTicking: () => void;
  fireBurst: (
    totalUpdates: number,
    updatesPerMessage?: number,
  ) => Promise<BurstResult>;
  getTickStats: () => TickStats | Promise<TickStats>;
  resetTickStats: () => void;
  startFpsCounter: () => void;
  stopFpsCounter: () => FpsResult;
  getFrameMetrics: () => FrameMetrics;
  resetFrameMetrics: () => void;
  applySort: (column: string, direction: SortDirection) => void | Promise<void>;
  applyFilter: (
    column: string,
    op: FilterOp,
    value: string | number,
  ) => void | Promise<void>;
  clearFilter: () => void | Promise<void>;
}

declare global {
  interface Window {
    __benchmark?: BenchmarkApi;
  }
}
