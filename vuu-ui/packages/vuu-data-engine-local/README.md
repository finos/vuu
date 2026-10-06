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

## Tests

```sh
npx vitest run packages/vuu-data-engine-local
```

`test/EngineDataSource.test.ts` holds the conformance tests for the engine-backed data source.
