import { type InstrumentRow, mutateTick } from "./instruments";
import { mulberry32 } from "./prng";

export interface TickStats {
  /** number of scheduled tick messages fired */
  messagesSent: number;
  /** total individual row updates applied across all messages */
  rowsUpdated: number;
  /** sum of positive scheduling drift (ms) - how late each tick fired vs its target time */
  totalDriftMs: number;
  /** largest single scheduling drift observed (ms) */
  maxDriftMs: number;
}

export interface BurstResult {
  totalUpdates: number;
  durationMs: number;
  updatesPerSecond: number;
}

const emptyStats = (): TickStats => ({
  messagesSent: 0,
  rowsUpdated: 0,
  totalDriftMs: 0,
  maxDriftMs: 0,
});

export type ApplyUpdatesFn = (rows: InstrumentRow[]) => void;

/**
 * Drives synthetic "price tick" updates against a fixed row set, mirroring
 * ag-grid's own published streaming-update methodology: messages containing
 * a fixed number of row updates, fired at a target rate. Grid-agnostic - the
 * caller supplies applyUpdates, which pushes the changed rows into whichever
 * grid is under test.
 *
 * Runs unchanged in the browser or in Node (uses plain setTimeout/
 * performance.now(), no window/DOM APIs) - this is what the ag-grid feed
 * server uses server-side, mirroring VUU's BenchmarkTickProvider running
 * the equivalent loop in Scala.
 */
export class TickEngine {
  #rows: InstrumentRow[];
  #applyUpdates: ApplyUpdatesFn;
  #rnd = mulberry32(1);
  #timer: ReturnType<typeof setTimeout> | undefined;
  #nextExpectedTime = 0;
  #intervalMs = 0;
  #updatesPerMessage = 100;
  #stats: TickStats = emptyStats();

  constructor(rows: InstrumentRow[], applyUpdates: ApplyUpdatesFn) {
    this.#rows = rows;
    this.#applyUpdates = applyUpdates;
  }

  #generateBatch(n: number): InstrumentRow[] {
    const batch: InstrumentRow[] = [];
    for (let i = 0; i < n; i++) {
      const row = this.#rows[Math.floor(this.#rnd() * this.#rows.length)];
      mutateTick(this.#rnd, row);
      batch.push(row);
    }
    return batch;
  }

  #tick = () => {
    const now = performance.now();
    const drift = now - this.#nextExpectedTime;
    const batch = this.#generateBatch(this.#updatesPerMessage);
    this.#applyUpdates(batch);

    this.#stats.messagesSent += 1;
    this.#stats.rowsUpdated += batch.length;
    if (drift > 0) {
      this.#stats.totalDriftMs += drift;
      this.#stats.maxDriftMs = Math.max(this.#stats.maxDriftMs, drift);
    }

    this.#nextExpectedTime += this.#intervalMs;
    const delay = Math.max(0, this.#nextExpectedTime - performance.now());
    this.#timer = setTimeout(this.#tick, delay);
  };

  /** Sustained streaming load, e.g. 1000 updates/sec as 10 messages/sec of 100 updates each. */
  start(updatesPerSecond: number, updatesPerMessage = 100) {
    this.stop();
    this.#stats = emptyStats();
    this.#updatesPerMessage = updatesPerMessage;
    this.#intervalMs = (updatesPerMessage / updatesPerSecond) * 1000;
    this.#nextExpectedTime = performance.now() + this.#intervalMs;
    this.#timer = setTimeout(this.#tick, this.#intervalMs);
  }

  stop() {
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  get isRunning() {
    return this.#timer !== undefined;
  }

  getStats(): TickStats {
    return { ...this.#stats };
  }

  resetStats() {
    this.#stats = emptyStats();
  }

  /**
   * Single burst of totalUpdates fired as fast as possible, mirroring
   * ag-grid's stress test and VUU's BenchmarkTickProvider.fireBurst (Scala) -
   * both run this as a tight, unthrottled loop with no yielding between
   * messages, so this does too. (An earlier version of this method yielded
   * a macrotask between messages to keep a browser responsive during a
   * burst; that no longer applies now that fireBurst only ever runs
   * server-side - VUU's real server, or this class inside the ag-grid feed
   * server - and it was silently capping throughput at whatever Node/the
   * browser clamps a zero-delay setTimeout to, understating both sides.)
   */
  async fireBurst(
    totalUpdates: number,
    updatesPerMessage = 100,
  ): Promise<BurstResult> {
    const start = performance.now();
    let remaining = totalUpdates;
    while (remaining > 0) {
      const n = Math.min(updatesPerMessage, remaining);
      this.#applyUpdates(this.#generateBatch(n));
      remaining -= n;
    }
    const durationMs = performance.now() - start;
    return {
      totalUpdates,
      durationMs,
      updatesPerSecond: totalUpdates / (durationMs / 1000),
    };
  }
}
