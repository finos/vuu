import {
  afterNextPaint,
  DomChangeCounter,
  FrameRecorder,
  LongFrameObserver,
  nextFrame,
} from "../harness/measure";
import { distribution, frameStats } from "../harness/stats";
import {
  burstPauseMs,
  createRandom,
  KEY_COLUMN,
  type Row,
  rowKey,
  SEQ_COLUMN,
  STEADY_INTERVAL_MS,
  steadyUpdatesDue,
  updatedRow,
  updateRandom,
} from "../harness/dataset";
import type {
  DatasetConfig,
  InPageResult,
  RunOptions,
  Scenario,
  ScrollJumpConfig,
  ScrollSmoothConfig,
  TableLayout,
  TickConfig,
} from "../harness/types";
import type { BenchDataSource } from "./data";

/**
 * Source of row updates for the tick scenario. Each update batch carries a
 * sequence number, 1, 2, 3 ..., written into the seq column of every row
 * it updates. Resolves when the feed ends, with the time (page clock) each
 * batch was emitted, by sequence number - 1.
 */
export interface UpdateFeed {
  run: (
    config: TickConfig,
    seed: number,
  ) => Promise<{ updatesEmitted: number; batchTimes: number[] }>;
}

export interface ScenarioContext {
  dataset: DatasetConfig;
  feed: UpdateFeed;
  layout: TableLayout;
  table: HTMLElement;
}

/**
 * Feed for local data: updates are generated in the page and applied to the
 * ArrayDataSource, on the same update path a ticking local data source uses.
 */
export const localFeed = (
  dataSource: BenchDataSource,
  data: Row[],
): UpdateFeed => ({
  run: (config, seed) =>
    new Promise((resolve) => {
      const random = updateRandom(seed);
      const tickingRows = Math.min(config.tickingRows, data.length);
      const batchTimes: number[] = [];
      let emitted = 0;
      const update = (rowIndex: number) => {
        const row = updatedRow(
          data[rowIndex],
          batchTimes.length,
          random,
          config.columnsPerUpdate,
        );
        data[rowIndex] = row;
        dataSource.applyUpdate(row);
        emitted += 1;
      };
      const start = performance.now();
      const done = () => {
        const finished = performance.now() - start >= config.durationMs;
        if (finished) resolve({ updatesEmitted: emitted, batchTimes });
        return finished;
      };

      if (config.mode === "burst") {
        const burst = () => {
          if (done()) return;
          batchTimes.push(performance.now());
          for (let r = 0; r < tickingRows; r++) update(r);
          setTimeout(burst, burstPauseMs(random));
        };
        burst();
      } else {
        const steady = () => {
          if (done()) return;
          const due = steadyUpdatesDue(
            config.updatesPerSecond,
            performance.now() - start,
          );
          if (due > emitted) {
            batchTimes.push(performance.now());
            while (emitted < due) update(Math.floor(random() * tickingRows));
          }
          setTimeout(steady, STEADY_INTERVAL_MS);
        };
        steady();
      }
    }),
});

const scrollContainer = (table: HTMLElement) => {
  const el = table.querySelector<HTMLElement>(".vuuTable-scrollbarContainer");
  if (!el) throw Error("[benchmarks] table scrollbar container not found");
  return el;
};

const waitFrames = async (n: number) => {
  for (let i = 0; i < n; i++) await nextFrame();
};

/**
 * Wraps a scenario body with the measurements common to every scenario:
 * frame times, long animation frames and, in the instrumented pass, DOM
 * changes, DOM API calls (when the runner installed the DOM probe) and React
 * renders (profiling build).
 */
const measured = async (
  { table }: ScenarioContext,
  options: RunOptions,
  body: () => Promise<Partial<InPageResult> & { latencies?: number[] }>,
): Promise<InPageResult> => {
  const frames = new FrameRecorder();
  const longFrames = new LongFrameObserver();
  const dom = options.instrument ? new DomChangeCounter() : undefined;
  const domProbe = options.instrument ? window.__vuuDomProbe : undefined;
  const reactProbe = options.instrument ? window.__vuuReactProbe : undefined;

  await waitFrames(2);
  dom?.start(table);
  domProbe?.reset();
  reactProbe?.reset();
  longFrames.start();
  frames.start();
  const start = performance.now();

  const { latencies, ...result } = await body();

  const durationMs = performance.now() - start;
  const frameTimes = frames.stop();
  const domStats = dom?.stop();
  if (domStats && domProbe) domStats.api = domProbe.read();
  return {
    ...result,
    durationMs: Math.round(durationMs),
    frames: frameStats(frameTimes),
    longFrames: longFrames.stop(),
    dom: domStats,
    react: reactProbe?.read(),
    samples: options.keepSamples
      ? { frames: Array.from(frameTimes), latencies }
      : undefined,
  };
};

const scrollSmooth = (
  ctx: ScenarioContext,
  config: ScrollSmoothConfig,
  options: RunOptions,
) => {
  const scroller = scrollContainer(ctx.table);
  const vertical = config.axis === "vertical";
  const stepPx = vertical
    ? config.step * ctx.layout.rowHeight
    : config.step * 100;
  scroller.scrollTop = 0;
  scroller.scrollLeft = 0;
  return measured(ctx, options, async () => {
    for (let i = 0; i < config.frames; i++) {
      if (vertical) {
        scroller.scrollTop += stepPx;
      } else {
        scroller.scrollLeft += stepPx;
      }
      await nextFrame();
    }
    await waitFrames(2);
    return vertical ? { rowsScrolled: config.step * config.frames } : {};
  });
};

