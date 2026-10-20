# Vuu Table benchmarks

Performance benchmarks for the Vuu Table, run in Chromium with Playwright and the Chrome DevTools Protocol. This is phase 1 of the benchmarking design: local data scenarios, a nightly history on gh-pages, and A/B comparison between two builds. Nothing is gated on the results yet.

## Running locally

```bash
npm run bench:build                      # production build of the benchmark app
npm run bench                            # all scenarios, results in benchmarks/results/current
BENCH_SCENARIOS=tick npm run bench       # only scenarios whose id starts with "tick"
```

Always benchmark the production build. `npm run bench:dev` serves the app in development mode, for working on the scenarios themselves; in that mode React is many times slower and the runner warns that its numbers are not representative.

The host page also exposes `window.__vuuBench` for use from the DevTools console:

```js
const s = { id: "x", description: "", dataset: { rows: 100000, cols: 20, cellType: "flash", seed: 1 },
            run: { kind: "tick", updatesPerSecond: 1000, tickingRows: 30, columnsPerUpdate: 3, durationMs: 5000 } };
await __vuuBench.mount(s, { width: 1200, height: 700, rowHeight: 20, renderBufferSize: 5 });
await __vuuBench.run(s, { instrument: false, keepSamples: false });
```

## Demo mode: comparing by eye

`?demo` mounts a table with a continuous, seeded update feed and a bar showing live fps, frame p95, update-to-paint latency and updates/s, with controls for the feed. Use it to judge rendering changes the way users will see them.

```bash
BENCH_LABEL="main" npm run bench:build      # label shown in the page
```

Parameters: `rate` (updates/s, default 1000), `mode` (`steady`, or `burst` to copy the Vuu simulation's price feed), `cells` (`flash`, `plain`, `formatted`), `rows`, `cols`, `tickingRows`, `columnsPerUpdate`.

To compare two builds, serve each and open them side by side in two Chrome windows on different sites, e.g. `http://localhost:3321/?demo` and `http://127.0.0.1:3322/?demo`, so each gets its own renderer process. Set DevTools → Performance → CPU 4x slowdown in each to approximate enterprise hardware. Close the demo pages before running benchmarks, they keep ticking.

## Comparing two builds (A/B)

Build each version of the app into its own folder, then run both in one job. Iterations alternate between targets so that machine drift affects both equally.

```bash
BENCH_TARGETS="base=/path/to/main/vuu-ui/benchmarks/dist,pr=benchmarks/dist" npm run bench
npm run bench:compare -- benchmarks/results/base benchmarks/results/pr
```

The comparison reports a change only when the medians differ by more than 5% and a Mann-Whitney U test gives p < 0.05.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `BENCH_TARGETS` | `current=benchmarks/dist` | Comma-separated `label=dist folder` pairs |
| `BENCH_SCENARIOS` | all | Comma-separated scenario id prefixes |
| `BENCH_ITERATIONS` | 5 | Timing iterations per scenario and target |
| `BENCH_CPU_THROTTLE` | 4 | CPU slowdown factor (1 = none) |
| `BENCH_DPR` | 1 | Device pixel ratio, e.g. 1.25 or 1.5 for Windows scaling |
| `BENCH_GPU` | on | `off` launches Chromium with `--disable-gpu`, approximating VDI desktops |
| `BENCH_CHANNEL` | `chromium` | Playwright browser channel, e.g. `chrome` or `msedge` |
| `BENCH_HEADED` | unset | `1` runs headed |
| `BENCH_TRACE` | unset | `1` saves a Chrome trace of each instrumented run (open in DevTools or ui.perfetto.dev) |
| `BENCH_SAMPLES` | unset | `1` keeps raw frame and latency samples in the results |
| `BENCH_RESULTS` | `benchmarks/results` | Output folder |
| `BENCH_MACHINE_ID` | unset | Recorded in the results to identify the machine |

## What is measured

Each scenario runs a **timing pass** (`BENCH_ITERATIONS` times, each in a fresh page, after a warm-up run) and one **instrumented pass**. Only the timing pass's timings are reported; the instrumented pass adds a MutationObserver on the table and its DOM counts are reported.

| Metric | Source |
| --- | --- |
| `mount.*` | Data source construction, mount to first rows committed, mount to first paint |
| `frames.*` | requestAnimationFrame intervals: p50, p95, p99, % of frames over 25ms |
| `longFrames.*` | Long Animation Frames API: count and blocking time |
| `blankRowMs.*` | scroll-jump: jump until every visible row is rendered and painted |
| `updateToPaintMs.*`, `updateToCommitMs.*` | tick: update emitted until its value is in the DOM, and until that frame is painted |
| `cdp.*` | CDP `Performance.getMetrics` deltas (layouts, style recalcs, script time), heap and DOM nodes after GC |
| `dom.*`, `perUnit.*` | Instrumented pass: row mounts, element inserts, text and attribute changes, and per-row or per-update ratios |

Update-to-paint latency works by writing the update batch's sequence number into the `seq` column of every row it updates, then watching for that value in the DOM.

## Reading the numbers

Lower is better for every key metric, but totals over a run need care. `cdp.scriptMs`, `cdp.taskMs`, `cdp.recalcStyleMs` and `cdp.layoutMs` are totals for the whole run, so they grow when the table renders more often. In the tick scenarios a faster build renders more often, batching fewer updates into each render, so its totals can rise even though each frame is cheaper and updates reach the screen sooner. Dividing by the number of updates does not help, a tick run emits the same number of updates whatever the build. Compare builds on per-frame figures instead:

- `perUnit.scriptMsPerFrame`, `perUnit.styleMsPerFrame`, `perUnit.layoutMsPerFrame`: costs per rendered frame
- `perUnit.taskMsPerFrame`: main-thread time per frame, all work included; above about 16.7ms the table cannot keep up with 60fps
- `updateToPaintMs.*`, `frames.*`: what users experience

The scroll scenarios render a fixed number of frames, so their totals are comparable between builds, but the per-frame figures read the same way everywhere. Use the totals to see where time goes within one build.

Results from single nightly runs vary from run to run with the cloud runner; a change shows up reliably only when it persists across several nightly runs or in an interleaved A/B.

## Files

- `app/` the benchmark host page (rsbuild), scenario data and scenario runners
- `harness/` in-page measurement, statistics and the types shared with the runner
- `runner/` Playwright runner, scenario definitions and result summaries
- `scripts/compare.ts` A/B comparison report
- `scripts/publish-results.ts` and `site/index.html` the gh-pages history and trends page
- `.github/workflows/benchmark-ui.yml` nightly run on a fixed-size runner, publishing to `gh-pages:benchmarks/`
