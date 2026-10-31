# Vuu Table benchmarks

Performance benchmarks for the Vuu Table, run in Chromium with Playwright and the Chrome DevTools Protocol: local data scenarios, remote data scenarios against a mock Vuu server, a nightly history on gh-pages, and A/B comparison between two builds. Micro-benchmarks of the data layer run in node with `vitest bench`. Nothing is gated on the results yet.

## Running locally

```bash
npm run bench:build                      # production and profiling builds of the benchmark app, and the data source worker
npm run bench                            # all scenarios, results in benchmarks/results/current
BENCH_SCENARIOS=tick npm run bench       # only scenarios whose id starts with "tick"
npm run bench:micro                      # data layer micro-benchmarks, see below
```

Always benchmark the production build. `npm run bench:dev` serves the app in development mode, for working on the scenarios themselves; in that mode React is many times slower and the runner warns that its numbers are not representative.

The host page also exposes `window.__vuuBench` for use from the DevTools console:

```js
const s = { id: "x", description: "", dataset: { rows: 100000, cols: 20, cellType: "flash", seed: 1 },
            run: { kind: "tick", updatesPerSecond: 1000, tickingRows: 30, columnsPerUpdate: 3, durationMs: 5000 } };
await __vuuBench.mount(s, { width: 1200, height: 700, rowHeight: 20, renderBufferSize: 5 });
await __vuuBench.run(s, { instrument: false, keepSamples: false });
```

## Remote data

Scenarios with a `-remote` suffix mount the Table on a `VuuDataSource`, the production path: the data source's DedicatedWorker, the server proxy and the Vuu viewport protocol over a WebSocket. The runner starts a mock Vuu server (`runner/mock-vuu-server.ts`) next to the static server and passes its url to the page as `?vuuServer=`. The mock server speaks the part of the protocol the Table uses: `LOGIN`, `GET_TABLE_META`, `CREATE_VP`, `CHANGE_VP`, `CHANGE_VP_RANGE`, `REMOVE_VP`, menus and visual links (both empty), and `TABLE_ROW` messages for the rows in each viewport's range. It serves the same seeded data as the local scenarios, generated in the runner; the Vuu table name identifies the dataset (`bench_<rows>_<cols>_<seed>`).

For tick scenarios the update feed runs in the mock server, started by the page over a second WebSocket (`/control`). Each batch is one `TABLE_ROW` message with the latest value of every updated row in the viewport's range, so the update stream for a seed is the same as the local feed's. Feed modes (`run.mode`):

- `steady`: `updatesPerSecond` spread evenly, a batch every 4ms, as in the local scenarios
- `burst`: modelled on the Vuu simulation's price provider, every ticking row updates in one batch, then a random 10-400ms pause with a 100ms minimum cycle, about 215ms on average. `tick-burst-20-remote` updates all 10k rows; the server sends only those in range, about 140 rows per burst, as the Vuu server does

Update-to-paint latency is measured as for local data, from the seq column in the DOM, but batches are timestamped by the server. The page maps server time onto its own clock from the round trip with the smallest delay over the control channel, so the error is under half that round trip, well under a millisecond on one machine.

Things to keep in mind when reading remote results:

- Chrome does not apply CPU throttling to workers, and the throttling rate cannot be set on a worker target, so the worker side of the remote path always runs at full speed while the main thread is slowed by `BENCH_CPU_THROTTLE`. Main thread figures (`frames.*`, `cdp.*`, `perUnit.*`) are throttled as usual.
- The mock server runs in the runner's node process on the same machine: no network latency or server-side cost is included. It answers at once, so the figures are a lower bound on the client cost of the remote path.
- A local feed runs on the throttled main thread, a remote feed does not, so at the same rate a local run emits fewer, larger batches than a remote one. Compare latencies and per-frame costs rather than batch counts.
- `mount.firstRowsMs` for remote data includes the Table's first, empty render: it subscribes after mounting, then the rows arrive. `mount.connectMs` is the worker's WebSocket connection and login, before the data source is created.

`worker.jsHeapUsedMB` is read from the worker after a GC at the end of each run. `worker.cpuMs` is the worker's busy time from a sampling CPU profile, taken in the instrumented pass only so that profiling does not slow the worker in the timing pass. Both come over CDP (`Target.setAutoAttach`); workers have no `Performance` domain.

