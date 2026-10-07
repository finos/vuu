# @vuu-ui/vuu-data-engine-local

A browser-hosted Vuu data layer built on the runtime-agnostic data engine packages
[`@heswell/vuu-table`](https://www.npmjs.com/package/@heswell/vuu-table) and
[`@heswell/vuu-viewport`](https://www.npmjs.com/package/@heswell/vuu-viewport). The same
engine runs in the vuu-websocket (Bun) server.

The package runs alongside `@vuu-ui/vuu-data-test` and has the same public API. It is
meant to replace the `VuuModule` / `TickingArrayDataSource` core in that package. The
two packages don't depend on each other.

## Architecture

| Component                              | Role                                                                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Table`                                | A façade over the engine `Table` that keeps the existing `Table` API. Inserts, updates and deletes go straight to the engine. Every change notifies subscribed viewports.                                                             |
| `TableContainer`                       | A registry of tables, including join tables.                                                                                                                                                                                          |
| `EngineDataSource`                     | A `DataSource` implementation backed by an engine `Viewport`. It handles windowing, sort, filter, groupBy, selection (including select-all), freeze, base filter, link filter and permission filter. Row updates are batched per frame. |
| `ModuleDataSource`                     | Extends `EngineDataSource` with the module features: RPC and menu services, edit sessions, and visual links. `TickingArrayDataSource` is a deprecated alias.                                                                          |
| `VuuModule`                            | Creates `ModuleDataSource` instances. Row permissions are passed to the engine as a `permissionFilter` predicate.                                                                                                                     |
| `RuntimeVisualLink`                    | When the parent's selection changes, sets the child's engine link filter.                                                                                                                                                             |
| `UpdateGenerator` / `TickingGenerator` | Simulated ticking data that writes into the engine tables.                                                                                                                                                                            |

## Differences from `@vuu-ui/vuu-data-test`

- `PermissionFilteredTable` has been removed. Use the `permissionFilter` predicate on the data source instead.
- Visual links use the engine link filter, so the client no longer filters rows by selection.
- Grouped rows are only available from `getRowAtIndex` when they fall within the client range. Flat rows are available at any index.
- Re-inserting a row with an existing key updates that row.
- Table keys must not be empty.

## Running the showcase against the engine

```sh
npm run showcase:engine   # equivalent to: VUU_DATA_ENGINE=local npm run showcase
```

This aliases `@vuu-ui/vuu-data-test` to `@vuu-ui/vuu-data-engine-local` in the showcase
rsbuild config. The examples themselves don't change.

## Performance

`bench/datasource.bench.ts` compares the legacy `TickingArrayDataSource`
(`@vuu-ui/vuu-data-test`) with the engine `ModuleDataSource` on the same data and scenarios.
`@vuu-ui/vuu-data-test` is a dev dependency, used only for this comparison.

```sh
npm run bench:data-engine                    # 100k rows
BENCH_ROWS=10000 npm run bench:data-engine   # smaller run
```

`requestAnimationFrame` is made synchronous during the bench, so each timing includes delivering
rows to the client. `test/LegacyParity.test.ts` checks that both implementations give the same
results for the sort, filter and groupBy scenarios.

Mean time per operation, 100k rows, Node 24, Apple Silicon:

| Scenario                                      | legacy   | engine  | speed-up |
| --------------------------------------------- | -------- | ------- | -------- |
| create + subscribe                            | 24.1 ms  | 8.7 ms  | 2.8x     |
| sort numeric column                           | 62.1 ms  | 14.1 ms | 4.4x     |
| sort two columns                              | 64.6 ms  | 17.1 ms | 3.8x     |
| filter                                        | 5.7 ms   | 1.3 ms  | 4.3x     |
| groupBy ccy, set/clear                        | 1.6 ms   | 1.2 ms  | 1.3x     |
| groupBy ccy + exchange, set/clear             | 2.2 ms   | 2.0 ms  | 1.1x     |
| scroll, 100 range changes                     | 0.82 ms  | 0.45 ms | 1.8x     |
| 1000 ticks, random rows                       | 1543 ms  | 0.35 ms | ~4400x   |
| 1000 ticks, rows in viewport                  | 0.63 ms  | 0.10 ms | 6.6x     |
| 1000 ticks, sorted column                     | 3012 ms  | 1.9 ms  | ~1600x   |
| 1000 ticks, filtered column                   | 1903 ms  | 0.55 ms | ~3400x   |
| 1000 ticks, grouped                           | 1205 ms  | 0.39 ms | ~3100x   |
| 500 deletes + 500 inserts                     | 1628 ms  | 0.60 ms | ~2700x   |
| 500 deletes + 500 inserts, sorted             | 2564 ms  | 1.57 ms | ~1600x   |

Notes:

- The legacy update path finds each row with a linear search, so per-update cost grows with
  table size. The engine uses keyed lookup and sends each changed row once.
- On updates, legacy does not re-sort or re-filter rows. The engine does, so the tick
  comparisons understate the engine's advantage.
- Scrolling: the engine uses an array-backed row key allocator (`RowKeys`) and prunes its row
  cache incrementally, so range changes cost in proportion to the rows entering or leaving the range.

## Tests

```sh
npx vitest run packages/vuu-data-engine-local
```

`test/EngineDataSource.test.ts` holds the conformance tests for the engine-backed data source.
