/**
 * In-page measurement primitives. These run in the browser and work in any
 * Chromium page, no DevTools Protocol required.
 */
import type { DomStats, LongFrameStats } from "./types";

export const nextFrame = () => new Promise<number>(requestAnimationFrame);

/**
 * Resolves with a timestamp taken just after the next frame has been
 * produced: a task queued from within requestAnimationFrame runs after the
 * frame's style, layout and paint. This is the usual "next paint" estimate.
 */
export const afterNextPaint = () =>
  new Promise<number>((resolve) => {
    requestAnimationFrame(() => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve(performance.now());
      channel.port2.postMessage(undefined);
    });
  });

/**
 * Records requestAnimationFrame intervals into a preallocated buffer, so
 * the recording itself creates no garbage while it runs.
 */
export class FrameRecorder {
  #buffer: Float64Array;
  #count = 0;
  #last = 0;
  #running = false;

  constructor(capacity = 20_000) {
    this.#buffer = new Float64Array(capacity);
  }

  start() {
    this.#count = 0;
    this.#running = true;
    requestAnimationFrame((now) => {
      this.#last = now;
      requestAnimationFrame(this.#tick);
    });
  }

  #tick = (now: number) => {
    if (!this.#running) return;
    if (this.#count < this.#buffer.length) {
      this.#buffer[this.#count++] = now - this.#last;
    }
    this.#last = now;
    requestAnimationFrame(this.#tick);
  };

  stop() {
    this.#running = false;
    return this.#buffer.slice(0, this.#count);
  }
}

interface LongAnimationFrameEntry extends PerformanceEntry {
  blockingDuration: number;
}

export class LongFrameObserver {
  #observer: PerformanceObserver | undefined;
  #stats: LongFrameStats = { count: 0, blockingMs: 0 };

  #record = (entries: PerformanceEntryList) => {
    for (const entry of entries) {
      this.#stats.count += 1;
      this.#stats.blockingMs += (
        entry as LongAnimationFrameEntry
      ).blockingDuration;
    }
  };

  start() {
    this.#stats = { count: 0, blockingMs: 0 };
    if (
      PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")
    ) {
      this.#observer = new PerformanceObserver((list) =>
        this.#record(list.getEntries()),
      );
      this.#observer.observe({ type: "long-animation-frame" });
    }
  }

  stop(): LongFrameStats {
    if (this.#observer) {
      this.#record(this.#observer.takeRecords());
      this.#observer.disconnect();
      this.#observer = undefined;
    }
    return {
      count: this.#stats.count,
      blockingMs: Math.round(this.#stats.blockingMs),
    };
  }
}

const isRow = (n: Node): n is HTMLElement =>
  n instanceof HTMLElement &&
  n.classList.contains("vuuTableRow") &&
  n.hasAttribute("aria-rowindex");

const countElements = (n: Node) =>
  n instanceof Element ? 1 + n.getElementsByTagName("*").length : 0;

/**
 * Counts DOM changes inside the table with a MutationObserver. Used only in
 * the instrumented pass, the observer adds overhead of its own.
 */
export class DomChangeCounter {
  #observer: MutationObserver | undefined;
  #root: Element | undefined;
  #seenRows = new WeakSet<Node>();
  #removedRows = new Set<Node>();
  #stats: Omit<DomStats, "tableNodes" | "rowUnmounts"> = emptyCounts();

  start(root: Element) {
    this.#root = root;
    this.#stats = emptyCounts();
    this.#removedRows.clear();
    this.#seenRows = new WeakSet(
      Array.from(root.querySelectorAll(".vuuTableRow[aria-rowindex]")),
    );
    this.#observer = new MutationObserver(this.#record);
    this.#observer.observe(root, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  #record = (records: MutationRecord[]) => {
    const stats = this.#stats;
    for (const record of records) {
      if (record.type === "characterData") {
        stats.textChanges += 1;
      } else if (record.type === "attributes") {
        stats.attributeChanges += 1;
      } else {
        record.removedNodes.forEach((n) => {
          stats.elementsRemoved += countElements(n);
          if (n.nodeType === Node.TEXT_NODE) stats.textChanges += 1;
          if (isRow(n)) this.#removedRows.add(n);
        });
        record.addedNodes.forEach((n) => {
          stats.elementsInserted += countElements(n);
          if (n.nodeType === Node.TEXT_NODE) stats.textChanges += 1;
          if (isRow(n)) {
            if (this.#seenRows.has(n)) {
              stats.rowMoves += 1;
            } else {
              stats.rowMounts += 1;
              this.#seenRows.add(n);
            }
          }
        });
      }
    }
  };

  stop(): DomStats {
    if (this.#observer) {
      this.#record(this.#observer.takeRecords());
      this.#observer.disconnect();
      this.#observer = undefined;
    }
    const rowUnmounts = Array.from(this.#removedRows).filter(
      (n) => !n.isConnected,
    ).length;
    return {
      ...this.#stats,
      rowUnmounts,
      tableNodes: this.#root ? countElements(this.#root) : 0,
    };
  }
}

const emptyCounts = () => ({
  rowMounts: 0,
  rowMoves: 0,
  elementsInserted: 0,
  elementsRemoved: 0,
  textChanges: 0,
  attributeChanges: 0,
});
