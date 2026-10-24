import { median, round } from "../harness/stats";
import type { BenchRun, MetricSummary } from "../harness/types";

/** Flattens one run into dotted metric names, e.g. frames.p95, cdp.scriptMs */
export const flattenRun = (run: BenchRun): MetricSummary => {
  const metrics: MetricSummary = {};
  const add = (prefix: string, values: object | undefined) => {
    if (!values) return;
    for (const [key, value] of Object.entries(values)) {
      if (typeof value === "number") metrics[`${prefix}.${key}`] = value;
    }
  };
  const { result } = run;
  add("mount", run.mount);
  add("cdp", run.cdp);
  add("frames", result.frames);
  add("longFrames", result.longFrames);
  add("blankRowMs", result.blankRowMs);
  add("updateToPaintMs", result.updateToPaintMs);
  add("updateToCommitMs", result.updateToCommitMs);
  add("dom", result.dom);
  add("worker", run.worker);
  if (result.updatesEmitted !== undefined) {
    metrics["updates.emitted"] = result.updatesEmitted;
    metrics["updates.batches"] = result.updateBatches ?? 0;
  }
  metrics.durationMs = result.durationMs;

  // Totals over a run grow when the table renders more often, even if each
  // render is cheaper. Per-frame costs compare like for like.
  const frames = result.frames.count;
  if (frames > 0) {
    metrics["perUnit.scriptMsPerFrame"] = round(run.cdp.scriptMs / frames);
    metrics["perUnit.styleMsPerFrame"] = round(run.cdp.recalcStyleMs / frames);
    metrics["perUnit.layoutMsPerFrame"] = round(run.cdp.layoutMs / frames);
    metrics["perUnit.taskMsPerFrame"] = round(run.cdp.taskMs / frames);
  }
  return metrics;
};

const lowerFirst = (name: string) => name[0].toLowerCase() + name.slice(1);

/**
 * Counts from the instrumented run: DOM changes, DOM API calls and React
 * renders, with ratios per frame, per update (tick) and per row scrolled
 * (vertical scroll-smooth).
 */
const instrumentedSummary = (run: BenchRun): MetricSummary => {
  const summary: MetricSummary = {};
  const { dom, react, rowsScrolled, updatesEmitted: updates } = run.result;
  const frames = Math.max(1, run.result.frames.count);
  const ratios = (name: string, count: number) => {
    summary[`perUnit.${name}PerFrame`] = round(count / frames, 3);
    if (updates)
      summary[`perUnit.${name}PerUpdate`] = round(count / updates, 3);
    if (rowsScrolled) {
      summary[`perUnit.${name}PerRowScrolled`] = round(count / rowsScrolled, 3);
    }
  };

  if (dom) {
    const { api, ...counts } = dom;
    for (const [key, value] of Object.entries(counts)) {
      summary[`dom.${key}`] = value;
    }
    if (rowsScrolled) {
      summary["perUnit.rowMountsPerRowScrolled"] = round(
        dom.rowMounts / rowsScrolled,
        3,
      );
      summary["perUnit.elementsInsertedPerRowScrolled"] = round(
        dom.elementsInserted / rowsScrolled,
        3,
      );
    }
    if (updates) {
      summary["perUnit.mutationsPerUpdate"] = round(
        (dom.textChanges + dom.attributeChanges + dom.elementsInserted) /
          updates,
        3,
      );
    }
    if (api) {
      let calls = 0;
      for (const [key, value] of Object.entries(api)) {
        summary[`dom.api.${key}`] = value;
        calls += value;
      }
      summary["dom.api.total"] = calls;
      ratios("domApiCalls", calls);
    }
  }
  summary["perUnit.layoutsPerFrame"] = round(run.cdp.layoutCount / frames, 3);

  if (react) {
    summary["react.commits"] = react.commits;
    summary["react.renderMs"] = react.renderMs;
    ratios("commits", react.commits);
    summary["perUnit.reactRenderMsPerFrame"] = round(
      react.renderMs / frames,
      3,
    );
    for (const [name, c] of Object.entries(react.components)) {
      summary[`react.${name}.renders`] = c.renders;
      summary[`react.${name}.mounts`] = c.mounts;
      summary[`react.${name}.selfMs`] = c.selfMs;
      ratios(`${lowerFirst(name)}Renders`, c.renders);
    }
  }
  return summary;
};

/**
 * Medians of every metric across timing runs. DOM and per-unit counts come
 * from the instrumented run, its timings are discarded.
 */
export const summarise = (runs: BenchRun[]): MetricSummary => {
  const timing = runs.filter((r) => r.pass === "timing").map(flattenRun);
  const summary: MetricSummary = {};
  for (const key of Object.keys(timing[0] ?? {})) {
    summary[key] = round(median(timing.map((m) => m[key] ?? 0)));
  }

  const instrumented = runs.find((r) => r.pass === "instrumented");
  // worker CPU is profiled in the instrumented pass only
  const workerCpuMs = instrumented?.worker?.cpuMs;
  if (workerCpuMs !== undefined) summary["worker.cpuMs"] = workerCpuMs;
  if (instrumented) Object.assign(summary, instrumentedSummary(instrumented));
  return summary;
};
