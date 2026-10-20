import {
  afterNextPaint,
  DomChangeCounter,
  FrameRecorder,
  LongFrameObserver,
  nextFrame,
} from "../harness/measure";
import { distribution, frameStats } from "../harness/stats";
import type {
  InPageResult,
  RunOptions,
  Scenario,
  ScrollJumpConfig,
  ScrollSmoothConfig,
  TableLayout,
  TickConfig,
} from "../harness/types";
import {
  type BenchDataSource,
  createRandom,
  FIRST_VALUE_COLUMN,
  KEY_COLUMN,
  type Row,
  rowKey,
  SEQ_COLUMN,
} from "./data";

export interface ScenarioContext {
  dataSource: BenchDataSource;
  data: Row[];
  layout: TableLayout;
  table: HTMLElement;
}

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
 * frame times, long animation frames and (instrumented pass) DOM changes.
 */
const measured = async (
  { table }: ScenarioContext,
  options: RunOptions,
  body: () => Promise<Partial<InPageResult> & { latencies?: number[] }>,
): Promise<InPageResult> => {
  const frames = new FrameRecorder();
  const longFrames = new LongFrameObserver();
  const dom = options.instrument ? new DomChangeCounter() : undefined;

  await waitFrames(2);
  dom?.start(table);
  longFrames.start();
  frames.start();
  const start = performance.now();

  const { latencies, ...result } = await body();

  const durationMs = performance.now() - start;
  const frameTimes = frames.stop();
  return {
    ...result,
    durationMs: Math.round(durationMs),
    frames: frameStats(frameTimes),
    longFrames: longFrames.stop(),
    dom: dom?.stop(),
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
  const maxFirstRow = ctx.data.length - visibleRows - 1;
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
 * Emits row updates at a fixed rate over the top `tickingRows` rows. Every
 * update in a batch carries the batch sequence number in the seq column, a
 * MutationObserver sees when that value reaches the DOM.
 */
const tick = (
  ctx: ScenarioContext,
  config: TickConfig,
  options: RunOptions,
  seed: number,
) => {
  const { dataSource, data, table } = ctx;
  const random = createRandom(seed + 2);
  const valueColumns = (data[0]?.length ?? 0) - FIRST_VALUE_COLUMN;
  const columnsPerUpdate = Math.min(config.columnsPerUpdate, valueColumns);
  const tickingRows = Math.min(config.tickingRows, data.length);
  const body = table.querySelector(".vuuTable-body") ?? table;
  scrollContainer(table).scrollTop = 0;

  const emittedAt = new Map<number, number>();
  const commitLatencies: number[] = [];
  const paintLatencies: number[] = [];
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
      const committedAt = performance.now();
      const resolved: number[] = [];
      for (let s = highestSeen + 1; s <= seq; s++) {
        const t0 = emittedAt.get(s);
        if (t0 !== undefined) {
          commitLatencies.push(committedAt - t0);
          resolved.push(t0);
          emittedAt.delete(s);
        }
      }
      highestSeen = seq;
      afterNextPaint().then((paintedAt) => {
        for (const t0 of resolved) paintLatencies.push(paintedAt - t0);
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

    let seq = 0;
    let emitted = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const emitBatch = () => {
        const elapsed = performance.now() - start;
        if (elapsed >= config.durationMs) {
          resolve();
          return;
        }
        const due = Math.floor((config.updatesPerSecond * elapsed) / 1000);
        if (due > emitted) {
          seq += 1;
          emittedAt.set(seq, performance.now());
          for (; emitted < due; emitted++) {
            const rowIndex = Math.floor(random() * tickingRows);
            const row = data[rowIndex].slice();
            row[1] = String(seq);
            for (let c = 0; c < columnsPerUpdate; c++) {
              const col =
                FIRST_VALUE_COLUMN + Math.floor(random() * valueColumns);
              const value = row[col] as number;
              row[col] =
                Math.round(value * (1 + (random() - 0.5) * 0.002) * 100) / 100;
            }
            data[rowIndex] = row;
            dataSource.applyUpdate(row);
          }
        }
        setTimeout(emitBatch, 4);
      };
      emitBatch();
    });

    // let the last batches reach the screen
    await waitFrames(3);
    await afterNextPaint();
    onMutation(observer.takeRecords());
    observer.disconnect();
    await afterNextPaint();

    return {
      updatesEmitted: emitted,
      updateBatches: seq,
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
