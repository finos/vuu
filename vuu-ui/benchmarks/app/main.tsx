/**
 * Benchmark host page. Renders a single Vuu Table for a scenario and exposes
 * window.__vuuBench, which the Playwright runner (or a person, from the
 * console) uses to mount a scenario and run it.
 */
import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import iconsCss from "@vuu-ui/vuu-icons/index.css";
import themeCss from "@vuu-ui/vuu-theme/index.css";
// registers the vuu.price-move-background cell renderer
import "@vuu-ui/vuu-table-extras";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterNextPaint } from "../harness/measure";
import type { MountResult, Scenario, TableLayout } from "../harness/types";
import {
  BenchDataSource,
  buildColumns,
  generateRows,
  KEY_COLUMN,
  type Row,
} from "./data";
import { startDemo } from "./demo";
import { runScenario, type ScenarioContext } from "./scenarios";

for (const css of [themeCss, iconsCss]) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
}

declare const __BENCH_GIT_SHA__: string;

const rootElement = document.getElementById("root") as HTMLElement;
let root: Root | undefined;
let context: ScenarioContext | undefined;

const waitForRows = (container: HTMLElement) =>
  new Promise<number>((resolve) => {
    const hasRows = () =>
      container.querySelector(`.vuuTableRow [data-field="${KEY_COLUMN}"]`)
        ?.textContent;
    if (hasRows()) {
      resolve(performance.now());
      return;
    }
    const observer = new MutationObserver(() => {
      if (hasRows()) {
        observer.disconnect();
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

  const t0 = performance.now();
  const data: Row[] = generateRows(scenario.dataset);
  const t1 = performance.now();
  const columns = buildColumns(scenario.dataset);
  const dataSource = new BenchDataSource({
    columnDescriptors: columns,
    data,
    keyColumn: KEY_COLUMN,
  });
  const t2 = performance.now();

  const config: TableConfig = { columns, rowSeparators: true };
  const rowsCommitted = waitForRows(rootElement);
  root = createRoot(rootElement);
  flushSync(() => {
    root?.render(
      <Table
        config={config}
        data-testid="bench-table"
        dataSource={dataSource}
        height={layout.height}
        renderBufferSize={layout.renderBufferSize}
        rowHeight={layout.rowHeight}
        width={layout.width}
      />,
    );
  });
  const t3 = await rowsCommitted;
  const t4 = await afterNextPaint();

  const table = rootElement.querySelector<HTMLElement>(".vuuTable");
  if (!table) throw Error("[benchmarks] table did not render");
  context = { data, dataSource, layout, table };

  return {
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
};

window.__vuuBench = {
  version: 1,
  build: {
    gitSha: __BENCH_GIT_SHA__,
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
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
    if (!context) throw Error("[benchmarks] demo table did not mount");
    return { mount: result, context };
  });
}
