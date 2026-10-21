/**
 * Demo mode, for judging rendering changes by eye. Open the benchmark app
 * with ?demo to mount a table and start a continuous, seeded update feed,
 * with live frame and latency readings and controls for the feed. Run two
 * builds side by side on different sites (e.g. localhost and 127.0.0.1) so
 * each gets its own renderer process.
 *
 *   ?demo&rate=1000&mode=steady&cells=flash&rows=10000&cols=20
 */
import { afterNextPaint } from "../harness/measure";
import { percentile, round } from "../harness/stats";
import type {
  CellType,
  MountResult,
  Scenario,
  TableLayout,
} from "../harness/types";
import {
  type BenchDataSource,
  createRandom,
  FIRST_VALUE_COLUMN,
  type Row,
  SEQ_COLUMN,
} from "./data";

declare const __BENCH_LABEL__: string;

type FeedMode = "steady" | "burst";

interface DemoContext {
  dataSource: BenchDataSource;
  data: Row[];
  table: HTMLElement;
}

type Mount = (
  scenario: Scenario,
  layout: TableLayout,
) => Promise<{ mount: MountResult; context: DemoContext }>;

const WINDOW_MS = 2000;
const RATES = [0, 100, 300, 1000, 2000];

const css = `
.benchDemo { display: flex; align-items: center; gap: 16px; padding: 8px;
  font: 13px system-ui, sans-serif; color: #1d2125; background: #f2f4f6;
  border-bottom: 1px solid #d6dae0; }
.benchDemo-label { font-size: 18px; font-weight: 700; min-width: 140px; }
.benchDemo-stats { font-variant-numeric: tabular-nums; display: flex; gap: 16px; }
.benchDemo-stats b { font-weight: 600; }
.benchDemo select, .benchDemo button { font: inherit; }
`;