### Comparing local and remote data

A target's dist folder can carry an `@local` or `@remote` suffix, which runs every scenario on that data source. With one build as both targets, iterations are interleaved and the results compare like any A/B:

```bash
BENCH_TARGETS="local=benchmarks/dist@local,remote=benchmarks/dist@remote" \
  BENCH_SCENARIOS=load-100k-20,scroll-smooth-100k-20,tick-1k-20 npm run bench
npm run bench:compare -- benchmarks/results/local benchmarks/results/remote
```

When any target sets the data source, only scenarios that leave it open run, so the `-remote` twins (and the remote-only `tick-burst-20-remote`) are skipped.

### From the console

```bash
npm run bench:mock-server     # mock Vuu server on port 8091 (BENCH_MOCK_PORT)
```

Then open the app with `?vuuServer=http%3A%2F%2F127.0.0.1%3A8091%2F` and mount a scenario whose `dataset.source` is `"remote"`. Demo mode uses local data only.

## Micro-benchmarks (data layer)

`npm run bench:micro` runs `vitest bench` over `benchmarks/micro/*.bench.ts`: the data layer on its own in node, no rendering, at 100k and 1M rows of the benchmark dataset (20 columns). It takes about three minutes; pass a file name to run one file, e.g. `npm run bench:micro -- update-row`.

- `array-data-source.bench.ts`: ArrayDataSource (vuu-data-local) construction, sort on a numeric and a text column, filter, groupBy, and range changes (100 small scroll steps, 100 jumps), on a subscribed data source
- `update-row.bench.ts`: 100 row updates to the first, middle or last row, through ArrayDataSource.updateRow and the vuu-data-test Table.updateRow. Both find the row with a linear `findIndex` over the data, so the cost of an update grows with the row's position: an update to the last of 1M rows scans all 1M rows

- `server-proxy.bench.ts`: the vuu-data-remote ServerProxy and Viewport, the layer between the Vuu websocket and the UI, driven in process with no websocket or worker. `server-proxy-driver.ts` answers the proxy's server requests at once, playing a minimal Vuu server over a 10,000-row, 20-column table. Viewports show 50 rows with a buffer of 100. It covers:
  - row updates from the server: visible rows, buffered rows, and one 150-row message in order and in reverse order
  - updates spread across 10 viewports
  - scrolling one row at a time, and jumps to rows that aren't cached

The micro-benchmarks have their own vitest config (`benchmarks/micro/vitest.config.ts`) and are not part of `npm run test:vite`. They report tinybench's table (ops/s, mean, percentiles) and write no results file unless asked.

To compare before and after a change, save a run as a baseline, then compare a later run with it:

```bash
npm run bench:micro -- server-proxy --outputJson server-proxy-baseline.json
npm run bench:micro -- server-proxy --compare server-proxy-baseline.json
```

Each benchmark in the comparison shows the change as a ratio, e.g. `[1.25x] ⇑`. On one machine, two runs of the same code differ by up to about 7%, so only treat larger changes as real.

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
| `BENCH_TARGETS` | `current=benchmarks/dist` | Comma-separated `label=dist folder` pairs, a folder may end in `@local` or `@remote` (see Remote data) |
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

Each scenario runs a **timing pass** (`BENCH_ITERATIONS` times, each in a fresh page, after a warm-up run) and one **instrumented pass**. Only the timing pass's timings are reported. The instrumented pass reports counts, and its own timings are discarded:

- DOM changes, from a MutationObserver on the table
- DOM API calls anywhere in the page: the runner wraps `Document.createElement` and `createTextNode`, `Node.appendChild`, `insertBefore`, `removeChild` and `replaceChild`, `Element.setAttribute` and `removeAttribute`, `CSSStyleDeclaration.setProperty`, and the `textContent` and `nodeValue` setters with counters, installed with `page.addInitScript` before the app loads (`harness/dom-probe.ts`). React updates an existing text node through `nodeValue`
- React commits and renders, from the profiling build in `dist/profiling` (`--env-mode profiling`, which aliases `react-dom/client` to `react-dom/profiling`). A `<Profiler>` around the Table counts the commits in which the Table rendered and their render time. A minimal React DevTools hook walks each committed fiber tree and counts renders and mounts of `Row`, `TableCell` and `HeaderCell`, with their own render time, children excluded (`harness/react-probe.ts`). A target folder without `profiling/`, e.g. a build made before it existed, runs the instrumented pass on its production build and records no React counts

