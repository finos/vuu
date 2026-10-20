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
  if (result.updatesEmitted !== undefined) {
    metrics["updates.emitted"] = result.updatesEmitted;
    metrics["updates.batches"] = result.updateBatches ?? 0;
  }
  metrics.durationMs = result.durationMs;
  return metrics;
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
  const dom = instrumented?.result.dom;
  if (instrumented && dom) {
    for (const [key, value] of Object.entries(dom)) {
      summary[`dom.${key}`] = value;
    }
    const { rowsScrolled } = instrumented.result;
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
    const updates = instrumented.result.updatesEmitted;
    if (updates) {
      summary["perUnit.mutationsPerUpdate"] = round(
        (dom.textChanges + dom.attributeChanges + dom.elementsInserted) /
          updates,
        3,
      );
    }
    summary["perUnit.layoutsPerFrame"] = round(
      instrumented.cdp.layoutCount /
        Math.max(1, instrumented.result.frames.count),
      3,
    );
  }
  return summary;
};