export const startDemo = async (params: URLSearchParams, mount: Mount) => {
  const num = (name: string, fallback: number) => {
    const value = Number(params.get(name));
    return params.has(name) && Number.isFinite(value) ? value : fallback;
  };
  let rate = num("rate", 1000);
  let mode: FeedMode = params.get("mode") === "burst" ? "burst" : "steady";
  let emitted = 0;
  let start = performance.now();
  const tickingRows = num("tickingRows", 30);
  const columnsPerUpdate = num("columnsPerUpdate", 3);
  const seed = num("seed", 20261020);
  const cellType = (params.get("cells") ?? "flash") as CellType;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  const bar = document.createElement("div");
  bar.className = "benchDemo";
  bar.innerHTML = `
    <span class="benchDemo-label"></span>
    <label>Feed <select data-control="mode">
      <option value="steady">steady</option>
      <option value="burst">bursts (like the simulation)</option>
    </select></label>
    <label>Updates/s <select data-control="rate">
      ${RATES.map((r) => `<option value="${r}">${r === 0 ? "paused" : r}</option>`).join("")}
    </select></label>
    <span class="benchDemo-stats"></span>`;
  document.body.prepend(bar);
  const label = bar.querySelector(".benchDemo-label") as HTMLElement;
  const stats = bar.querySelector(".benchDemo-stats") as HTMLElement;
  const modeSelect = bar.querySelector(
    '[data-control="mode"]',
  ) as HTMLSelectElement;
  const rateSelect = bar.querySelector(
    '[data-control="rate"]',
  ) as HTMLSelectElement;
  label.textContent = params.get("label") ?? __BENCH_LABEL__;
  document.title = `${label.textContent} – Vuu Table demo`;
  modeSelect.value = mode;
  rateSelect.value = String(rate);
  modeSelect.onchange = () => {
    mode = modeSelect.value as FeedMode;
    rateSelect.disabled = mode === "burst";
  };
  rateSelect.disabled = mode === "burst";
  rateSelect.onchange = () => {
    rate = Number(rateSelect.value);
    emitted = 0;
    start = performance.now();
  };

  const { context } = await mount(
    {
      id: "demo",
      description: "demo",
      dataset: {
        rows: num("rows", 10_000),
        cols: num("cols", 20),
        cellType,
        seed,
      },
      run: { kind: "load" },
    },
    { width: 1200, height: 640, rowHeight: 20, renderBufferSize: 5 },
  );
  const { data, dataSource, table } = context;
  const random = createRandom(seed + 2);
  const valueColumns = (data[0]?.length ?? 0) - FIRST_VALUE_COLUMN;

  // update-to-paint latency, as in the tick scenario: each batch writes its
  // sequence number into the seq column of every row it updates
  const emittedAt = new Map<number, number>();
  const latencies: Array<[time: number, ms: number]> = [];
  let highestSeen = 0;
  const observer = new MutationObserver((records) => {
    let seen = highestSeen;
    for (const record of records) {
      const node =
        record.target.nodeType === Node.TEXT_NODE
          ? record.target.parentElement
          : (record.target as Element);
      const cell = node?.closest(`[data-field="${SEQ_COLUMN}"]`);
      if (cell) seen = Math.max(seen, Number(cell.textContent));
    }
    if (seen > highestSeen) {
      const resolved: number[] = [];
      for (let s = highestSeen + 1; s <= seen; s++) {
        const t0 = emittedAt.get(s);
        if (t0 !== undefined) {
          resolved.push(t0);
          emittedAt.delete(s);
        }
      }
      highestSeen = seen;
      afterNextPaint().then((paintedAt) => {
        for (const t0 of resolved) latencies.push([paintedAt, paintedAt - t0]);
      });
    }
  });
  observer.observe(table.querySelector(".vuuTable-body") ?? table, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  let seq = 0;
  let updates = 0;
  const updateRow = (rowIndex: number) => {
    const row = data[rowIndex].slice();
    row[1] = String(seq);
    for (let c = 0; c < columnsPerUpdate; c++) {
      const col = FIRST_VALUE_COLUMN + Math.floor(random() * valueColumns);
      const value = row[col] as number;
      row[col] = Math.round(value * (1 + (random() - 0.5) * 0.002) * 100) / 100;
    }
    data[rowIndex] = row;
    dataSource.applyUpdate(row);
    updates += 1;
  };

  // steady: updates spread evenly at the selected rate
  const steady = () => {
    if (mode === "steady" && rate > 0) {
      const due = Math.floor((rate * (performance.now() - start)) / 1000);
      if (due > emitted) {
        seq += 1;
        emittedAt.set(seq, performance.now());
        for (; emitted < due; emitted++) {
          updateRow(Math.floor(random() * tickingRows));
        }
      }
    } else {
      emitted = 0;
      start = performance.now();
    }
    setTimeout(steady, 4);
  };

  // burst: like the Vuu simulation's price provider, every ticking row
  // updates together, then a random 10-400ms pause with a 100ms minimum cycle
  const burst = () => {
    let delay = 100;
    if (mode === "burst") {
      seq += 1;
      emittedAt.set(seq, performance.now());
      for (let r = 0; r < tickingRows; r++) updateRow(r);
      delay = Math.max(100, 10 + random() * 390);
    }
    setTimeout(burst, delay);
  };
  steady();
  burst();

  // frame intervals and the readout, over a rolling window
  const frames: Array<[time: number, ms: number]> = [];
  let last = performance.now();
  const onFrame = (now: number) => {
    frames.push([now, now - last]);
    last = now;
    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);

  let lastUpdates = 0;
  let lastReadout = performance.now();
  setInterval(() => {
    const now = performance.now();
    const prune = (list: Array<[number, number]>) => {
      while (list.length && list[0][0] < now - WINDOW_MS) list.shift();
      return Float64Array.from(list, ([, ms]) => ms).sort();
    };
    const frameTimes = prune(frames);
    const paint = prune(latencies);
    const fps = frameTimes.length / (WINDOW_MS / 1000);
    const updatesPerSecond =
      ((updates - lastUpdates) * 1000) / (now - lastReadout);
    lastUpdates = updates;
    lastReadout = now;
    stats.innerHTML = `
      <span><b>${Math.round(fps)}</b> fps</span>
      <span>frame p95 <b>${round(percentile(frameTimes, 95), 0)}</b> ms</span>
      <span>update to paint p50 <b>${round(percentile(paint, 50), 0)}</b> / p95 <b>${round(percentile(paint, 95), 0)}</b> ms</span>
      <span><b>${Math.round(updatesPerSecond)}</b> updates/s</span>`;
  }, 500);
};
