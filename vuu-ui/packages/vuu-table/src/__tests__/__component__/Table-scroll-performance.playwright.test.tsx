import type { CDPSession, Page, TestInfo } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

/**
 * Scroll performance measurements, comparing forward (down) vs backward (up)
 * scrolling over exactly the same rows.
 *
 * These are measurements rather than assertions and are skipped unless
 * VUU_PERF=1. Chromium only (uses Chrome DevTools Protocol).
 *
 *   npm run test:playwright:perf
 *
 * For representative numbers use the production gallery build:
 *
 *   npm run playwright:gallery:build
 *   PLAYWRIGHT_GALLERY=production npm run test:playwright:perf
 *
 * Optional env:
 *   VUU_PERF_ITERATIONS    measured runs per direction (default 5)
 *   VUU_PERF_STEPS         scroll steps (frames) per run (default 150)
 *   VUU_PERF_STEP_SIZES    comma separated step sizes in rows (default 1,3,10)
 *   VUU_PERF_CPU_THROTTLE  CPU slowdown factor (default 4, 1 = none)
 *   VUU_PERF_TRACE=1       also record a Chrome trace for one run in each
 *                          direction, open in DevTools Performance panel
 *
 * Collected per run:
 *   - DOM row operations within the table body (MutationObserver):
 *       mounts   - new row elements inserted
 *       moves    - existing row elements re-inserted (DOM reorder)
 *       unmounts - row elements removed and not re-inserted
 *   - CDP Performance metrics: layout and style recalc counts/durations,
 *     script and total task duration
 *   - Frame timing: rAF intervals (mean, p95, max, janky frames) and
 *     long-animation-frame blocking time
 */

const ROW_HEIGHT = 20;
const ROW_COUNT = 10_000;
const TABLE_HEIGHT = 600;
const START_ROW = 2_000;

const env = process.env;
const ITERATIONS = Number(env.VUU_PERF_ITERATIONS ?? 5);
const STEPS = Number(env.VUU_PERF_STEPS ?? 150);
const STEP_SIZES = (env.VUU_PERF_STEP_SIZES ?? "1,3,10").split(",").map(Number);
const CPU_THROTTLE = Number(env.VUU_PERF_CPU_THROTTLE ?? 4);
const TRACE = env.VUU_PERF_TRACE === "1";

type Direction = "forward" | "backward";

type DomStats = { mounts: number; moves: number; unmounts: number };
type FrameStats = {
  frames: number;
  meanFrameMs: number;
  p95FrameMs: number;
  maxFrameMs: number;
  framesOver16ms: number;
  framesOver33ms: number;
  longAnimationFrames: number;
  blockingMs: number;
};
type CdpStats = {
  layoutCount: number;
  layoutMs: number;
  recalcStyleCount: number;
  recalcStyleMs: number;
  scriptMs: number;
  taskMs: number;
};
type RunResult = DomStats &
  FrameStats &
  CdpStats & { direction: Direction; stepRows: number; elapsedMs: number };

const CDP_METRICS = {
  LayoutCount: "layoutCount",
  LayoutDuration: "layoutMs",
  RecalcStyleCount: "recalcStyleCount",
  RecalcStyleDuration: "recalcStyleMs",
  ScriptDuration: "scriptMs",
  TaskDuration: "taskMs",
} as const;

const getCdpMetrics = async (cdp: CDPSession) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
};

const diffCdpMetrics = (
  before: Record<string, number>,
  after: Record<string, number>,
): CdpStats => {
  const stats = {} as CdpStats;
  for (const [name, key] of Object.entries(CDP_METRICS)) {
    const delta = (after[name] ?? 0) - (before[name] ?? 0);
    // CDP durations are reported in seconds
    stats[key] = name.endsWith("Duration") ? delta * 1000 : delta;
  }
  return stats;
};

