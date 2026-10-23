/**
 * Benchmark host page. Renders a single Vuu Table for a scenario and exposes
 * window.__vuuBench, which the Playwright runner (or a person, from the
 * console) uses to mount a scenario and run it.
 */
import {
  HeaderCell,
  Row as TableRow,
  Table,
  TableCell,
} from "@vuu-ui/vuu-table";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import iconsCss from "@vuu-ui/vuu-icons/index.css";
import themeCss from "@vuu-ui/vuu-theme/index.css";
// registers the vuu.price-move-background cell renderer
import "@vuu-ui/vuu-table-extras";
import { Profiler, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterNextPaint } from "../harness/measure";
import { onProfilerRender, trackComponents } from "../harness/react-probe";
import type { MountResult, Scenario, TableLayout } from "../harness/types";
import {
  BenchDataSource,
  buildColumns,
  generateRows,
  KEY_COLUMN,
  type Row,
} from "./data";
import { startDemo } from "./demo";
import {
  connectToServer,
  createRemoteDataSource,
  MockServerControl,
} from "./remote";
import {
  localFeed,
  runScenario,
  type ScenarioContext,
  type UpdateFeed,
} from "./scenarios";

for (const css of [themeCss, iconsCss]) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
}

declare const __BENCH_GIT_SHA__: string;
declare const __BENCH_PROFILING__: boolean;

// the profiling build counts Table renders with a <Profiler> and the React
// probe (harness/react-probe.ts), the production build renders the Table on
// its own
if (__BENCH_PROFILING__)
  trackComponents({ Row: TableRow, TableCell, HeaderCell });
const Profiled = ({ children }: { children: ReactNode }) =>
  __BENCH_PROFILING__ ? (
    <Profiler id="table" onRender={onProfilerRender}>
      {children}
    </Profiler>
  ) : (
    children
  );

const rootElement = document.getElementById("root") as HTMLElement;
let root: Root | undefined;
let context: ScenarioContext | undefined;
let demoContext:
  | { data: Row[]; dataSource: BenchDataSource; table: HTMLElement }
  | undefined;
let remoteDataSource: DataSource | undefined;
let control: MockServerControl | undefined;

const MOUNT_TIMEOUT_MS = 30_000;

const waitForRows = (container: HTMLElement) =>
  new Promise<number>((resolve, reject) => {
    const hasRows = () =>
      container.querySelector(`.vuuTableRow [data-field="${KEY_COLUMN}"]`)
        ?.textContent;
    if (hasRows()) {
      resolve(performance.now());
      return;
    }
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(Error(`[benchmarks] no rows after ${MOUNT_TIMEOUT_MS}ms`));
    }, MOUNT_TIMEOUT_MS);
    const observer = new MutationObserver(() => {
      if (hasRows()) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(performance.now());
      }
    });
    observer.observe(container, { childList: true, subtree: true });
  });

const mount = async (
  scenario: Scenario,
  layout: TableLayout,
): Promise<MountResult> => {
  await unmount();

  const columns = buildColumns(scenario.dataset);
  let connectMs: number | undefined;
  let dataSource: DataSource;
  let feed: UpdateFeed;
  let data: Row[] | undefined;
  let t0: number;
  let t1: number;
  if (scenario.dataset.source === "remote") {
    connectMs = await connectToServer();
    control ??= await MockServerControl.open();
    const remoteControl = control;
    feed = {
      run: (config) => remoteControl.tick(scenario.dataset, config),
    };
    // the server generates the data
    t0 = t1 = performance.now();
    dataSource = remoteDataSource = createRemoteDataSource(scenario.dataset);
  } else {
    t0 = performance.now();
    data = generateRows(scenario.dataset);
    t1 = performance.now();
    const localDataSource = new BenchDataSource({
      columnDescriptors: columns,
      data,
      keyColumn: KEY_COLUMN,
    });
    feed = localFeed(localDataSource, data);
    dataSource = localDataSource;
  }
  const t2 = performance.now();

  const config: TableConfig = { columns, rowSeparators: true };
  const rowsCommitted = waitForRows(rootElement);
  root = createRoot(rootElement);
  flushSync(() => {
    root?.render(
      <Profiled>
        <Table
          config={config}
          data-testid="bench-table"
          dataSource={dataSource}
          height={layout.height}
          renderBufferSize={layout.renderBufferSize}
          rowHeight={layout.rowHeight}
          width={layout.width}
        />
      </Profiled>,
    );
  });
  const t3 = await rowsCommitted;
  const t4 = await afterNextPaint();

  const table = rootElement.querySelector<HTMLElement>(".vuuTable");
  if (!table) throw Error("[benchmarks] table did not render");
  context = { dataset: scenario.dataset, feed, layout, table };
  if (data && dataSource instanceof BenchDataSource) {
    demoContext = { data, dataSource, table };
  }

  return {
    ...(connectMs === undefined ? undefined : { connectMs }),
    dataGenMs: Math.round(t1 - t0),
    dataSourceMs: Math.round(t2 - t1),
    firstRowsMs: Math.round(t3 - t2),
    firstPaintMs: Math.round(t4 - t2),
  };
};

const unmount = async () => {
  root?.unmount();
  root = undefined;
  context = undefined;
  demoContext = undefined;
  // a remote data source holds a server viewport until it unsubscribes
  remoteDataSource?.unsubscribe();
  remoteDataSource = undefined;
};

window.__vuuBench = {
  version: 1,
  build: {
    gitSha: __BENCH_GIT_SHA__,
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    profiling: __BENCH_PROFILING__,
  },
  mount,
  run: async (scenario, options) => {
    if (!context) throw Error("[benchmarks] mount a scenario before run");
    return runScenario(context, scenario, options);
  },
  unmount,
};

const params = new URLSearchParams(location.search);
if (params.has("demo")) {
  startDemo(params, async (scenario, layout) => {
    const result = await mount(scenario, layout);
    if (!demoContext) throw Error("[benchmarks] demo table did not mount");
    return { mount: result, context: demoContext };
  });
}
