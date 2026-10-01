# VUU vs ag-grid Performance Benchmark

## TL;DR: `vuu` vs `ag-grid-vuu`

The closest apples-to-apples pair here - same backend, same wire protocol, only the rendering grid library
differs (see [The four variants](#the-four-variants)). Numbers are medians of 10 runs; full detail in
[Results](#results) and [Statistical spread](#statistical-spread-10-runs).

**Close enough to call a wash** - gaps of 1.1-1.8x, and which one wins flips by tier/operation, not a
consistent architectural edge:
- **Sort time**: `ag-grid-vuu` faster at both tiers (50.5ms vs 90ms @100k rows; 97ms vs 161.5ms @10k rows)
- **Filter time**: `vuu` faster at both tiers (317.5ms vs 346.5ms @100k rows; 138.5ms vs 219ms @10k rows)
- **Scroll FPS**: both ~55-60fps, zero-to-one long tasks either way
- **Burst throughput**: within ~15% of each other at both tiers

**`vuu` has a real, consistent edge** - same direction across all 10 runs at both tiers, not noise:
- **Memory footprint**: `vuu` uses ~24-30% less heap at rest (9.8-9.9MB vs 13.0-13.1MB) - ag-grid's own grid
  machinery (column model, row-node tracking, the viewport-bridge adapter code) carries real overhead that
  `vuu`'s own `Table` doesn't.
- **Streaming drift**: `vuu` schedules updates more consistently under load (22.9-23.2ms avg drift vs
  29.3-46.5ms for `ag-grid-vuu`, roughly 1.3-2x tighter).

**Bottom line**: if the decision is "will users perceive a difference in sort/filter/scroll responsiveness,"
no - they're equivalent. If memory footprint (many grids on screen, long-running sessions, constrained
clients) or scheduling precision under load matters, `vuu`'s own `Table` has a measurable, repeatable
advantage. Either way, both are **far** ahead of `ag-grid-client` (the fat-client variant with no server to
lean on) - see [The finding](#the-finding) for why that gap is architectural, not about grid-library choice.

## Why this exists

VUU has its own grid component, but most teams reach for ag-grid or another third-party grid by default.
Deciding whether VUU's own grid is worth the investment deserves real evidence, not an assumption in either
direction - so this project turns "which is actually faster, and under what conditions" into a reproducible,
four-way comparison.

## The four variants

All four render the exact same 13-column instrument dataset (deterministically generated, see
[Shared harness](#shared-harness-determinism)), driven by the exact same tick/price-movement algorithm, at
the same two row-count tiers (10,000 / 100,000). Each is reachable via `?grid=<name>&rows=<10000|100000>`.

| Grid param | Renders | Data comes from | Notes |
|---|---|---|---|
| `vuu` | VUU's own `Table` component | The **real** VUU server (Scala) | `src/vuu/VuuBenchmarkPage.tsx` |
| `ag-grid-client` | ag-grid, client-side row model | This project's own Node feed-server (`mode=client`) | Browser holds the full dataset; sorts/filters/updates it itself. `src/ag-grid/AgGridClientBenchmarkPage.tsx` |
| `ag-grid-server` | ag-grid, Enterprise **Server-Side Row Model** | Same Node feed-server (`mode=server`) | Browser holds only loaded row blocks; sort/filter/paging happen server-side (a **naive, unoptimized** TS array filter+sort I wrote for this project - see [Caveats](#caveats--known-limitations)). `src/ag-grid/AgGridServerBenchmarkPage.tsx` |
| `ag-grid-vuu` | ag-grid, Enterprise **Viewport Row Model** | The **real** VUU server, same one `vuu` uses | The closest apples-to-apples comparison: identical backend and wire protocol, only the rendering library differs. Bridge code (`src/ag-grid/vuuViewportBridge.ts`) adapted from the reference implementation at [finos/vuu:showcase/ag-grid-examples](https://github.com/finos/vuu/tree/showcase/ag-grid-examples). |

Why four variants and not just `vuu` vs `ag-grid-client`: a two-way comparison conflates two separate
questions - "which grid library is faster" and "does it have a real server to lean on." `ag-grid-server` and
`ag-grid-vuu` exist specifically to separate those two questions, by holding the grid library fixed
(ag-grid) while varying only the backend it's paired with.

## Scenarios

Each runs at both row-count tiers, against all four variants (`playwright/tests/*.spec.ts`):

- **`burst-throughput`** - fire a burst of updates (100 per message) as fast as possible; mirrors ag-grid's
  own published "stress test" methodology. Measured **server/generator-side** (see caveats - this is *not*
  the same thing ag-grid's own client-side-only number measures).
- **`streaming-throughput`** - sustained 1000 updates/sec (10 messages/sec x 100 rows), mirroring ag-grid's
  own published "load test". Reports messages/rows delivered and **scheduling drift** (see
  [Streaming drift](#streaming-drift-methodology) below).
- **`filter-sort-responsiveness`** - apply a sort and a filter while a live 1000/sec stream is running (the
  realistic case for a trading blotter), with correctness assertions (not just timing) on the result.
- **`scroll-fps`** - scroll while streaming updates are live; frame rate + long-task count.
- **`memory-footprint`** - JS heap size (via CDP) at rest and after 5s of update churn.

Every scenario captures **long tasks** (via `PerformanceObserver({type:"longtask"})` - any single chunk of
main-thread JS work over 50ms, the point past which the browser can't paint or process input) and **Total
Blocking Time** (sum of each long task's duration past that 50ms threshold - the same TBT Lighthouse/Core
Web Vitals reports), alongside the scenario-specific numbers.

## Shared harness / determinism

The whole point of the comparison depends on all four variants seeing the **exact same data and the exact
same sequence of "random" updates** - otherwise a difference in numbers could just mean one side got an
easier dataset, not that it performed better.

- **`mulberry32` PRNG** (`src/harness/prng.ts`) - a seeded, deterministic pseudo-random number generator.
  Ported **bit-for-bit** to Scala (`BenchmarkPrng.scala`, verified against the JS output for multiple seeds
  before use) so the real VUU server and the JS-side feed-server generate identical datasets and identical
  tick sequences from the same seed.
- **`generateInstruments`/`mutateTick`** (`src/harness/instruments.ts`, ported to `BenchmarkInstruments.scala`)
  - the row generator and the per-tick bid/ask random-walk, call-for-call identical in both languages (same
  order of PRNG calls, same rounding).
- **`TickEngine`** (`src/harness/TickEngine.ts`) - the controlled-rate scheduler (self-correcting
  `nextExpectedTime` schedule, same shape as the Scala provider's own scheduler). Runs unchanged in the
  browser or in Node - it's what the Node feed-server uses server-side for `ag-grid-client`/`ag-grid-server`.

**Every test now resets this state before it runs** (`gotoGrid`, `playwright/tests/utils/benchmarkPage.ts`).
Both backing servers keep their dataset and tick PRNG alive for the whole process lifetime (seeded once at
startup, not per test), so without an explicit reset, every test after the first one to touch a given
table/feed in a suite run would inherit whatever an earlier test had already ticked it to - silently
breaking the "same data, same random sequence" guarantee above, and making a from-scratch `npx playwright
test` non-reproducible against a server process Playwright reused from an earlier run
(`reuseExistingServer: !process.env.CI` in `playwright.config.ts` is `true` outside CI, which a normal local
run is). The fix (`resetDataset` - `BenchmarkTickProvider.scala` / a `POST /reset?rows=N` endpoint on the
Node feed-server) regenerates the dataset from its original seed and rewinds the tick PRNG immediately
before each test's measurements begin, for every variant, every time - so a fresh checkout and a
thousandth run of the suite see the identical baseline.

## Sort/filter timing methodology

`sortMs`/`filterMs` (`filter-sort-responsiveness.spec.ts`) are measured **from dispatch until the change is
actually visible**, not until `applySort`/`applyFilter` resolves. That distinction matters because those two
calls do fundamentally different amounts of work depending on the variant: for `vuu`, `ag-grid-vuu`, and
`ag-grid-server` (SSRM), the call just enqueues a request and returns immediately - the real sort/filter and
re-render happens later, asynchronously, once the round trip completes. Only `ag-grid-client`'s client-side
row model does the work synchronously inside the call itself. Timing just the dispatch call - which an
earlier version of this suite did - compares "time to enqueue a request" against "time to actually do the
work," not a fair comparison of anything, and was very likely the single biggest inflator of the
`vuu`/`ag-grid-vuu` advantage reported in earlier results. The fix folds the existing correctness check (poll
until the visible cells reflect the new sort/filter) into the timed window itself, using a tight custom poll
cadence (starting at 1ms) rather than Playwright's default - whose cadence would otherwise quantize away
exactly the sub-100ms differences this scenario exists to measure. All four variants are now timed against
the same real-world question: how long until a user actually sees the result.

## Setup

```
npm install
npx playwright test
```

That's it - no manual server startup, no certificate/trust-store configuration, no separate build step.
Playwright's `webServer` config (`playwright.config.ts`) automatically brings up all three things the tests
need before running anything:

1. **The production app bundle** (`npm run build && npm run preview`) - tests always run against a real
   production build, not the dev server, since dev-mode React (extra checks, unminified) would skew every
   metric this suite measures.
2. **The Node feed-server** (`npm run feed-server`) - backs `ag-grid-client` and `ag-grid-server`.
3. **The real VUU server** (`npm run vuu-server` → `scripts/start-vuu-server.ps1`) - backs `vuu` and
   `ag-grid-vuu`. This is the one with the most moving parts, so it's worth explaining what the script does:
   - Uses `mvn` from `PATH` if present, otherwise downloads a private copy of Apache Maven into
     `scripts/.tools/` (gitignored) - nothing is installed system-wide.
   - Runs `mvn install` on the `price` and `main` Scala modules in the parent `vuu-repo/` checkout, then
     starts `BenchmarkMain` (a minimal server entry point - see
     [Why a separate BenchmarkMain](#why-a-separate-benchmarkmain) - not the full `SimulMain` demo server).
   - Sets `-Djavax.net.ssl.trustStoreType=Windows-ROOT` for the Maven build step. **Why this is needed at
     all**: on a machine where HTTPS traffic is intercepted for inspection (a corporate proxy or antivirus
     doing TLS inspection, common on managed Windows machines), the JVM's own bundled trust store won't
     trust the intercepting certificate even though Windows itself does - which is why a browser or `npm`
     works fine but a plain `mvn` or `curl` call can fail TLS validation. Pointing the JVM at the Windows
     certificate store directly (the same store the browser and npm already trust) fixes this generically,
     with no certificate export/import and no change to anyone's antivirus/proxy configuration required.
   - First run on a machine with an empty local Maven cache (`~/.m2`) downloads every dependency the server
     modules need and can take several minutes; subsequent runs reuse that cache and take well under a
     minute.

### Running the tests

**Headless, all 40 tests, from the terminal:**

```
npx playwright test
```

**In Playwright's UI mode** (recommended for exploring a single scenario or debugging a failure - gives you
a timeline with DOM snapshots, network/console tabs, and a locator picker for every step):

```
npx playwright test --ui
```

Run this from `sample-apps/perf-benchmark` specifically, not from `vuu-ui` or the repo root - the monorepo
has more than one `playwright.config.ts` (the root one runs an unrelated Salt/showcase component-test
suite), and running from the wrong directory will silently pick up the wrong one, with its own unrelated
webServers. If you land on a blank "Loading..." screen with a different app's URL in the error, that's the
tell.

Once it's open, the left-hand test list lets you run everything, a single file, or a single test; the
filter box narrows by name (e.g. type `100000` to only run the 100k-row tier, or `ag-grid-vuu` to only run
that variant). A watch toggle re-runs on file save, useful when iterating on a test or a page component.

**Expect this to take a while, especially the first time:**

- **Cold start** (nothing already running): the VUU server's Maven build alone can take several minutes on
  an empty `~/.m2` cache (see above), on top of which the frontend build and feed-server need to start too.
  Playwright runs the three `webServer` entries in parallel, but UI mode's output can make this look stuck -
  `start-vuu-server.ps1` runs Maven with `-q` (quiet), so **it produces zero console output for the entire
  build**, success or failure, until it either starts `BenchmarkMain` or errors out. A silent gap after the
  frontend's build-warning output is normal, not a hang - give it a few minutes before assuming something's
  wrong.
- **Warm start** (servers already running from a previous invocation, `reuseExistingServer` kicks in): the
  full 40-test run itself still takes **3.5-6.5 minutes**, not seconds - every test resets the shared
  server-side dataset before it runs (see [Shared harness / determinism](#shared-harness--determinism)),
  which for the 100k-row VUU-backed tests means pushing 100,000 row updates through the table before the
  test's own measurement even starts.
- Running a single test or file via `--ui`'s filter is much faster than a full run, since it skips the
  other 39 tests' setup/teardown - use that instead of a full run when you just want to check one thing.

Results are written to `playwright/results/*.json`, keyed by `<grid>-<rowCount>rows`, so re-running only
overwrites the tiers actually re-run.

## Results

**10 full runs (400/400 tests passing)**, not one - see [Statistical spread](#statistical-spread-10-runs)
below for why a single sample isn't trustworthy enough to report on its own, especially for sort/filter/burst
numbers. The tables below report the **median** of those 10 runs; bold marks the best median in each row.
All ten runs used the automated setup above (dataset reset before every test - see
[Shared harness / determinism](#shared-harness--determinism) - and no servers started by hand beyond the
three `webServer` entries Playwright itself manages).

### 100,000 rows

| Metric | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Sort time | 90ms | 1994ms | 183ms | **50.5ms** |
| Filter time | **318ms** | 2285ms | 515ms | 347ms |
| Scroll FPS (streaming) | 59.8 | 44.0 (15 long tasks) | **60.4** | 60.2 |
| Streaming avg drift | 23.2ms | 7.5ms | **7.5ms** | 46.5ms |
| Memory at rest | **9.8MB** | 59.0MB | 12.3MB | 13.0MB |
| Memory growth after 5s churn | **38.7KB** | 1.36MB | 284.3KB | 103.1KB |
| Burst throughput | 119,115/s | **222,039/s** | 152,758/s | 103,191/s |

### 10,000 rows

| Metric | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Sort time | 161.5ms | 304.5ms | 190ms | **97ms** |
| Filter time | **138.5ms** | 564.5ms | 608ms | 219ms |
| Scroll FPS | 60.0 | 60.0 | **60.4** | 55.2 |
| Streaming avg drift | 22.9ms | **7.1ms** | 7.2ms | 29.3ms |
| Memory at rest | **9.9MB** | 16.6MB | 12.3MB | 13.1MB |
| Burst throughput | 95,439/s | **271,710/s** | 242,582/s | 91,614/s |

The streaming-drift and scroll-fps "best" calls above are within a few percent of the next value and
shouldn't be read as a meaningful win - see the per-metric ranges in
[Statistical spread](#statistical-spread-10-runs). Sort/filter and burst throughput, by contrast, have gaps
far wider than their run-to-run spread, so those rankings are solid.

### The finding

**Sort/filter times for `vuu` and `ag-grid-vuu` are no longer near-instant once measured correctly (see
[Sort/filter timing methodology](#sortfilter-timing-methodology)) - but the core result survives the
correction.** At 100k rows, `vuu` and `ag-grid-vuu` sort in 50-90ms and filter in the 320-350ms range;
`ag-grid-client` takes 1994ms and 2285ms respectively - still a **6-22x** gap, just not the ~500x the old
(dispatch-only) measurement implied. `ag-grid-server` lands in between (183ms sort, 515ms filter) but
noticeably closer to `ag-grid-client`'s end of the range than to `vuu`'s, so "give ag-grid a server and most
of the gap closes" holds at the 100k tier, though less completely than previously reported.

**At 10k rows the picture is messier, and that's worth stating plainly rather than smoothing over.**
`ag-grid-server`'s filter (608ms median) is actually the *slowest* of all four variants - slower than
`ag-grid-client`'s in-browser filter (564.5ms), despite not holding the data client-side at all. Its sort
(190ms) is still faster than `ag-grid-client`'s (304.5ms), but the filter result is a genuine case where the
"server-backed beats client-only" framing from the 100k tier doesn't transfer down to 10k rows - most likely
because at this row count, a network round trip plus the Node feed-server's unoptimized linear filter
(see [Caveats](#caveats--known-limitations)) costs more than ag-grid-client's native API just needed anyway.

Both `vuu` and `ag-grid-vuu` hold ~60fps with a `longTaskCount` **median** of 0 at both tiers across all 10
runs - an isolated single long task shows up in one run out of ten for `vuu` (both tiers) and for
`ag-grid-vuu` (10k only), never more than that - while `ag-grid-client` shows real, consistent main-thread
blocking at 100k rows (7-22 long tasks in *every single one* of the 10 runs, never zero). That part of the
original finding - VUU-backed variants keep the main thread free regardless of how long the round trip
itself takes - reproduces with just one minor caveat (an occasional single long task, not the "zero,
always" the original phrasing implied), and wasn't affected by the timing-methodology fix at all, since it's
measured independently via the `longtask` PerformanceObserver, not via `sortMs`/`filterMs`.

So the honest framing, updated: it's still substantially a **thin-client-with-a-smart-server vs. fat-client**
difference, not a VUU-vs-ag-grid one - but the margin is single-digit-to-low-double-digit, not the
two-to-three-orders-of-magnitude gap this README previously reported, and it doesn't hold uniformly at every
row-count tier and every operation (10k-row filtering being the clearest counterexample).

## Statistical spread (10 runs)

Min / median / mean / max across all 10 runs, for the metrics most affected by this round of fixes. Same
row-count split and the same variant-column order as the [Results](#results) tables above, so the two sets
read the same way - each table below is just a metric's Results row, expanded into its own Min/Median/Mean/
Max rows instead of collapsing straight to the median. **Bold marks the best value in each row** (lower is
better for sort/filter time, higher for burst throughput) - exactly the same convention the Results tables
use, just applied once per statistic instead of once per metric. Full per-run data lives in
`playwright/results-snapshots/run-{1..10}/`; the aggregation isn't a committed script, but the method is:
for each `<grid>-<rowCount>rows` key, collect each numeric field across all 10 run JSONs and take
min/median/mean/max.

**Sort time (ms) - 100,000 rows**

| Stat | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Min | 72 | 1905 | 157 | **41** |
| Median | 90 | 1994 | 182.5 | **50.5** |
| Mean | 95.4 | 2229 | 191.7 | **51.3** |
| Max | 149 | 3499 | 253 | **67** |

**Sort time (ms) - 10,000 rows**

| Stat | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Min | 139 | 193 | 150 | **71** |
| Median | 161.5 | 304.5 | 190 | **97** |
| Mean | 162.8 | 302.3 | 188.6 | **104.7** |
| Max | 198 | 427 | 219 | **156** |

**Filter time (ms) - 100,000 rows**

| Stat | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Min | 289 | 1951 | 393 | **286** |
| Median | **317.5** | 2285 | 515 | 346.5 |
| Mean | **362** | 2275 | 568.7 | 379.7 |
| Max | 629 | 2580 | 1146 | **579** |

Filter time at 100k rows is the one case where the row-by-row winner splits across variants: `vuu` has the
better median and mean, but `ag-grid-vuu` edges it on min and max - close enough (289ms vs 286ms min; 629ms
vs 579ms max) that it's a wash, not a real difference.

**Filter time (ms) - 10,000 rows**

| Stat | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Min | **113** | 520 | 558 | 173 |
| Median | **138.5** | 564.5 | 608 | 219 |
| Mean | **139.5** | 577.1 | 611.5 | 216.8 |
| Max | **175** | 679 | 661 | 286 |

**Burst throughput (updates/sec) - 100,000 rows** - the widest spread of any metric, consistent with the
[100k-tier caveat](#caveats--known-limitations) about this window being too short to be stable:

| Stat | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Min | 108,696 | 109,277 | **119,453** | 79,365 |
| Median | 119,115 | **222,039** | 152,758 | 103,191 |
| Mean | 124,054 | **223,942** | 158,665 | 105,372 |
| Max | 151,515 | **317,265** | 188,237 | 138,889 |

**Burst throughput (updates/sec) - 10,000 rows**

| Stat | vuu | ag-grid-client | ag-grid-server | ag-grid-vuu |
|---|---|---|---|---|
| Min | 75,643 | 114,508 | **131,483** | 78,989 |
| Median | 95,439 | **271,710** | 242,582 | 91,614 |
| Mean | 101,193 | **246,053** | 244,381 | 93,580 |
| Max | 122,100 | 292,553 | **333,826** | 124,533 |

Burst throughput's row-by-row winner splitting between `ag-grid-client` (median/mean, and max at 100k) and
`ag-grid-server` (min, and max at 10k) is exactly the instability the win-count check above already caught
directly (5/10 vs 5/10 at the 10k tier) - the split rows here are a symptom of the same coin flip, not a new
finding.

Burst throughput's per-number winner splitting between `ag-grid-client` (median/mean, and max at 100k) and
`ag-grid-server` (min, and max at 10k) is exactly the instability the win-count check above already caught
directly (5/10 vs 5/10 at the 10k tier) - the split columns here are a symptom of the same coin flip, not a
new finding.

Checked directly, not just inferred from the ranges above: counting wins per run across all 10, at the 10k
tier `ag-grid-client` beat `ag-grid-server` exactly **5 times out of 10** - a genuine coin flip, not noise in
a trailing digit. At the 100k tier `ag-grid-client` won **9 out of 10** - stable there. The 10k-tier
instability specifically is why that row's bold marking shouldn't be read as a settled ranking.

## Streaming drift methodology

"Drift" measures whether update delivery is keeping pace with the requested rate (1000/sec here), not
falling behind under load. It's tracked **per message** on both sides using the same self-correcting
schedule: each scheduled tick checks how late it fired vs. when it was due, and both the sum
(`totalDriftMs`) and worst single tick (`maxDriftMs`) are reported.

An earlier version of this metric for the two VUU-backed variants (`vuu`, `ag-grid-vuu`) computed a single
end-of-window snapshot client-side instead of true per-message sampling (VUU's RPC surface only exposed
cumulative counters, not a timing trace). That was fixed by adding the same per-message drift tracking to
`BenchmarkTickProvider.scala` directly (`totalDriftMs`/`maxDriftMs` now come from the server's own
authoritative counters via `getStreamStats`, computed with `System.nanoTime()` rather than
`currentTimeMillis()`, whose resolution can be as coarse as ~15ms on Windows).

The JVM-backed variants (`vuu`, `ag-grid-vuu`) show *higher* average drift (23-47ms median, across 10 runs -
see [Statistical spread](#statistical-spread-10-runs)) than the Node-backed ones (~7ms). **This was checked, not assumed**: an isolated test of raw scheduling precision with zero
actual work (`Thread.sleep` vs `setTimeout`, both self-correcting, no I/O) showed the JVM is actually *more*
precise in isolation (3.1ms avg) than Node (7.4ms avg) - the opposite of what a "Java's timer resolution is
worse" theory would predict. So the extra drift in the real benchmark isn't raw timer imprecision; it's most
likely the real per-tick work (100 `table.processUpdate` calls plus VUU's join-table/viewport dispatch)
combined with a live Chromium instance sharing the CPU on the same machine - neither of which the isolated
test includes. Long task counts stayed at zero throughout for both JVM-backed variants, so whatever this is,
it isn't costing dropped frames.

## Why a separate `BenchmarkMain`

Initially the benchmark tables were added to the existing `SimulMain` (which the wider VUU showcase/demo
already uses). That crashed under sustained load with `OutOfMemoryError`, traced to unrelated demo modules
(baskets, permissions, metrics, editable sessions) all running their own background tick loops and
reference data in the same JVM heap, competing with the benchmark's own 100k-row table. `BenchmarkMain`
loads *only* `BenchmarkPriceModule` - smaller footprint, and no unrelated background noise contaminating the
measurements themselves. It also runs with a modest, explicit `-Xmx4096m` rather than `SimulMain`'s
hardcoded `-Xmx10G`, which had been crashing the JVM outright by exceeding the machine's page file.

## Caveats / known limitations

- **`ag-grid-server`'s sort/filter is a naive, unoptimized implementation** (`feed-server/server.ts`:
  `Array.filter` + `Array.sort` on every request, single-threaded, sharing the Node process with ticking and
  WebSocket I/O for every connected client) written for this project, not production-grade backend code.
  Its numbers should be read as "a server-backed model beats a client-only one," not as a tight estimate of
  what a real SSRM backend would achieve.
- **Burst throughput is measured server/generator-side on all four variants** (time to generate + dispatch
  the burst, not time for the browser to finish absorbing it, since WebSocket sends are fire-and-forget).
  That's symmetric and fair across variants, but isn't the same thing ag-grid's own published 177,935/sec
  figure measures (a synchronous in-process call, no network at all). It's also not perfectly symmetric
  between our own variants: the Node-backed timer (`TickEngine.fireBurst`) uses `performance.now()`
  (sub-millisecond), while the JVM-backed one (`BenchmarkTickProvider.fireBurst`) uses
  `System.currentTimeMillis()` (millisecond resolution). At the 100k-row tier, where a burst finishes in
  tens of milliseconds, that's a real source of quantization noise on `vuu`/`ag-grid-vuu`'s burst numbers
  specifically - unlike the streaming-drift metric, which was already moved to `nanoTime()` for exactly this
  reason (see [Streaming drift methodology](#streaming-drift-methodology)).
- **The 100k-row burst-throughput window is short enough to be dominated by noise, not steady-state
  throughput.** `TOTAL_UPDATES_BY_ROW_COUNT` (`burst-throughput.spec.ts`) fires only 5,000 updates at the
  100k tier, versus 100,000 at the 10k tier - a deliberate tradeoff to keep total suite runtime down, but it
  means the 100k burst completes in roughly 30-60ms. At that duration, JIT warm-up and the timer-resolution
  issue above aren't a small correction on top of a stable measurement - they're a large fraction of the
  measurement itself. This was confirmed empirically across all 10 runs behind the tables above, not just
  theorized: at the 10k tier, `ag-grid-client` beat `ag-grid-server` in exactly **5 of 10 runs** - a literal
  coin flip, not noise in a trailing digit (see [Statistical spread](#statistical-spread-10-runs)). At the
  100k tier the same pair is far more stable (`ag-grid-client` won 9 of 10), so the instability is specific
  to the 10k tier, not burst-throughput in general. Read every burst-throughput number in this README as
  "same order of magnitude, ranking not fully stable at the 10k tier."
- **Reported figures are the median of 10 runs**, not a single sample - see
  [Statistical spread](#statistical-spread-10-runs) for the full min/mean/max per metric. This replaced an
  earlier single-sample methodology specifically because sort/filter/burst numbers moved enough between runs
  to change which variant looked best; 10 runs isn't a rigorous 20+ iteration statistical treatment, but it's
  enough to tell a real gap from noise for every metric except burst throughput at the 10k tier (above).
- **No automated test guards the PRNG/tick-generation parity** between `prng.ts`/`instruments.ts` and their
  Scala ports, despite both files' comments asserting bit-for-bit equivalence. That parity was verified by
  hand (side-by-side output comparison across multiple seeds) rather than by a committed regression test, so
  a future edit to either side could silently break it without anything failing.
- **The automated VUU-server setup is Windows-only** (`scripts/start-vuu-server.ps1` is invoked via
  `powershell`, not `pwsh`). `npm install && npx playwright test` works unattended on Windows; on macOS/
  Linux the `vuu-server` webServer entry will fail and needs a portable rewrite first.
- **Only 13 columns tested.** Wide-table scenarios (50-100+ columns, closer to a real analytics-heavy
  trading blotter) are untested.
- **No horizontal scroll, pinned rows/columns, or row-count tiers above 100k** - deliberately deferred
  rather than omitted by oversight.
- **This suite deliberately tests what a well-known public ag-grid benchmark (1771 Technologies,
  comparing 6 grids) explicitly excludes**: "server-side processing and backend-assisted optimizations are
  intentionally excluded" in that article. `ag-grid-server`/`ag-grid-vuu` exist specifically to cover that
  gap - so this isn't redundant with existing public benchmarks, it's complementary to them.

## Key files

**JS/TS** (`sample-apps/perf-benchmark/`):
- `src/harness/` - shared, grid-agnostic: `prng.ts`, `instruments.ts`, `TickEngine.ts`, `frameMetrics.ts`, `types.ts` (the `BenchmarkApi` contract every variant implements on `window.__benchmark`)
- `src/vuu/VuuBenchmarkPage.tsx` - the `vuu` variant
- `src/ag-grid/AgGridClientBenchmarkPage.tsx`, `AgGridServerBenchmarkPage.tsx`, `AgGridVuuBackendPage.tsx`, `vuuViewportBridge.ts`, `columnDefs.ts`
- `feed-server/server.ts` - the Node WS server backing the two non-VUU ag-grid variants
- `scripts/start-vuu-server.ps1` - builds and launches the real VUU server; see [Setup](#setup)
- `playwright/tests/*.spec.ts` - the five scenarios; `playwright/tests/utils/` - shared test helpers (`gotoGrid`, `getCell`, CDP memory sampling, result recording)

**Scala** (`vuu-repo/example/`):
- `price/src/main/scala/org/finos/vuu/core/module/price/BenchmarkPrng.scala`, `BenchmarkInstruments.scala`, `BenchmarkTickProvider.scala`, `BenchmarkPriceService.scala`, `BenchmarkPriceModule.scala`
- `main/src/main/scala/org/finos/vuu/BenchmarkMain.scala`