| Metric | Source |
| --- | --- |
| `mount.*` | Data source construction, mount to first rows committed, mount to first paint; remote: worker connection (`connectMs`) |
| `frames.*` | requestAnimationFrame intervals: p50, p95, p99, % of frames over 25ms |
| `longFrames.*` | Long Animation Frames API: count and blocking time |
| `blankRowMs.*` | scroll-jump: jump until every visible row is rendered and painted |
| `updateToPaintMs.*`, `updateToCommitMs.*` | tick: update emitted until its value is in the DOM, and until that frame is painted |
| `cdp.*` | CDP `Performance.getMetrics` deltas (layouts, style recalcs, script time), heap and DOM nodes after GC |
| `dom.*`, `perUnit.*` | Instrumented pass: row mounts, element inserts, text and attribute changes, and per-row or per-update ratios |
| `dom.api.*`, `perUnit.domApiCallsPer*` | Instrumented pass: DOM API calls by API, their total, and per frame, per update or per row scrolled |
| `react.*`, `perUnit.commitsPer*`, `perUnit.*RendersPer*` | Instrumented pass, profiling build: commits, render time (`react.renderMs`, `perUnit.reactRenderMsPerFrame`), and `react.<Component>.renders`, `.mounts`, `.selfMs` for Row, TableCell and HeaderCell, with renders per frame, per update and per row scrolled |
| `worker.*` | Remote: the data source worker's heap after GC, and (instrumented pass) its CPU time, over CDP |

Update-to-paint latency works by writing the update batch's sequence number into the `seq` column of every row it updates, then watching for that value in the DOM.

## Reading the numbers

Lower is better for every key metric, but totals over a run need care. `cdp.scriptMs`, `cdp.taskMs`, `cdp.recalcStyleMs` and `cdp.layoutMs` are totals for the whole run, so they grow when the table renders more often. In the tick scenarios a faster build renders more often, batching fewer updates into each render, so its totals can rise even though each frame is cheaper and updates reach the screen sooner. Dividing by the number of updates does not help, a tick run emits the same number of updates whatever the build. Compare builds on per-frame figures instead:

- `perUnit.scriptMsPerFrame`, `perUnit.styleMsPerFrame`, `perUnit.layoutMsPerFrame`: costs per rendered frame
- `perUnit.taskMsPerFrame`: main-thread time per frame, all work included; above about 16.7ms the table cannot keep up with 60fps
- `updateToPaintMs.*`, `frames.*`: what users experience

The scroll scenarios render a fixed number of frames, so their totals are comparable between builds, but the per-frame figures read the same way everywhere. Use the totals to see where time goes within one build.

The instrumented counts come from one run, and the tick scenarios' counts depend on how updates fall into frames, so they vary a little from run to run. They are most useful for finding where work goes: `perUnit.commitsPerFrame` above 1 means React commits more often than the screen updates, and `perUnit.tableCellRendersPerUpdate` well above `run.columnsPerUpdate` + 1 (the seq column) means cells re-render without a change of value. `react.renderMs` and `selfMs` are measured on React's profiling build in the instrumented pass, under the DOM probe, so read them as shares of render time rather than as timings.

Results from single nightly runs vary from run to run with the cloud runner; a change shows up reliably only when it persists across several nightly runs or in an interleaved A/B.

## Files

- `app/` the benchmark host page (rsbuild), scenario runners, local and remote data sources; `app/profiling.ts` is the entry point of the profiling build
- `harness/` in-page measurement, the DOM and React probes, statistics, the dataset and update generator, and the types shared with the runner
- `micro/` data layer micro-benchmarks (`vitest bench`)
- `runner/` Playwright runner, scenario definitions, result summaries, the mock Vuu server and the worker CDP probe
- `scripts/mock-vuu-server.ts` the mock Vuu server on its own
- `scripts/compare.ts` A/B comparison report
- `scripts/publish-results.ts` and `site/index.html` the gh-pages history and trends page
- `.github/workflows/benchmark-ui.yml` nightly run on a fixed-size runner, publishing to `gh-pages:benchmarks/`