/** Scroll so that `row` is the first row in viewport, wait for render. */
const scrollToRow = async (page: Page, row: number) => {
  await page.evaluate(
    async ({ scrollTop }) => {
      const scrollbar = document.querySelector(
        ".vuuTable-scrollbarContainer",
      ) as HTMLElement;
      scrollbar.scrollTop = scrollTop;
      for (let i = 0; i < 3; i++) {
        await new Promise(requestAnimationFrame);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
    { scrollTop: row * ROW_HEIGHT },
  );
  // aria-rowindex is 1 based and includes the header row
  await expect(
    page.locator(`.vuuTableRow[aria-rowindex="${row + 2}"]`),
  ).toBeVisible();
};

/**
 * Scroll by `stepRows` rows per animation frame for `steps` frames,
 * instrumenting DOM mutations and frame timing within the page.
 */
const scrollInPage = (
  page: Page,
  { direction, stepRows }: { direction: Direction; stepRows: number },
) =>
  page.evaluate(
    async ({ stepPx, steps }) => {
      const scrollbar = document.querySelector(
        ".vuuTable-scrollbarContainer",
      ) as HTMLElement;
      const body = document.querySelector(".vuuTable-body") as HTMLElement;
      const isRow = (n: Node): n is HTMLElement =>
        n instanceof HTMLElement &&
        n.classList.contains("vuuTableRow") &&
        n.hasAttribute("aria-rowindex");

      const seen = new WeakSet<Node>(Array.from(body.children).filter(isRow));
      const removed = new Set<Node>();
      let mounts = 0;
      let moves = 0;
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          record.removedNodes.forEach((n) => {
            if (isRow(n)) removed.add(n);
          });
          record.addedNodes.forEach((n) => {
            if (!isRow(n)) return;
            if (seen.has(n)) {
              moves += 1;
            } else {
              mounts += 1;
              seen.add(n);
            }
          });
        }
      });
      observer.observe(body, { childList: true });

      let longAnimationFrames = 0;
      let blockingMs = 0;
      let loafObserver: PerformanceObserver | undefined;
      if (
        PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")
      ) {
        loafObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longAnimationFrames += 1;
            blockingMs += (entry as unknown as { blockingDuration: number })
              .blockingDuration;
          }
        });
        loafObserver.observe({ type: "long-animation-frame" });
      }

      const frameTimes: number[] = [];
      const start = performance.now();
      let last = await new Promise<number>(requestAnimationFrame);
      for (let i = 0; i < steps; i++) {
        scrollbar.scrollTop += stepPx;
        const now = await new Promise<number>(requestAnimationFrame);
        frameTimes.push(now - last);
        last = now;
      }
      // let any trailing render complete
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const elapsedMs = performance.now() - start;

      observer.takeRecords();
      observer.disconnect();
      loafObserver?.takeRecords().forEach((entry) => {
        longAnimationFrames += 1;
        blockingMs += (entry as unknown as { blockingDuration: number })
          .blockingDuration;
      });
      loafObserver?.disconnect();

      const unmounts = Array.from(removed).filter((n) => !n.isConnected).length;
      const sorted = [...frameTimes].sort((a, b) => a - b);
      return {
        mounts,
        moves,
        unmounts,
        frames: frameTimes.length,
        meanFrameMs:
          frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length,
        p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
        maxFrameMs: sorted[sorted.length - 1],
        framesOver16ms: frameTimes.filter((t) => t > 17).length,
        framesOver33ms: frameTimes.filter((t) => t > 34).length,
        longAnimationFrames,
        blockingMs,
        elapsedMs,
      };
    },
    {
      stepPx: (direction === "forward" ? 1 : -1) * stepRows * ROW_HEIGHT,
      steps: STEPS,
    },
  );