/** All rows that should be visible after a jump are rendered with data */
const viewportFilled = (table: HTMLElement, first: number, last: number) => {
  for (const index of [first, last]) {
    // aria-rowindex is 1 based and includes the header row
    const cell = table.querySelector(
      `.vuuTableRow[aria-rowindex="${index + 2}"] [data-field="${KEY_COLUMN}"]`,
    );
    if (cell?.textContent !== rowKey(index)) return false;
  }
  return true;
};

const scrollJump = (
  ctx: ScenarioContext,
  config: ScrollJumpConfig,
  options: RunOptions,
  seed: number,
) => {
  const scroller = scrollContainer(ctx.table);
  const { rowHeight, height } = ctx.layout;
  const visibleRows = Math.floor(height / rowHeight) - 2;
  const maxFirstRow = ctx.dataset.rows - visibleRows - 1;
  const random = createRandom(seed + 1);
  const blankRowMs: number[] = [];

  return measured(ctx, options, async () => {
    for (let i = 0; i < config.jumps; i++) {
      const first = Math.floor(random() * maxFirstRow);
      const t0 = performance.now();
      scroller.scrollTop = first * rowHeight;
      // allow up to 2s for the viewport to fill
      while (performance.now() - t0 < 2000) {
        await nextFrame();
        if (viewportFilled(ctx.table, first, first + visibleRows - 1)) break;
      }
      blankRowMs.push((await afterNextPaint()) - t0);
      await waitFrames(2);
    }
    return { blankRowMs: distribution(blankRowMs), latencies: blankRowMs };
  });
};

/**
 * Runs an update feed over the top `tickingRows` rows. Every update in a
 * batch carries the batch sequence number in the seq column, a
 * MutationObserver sees when that value reaches the DOM.
 */
const tick = (
  ctx: ScenarioContext,
  config: TickConfig,
  options: RunOptions,
  seed: number,
) => {
  const { feed, table } = ctx;
  const body = table.querySelector(".vuuTable-body") ?? table;
  scrollContainer(table).scrollTop = 0;

  // commit and paint times, by sequence number - 1. A batch counts as
  // committed when it, or any later batch, first shows in the seq column.
  const committedAt: number[] = [];
  const paintedAt: number[] = [];
  let highestSeen = 0;

  const onMutation = (records: MutationRecord[]) => {
    let seq = highestSeen;
    for (const record of records) {
      const node =
        record.target.nodeType === Node.TEXT_NODE
          ? record.target.parentElement
          : (record.target as Element);
      const cell = node?.closest(`[data-field="${SEQ_COLUMN}"]`);
      if (cell) {
        const value = Number(cell.textContent);
        if (value > seq) seq = value;
      }
    }
    if (seq > highestSeen) {
      const now = performance.now();
      const first = highestSeen;
      for (let i = first; i < seq; i++) committedAt[i] = now;
      highestSeen = seq;
      afterNextPaint().then((painted) => {
        for (let i = first; i < seq; i++) paintedAt[i] = painted;
      });
    }
  };

  return measured(ctx, options, async () => {
    const observer = new MutationObserver(onMutation);
    observer.observe(body, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    const { updatesEmitted, batchTimes } = await feed.run(config, seed);

    // let the last batches reach the screen; remote batches may still be on
    // their way through the worker
    const deadline = performance.now() + 1000;
    while (highestSeen < batchTimes.length && performance.now() < deadline) {
      await nextFrame();
    }
    await waitFrames(3);
    await afterNextPaint();
    onMutation(observer.takeRecords());
    observer.disconnect();
    await afterNextPaint();

    const commitLatencies: number[] = [];
    const paintLatencies: number[] = [];
    batchTimes.forEach((emittedAt, i) => {
      if (committedAt[i] !== undefined) {
        commitLatencies.push(committedAt[i] - emittedAt);
      }
      if (paintedAt[i] !== undefined) {
        paintLatencies.push(paintedAt[i] - emittedAt);
      }
    });

    return {
      updatesEmitted,
      updateBatches: batchTimes.length,
      updateToCommitMs: distribution(commitLatencies),
      updateToPaintMs: distribution(paintLatencies),
      latencies: paintLatencies,
    };
  });
};

export const runScenario = (
  ctx: ScenarioContext,
  scenario: Scenario,
  options: RunOptions,
): Promise<InPageResult> => {
  const { run, dataset } = scenario;
  switch (run.kind) {
    case "scroll-smooth":
      return scrollSmooth(ctx, run, options);
    case "scroll-jump":
      return scrollJump(ctx, run, options, dataset.seed);
    case "tick":
      return tick(ctx, run, options, dataset.seed);
    case "load":
      // load is measured by mount, run only records an idle period so the
      // run record has frame stats for the settled table
      return measured(ctx, options, async () => {
        await waitFrames(30);
        return {};
      });
  }
};