const measureRun = async (
  page: Page,
  cdp: CDPSession,
  direction: Direction,
  stepRows: number,
): Promise<RunResult> => {
  const distance = stepRows * STEPS;
  const startRow = direction === "forward" ? START_ROW : START_ROW + distance;
  await scrollToRow(page, startRow);

  const before = await getCdpMetrics(cdp);
  const inPage = await scrollInPage(page, { direction, stepRows });
  const after = await getCdpMetrics(cdp);

  // sanity check, we landed where expected and rendered correct rows
  const endRow = direction === "forward" ? START_ROW + distance : START_ROW;
  await expect(
    page.locator(`.vuuTableRow[aria-rowindex="${endRow + 2}"]`),
  ).toBeVisible();

  return {
    direction,
    stepRows,
    ...inPage,
    ...diffCdpMetrics(before, after),
  };
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const summarise = (runs: RunResult[]) => {
  const keys = Object.keys(runs[0]).filter(
    (k) => k !== "direction" && k !== "stepRows",
  ) as (keyof RunResult)[];
  const summary: Record<string, Record<string, number | string>> = {};
  for (const stepRows of STEP_SIZES) {
    const byDirection = (direction: Direction) =>
      runs.filter((r) => r.stepRows === stepRows && r.direction === direction);
    const forward = byDirection("forward");
    const backward = byDirection("backward");
    for (const key of keys) {
      const f = median(forward.map((r) => r[key] as number));
      const b = median(backward.map((r) => r[key] as number));
      summary[`${stepRows} row step: ${key}`] = {
        forward: round(f),
        backward: round(b),
        "backward/forward": f === 0 ? (b === 0 ? "-" : "∞") : round(b / f),
      };
    }
  }
  return summary;
};

const round = (n: number) => Math.round(n * 100) / 100;

const recordTrace = async (
  page: Page,
  testInfo: TestInfo,
  direction: Direction,
  stepRows: number,
) => {
  const browser = page.context().browser();
  if (!browser) return;
  const path = testInfo.outputPath(`trace-${direction}-${stepRows}rows.json`);
  const distance = stepRows * STEPS;
  await scrollToRow(
    page,
    direction === "forward" ? START_ROW : START_ROW + distance,
  );
  await browser.startTracing(page, { path, screenshots: false });
  await scrollInPage(page, { direction, stepRows });
  await browser.stopTracing();
  await testInfo.attach(`trace-${direction}-${stepRows}rows`, {
    path,
    contentType: "application/json",
  });
};

test.describe("Table scroll performance", () => {
  test.skip(
    env.VUU_PERF !== "1",
    "Performance measurement, run with VUU_PERF=1",
  );
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Uses Chrome DevTools Protocol",
  );

  test("forward vs backward scrolling over the same rows", async ({
    mount,
    page,
  }, testInfo) => {
    test.setTimeout(10 * 60_000);

    await page.setViewportSize({ width: 1200, height: TABLE_HEIGHT + 100 });
    await mount("Table/Misc/TestTable", {
      height: TABLE_HEIGHT,
      rowCount: ROW_COUNT,
      rowHeight: ROW_HEIGHT,
    });
    await expect(
      page.locator(".vuuTableRow[aria-rowindex]").first(),
    ).toBeVisible();

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable", { timeDomain: "threadTicks" });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });

    const runs: RunResult[] = [];
    for (const stepRows of STEP_SIZES) {
      // warm up, discarded
      await measureRun(page, cdp, "forward", stepRows);
      await measureRun(page, cdp, "backward", stepRows);

      for (let i = 0; i < ITERATIONS; i++) {
        // alternate order to cancel out any ordering effects
        const order: Direction[] =
          i % 2 === 0 ? ["forward", "backward"] : ["backward", "forward"];
        for (const direction of order) {
          runs.push(await measureRun(page, cdp, direction, stepRows));
        }
      }

      if (TRACE) {
        await recordTrace(page, testInfo, "forward", stepRows);
        await recordTrace(page, testInfo, "backward", stepRows);
      }
    }

    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

    const renderedRows = await page
      .locator(".vuuTableRow[aria-rowindex]")
      .count();
    const summary = summarise(runs);
    const report = {
      config: {
        gallery:
          env.CI || env.PLAYWRIGHT_GALLERY === "production"
            ? "production"
            : "development",
        rowCount: ROW_COUNT,
        rowHeight: ROW_HEIGHT,
        renderedRows,
        startRow: START_ROW,
        stepsPerRun: STEPS,
        stepSizes: STEP_SIZES,
        iterations: ITERATIONS,
        cpuThrottle: CPU_THROTTLE,
      },
      summary,
      runs,
    };

    console.log(
      `\nTable scroll performance (medians of ${ITERATIONS} runs, ` +
        `${STEPS} frames per run, ${renderedRows} rendered rows, ` +
        `CPU throttle x${CPU_THROTTLE}, ${report.config.gallery} build)`,
    );
    console.table(summary);

    const resultsPath = testInfo.outputPath("table-scroll-performance.json");
    await testInfo.attach("table-scroll-performance", {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    });
    await import("node:fs/promises").then((fs) =>
      fs.writeFile(resultsPath, JSON.stringify(report, null, 2)),
    );
    console.log(`Full results: ${resultsPath}`);
  });
});
