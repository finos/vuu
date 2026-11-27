# vuu-ui package dependency cycles — inventory and elimination plan

Snapshot: branch `feat/data-editing` @ `74489a8a5`.

`vuu-popups`, `vuu-data-react` and `vuu-layout` are due to be removed. The inventory below
records today's graph. The plan assumes those three packages are gone, and lists where the
code that survives them can go without creating new cycles.

## How this was measured

Every `.ts/.tsx/.js/.jsx` file under `vuu-ui/packages/*` was scanned for imports of `@vuu-ui/*`
(static, dynamic, re-exports, and deep `@vuu-ui/x/src/...` paths). Each file was also run
through Babel's TypeScript transform, which drops imports that are only used as types (the
repo has no `verbatimModuleSyntax`, so the real build drops them too). That separates
**runtime** edges (code that loads at run time) from **type-only** edges.
Strongly connected components (Tarjan) were computed on four views of the graph:

| View | Cycles found |
|---|---|
| All imports, including tests | 1 SCC containing 21 of 28 packages |
| All imports, source only | 1 SCC, 20 packages |
| Runtime only, including tests | 1 SCC, 17 packages |
| **Runtime only, source only** | **2 SCCs** (below) |

The runtime/source view is what matters most: these cycles affect bundling, module
initialisation order, and build order. The type-only edges glue everything else into one
big component, so they need fixing too, but they're cheaper to fix.

## The runtime cycles today

### SCC A: `vuu-utils` ⇄ `vuu-filter-parser`

| Edge | Where | What |
|---|---|---|
| utils → filter-parser | `vuu-utils/src/datasource/BaseDataSource.ts:15`, `datasource-filter-utils.ts:6` | `parseFilter` |
| filter-parser → utils | `vuu-filter-parser/src/FilterTreeWalker.ts`, `filter-evaluation-utils.ts` | filter type guards, scaled-decimal helpers, `ColumnMap` |

`datasource-filter-utils.ts` already has a TODO to remove `parseFilter` as part of the move
to a Filter-only API. The only consumers of `BaseDataSource` / `combineFilters` /
`getDataSourceFilterColumnNames` are `vuu-data-local` and `vuu-data-remote`.

Removing the three packages does not affect this cycle.

### SCC B: 11 UI packages

`data-editing, data-react, datatable, filters, layout, notifications, popups, shell, table,
table-extras, ui-controls`

Most edges in this component point "downward" and are fine. The cycle comes from seven
upward edges:

| # | Upward edge | What is imported | After the removals |
|---|---|---|---|
| B1 | popups → ui-controls | `Icon`, `IconButton` in `PopupMenu.tsx` | **Gone** |
| B2 | ui-controls → layout | `layoutFromJson`, `useLayoutOperation`, `isUnconfiguredProperty` in `ContextPanelProvider.tsx` | **Gone**, unless `ContextPanelProvider` survives (see below) |
| B3 | ui-controls → table | `Table`, `useControlledTableNavigation`, `isNavigationKey`, `isRowSelectionKey`, `applyHighlighting` in `TablePicker`, `useTablePicker`, `TableSearch`, `SearchCell`, `ItemPicker` | **Still needed** |
| B4 | table → table-extras | `TableProvider`, `ColumnMenu`, `ColumnModel` (+ change-handler types), `useColumnActions` in `Table.tsx`, `HeaderCell.tsx`, `useTableConfig.ts`, `useTable.ts` | **Still needed** |
| B5 | table → data-react | `buildValidationChecker`, `getEditValidationRules` in `bulk-edit/*`, `useTableModel.ts` | Done as part of removing `vuu-data-react` |
| B6 | layout → data-react | `useSessionDataSource` in `useViewActionDispatcher.ts` | **Gone** |
| B7 | layout → datatable | `TreeTable` in the devtools `layout-tree-viewer.jsx` | **Gone** |

### SCC B after the removals

With `vuu-popups`, `vuu-data-react` and `vuu-layout` removed from the graph, one smaller
runtime cycle remains:

`ui-controls → table → table-extras`, with `data-editing` inside it:

```
data-editing → ui-controls
table        → ui-controls, data-editing, table-extras   (B4)
table-extras → ui-controls, data-editing, table
ui-controls  → table                                     (B3)
```

Fixing B3 and B4 removes it. What's left is one-way: `ui-controls → data-editing → table →
table-extras`.

## Type-only cycles

These don't affect runtime but they do tie the type-def build and editor tooling into one
knot, and deep `src/` imports bypass package entry points. None of them involve the three
packages being removed.

| # | Edge | Where | What |
|---|---|---|---|
| T1 | utils → table | `vuu-utils/src/column-utils.ts:19` | `TableModel` (used only as a type) |
| T2 | utils → filters (deep import) | `vuu-utils/src/filters/filter-utils.ts:16` | `SerializableFilter` from `vuu-filters/src/filter-container/...` |
| T3 | utils → data-local (deep import) | `vuu-utils/src/tree-utils.ts:5` | `IconProvider` from `vuu-data-local/src/tree-data-source/...` |
| T4 | data-types → utils | `vuu-data-types/index.d.ts:45` | `DataSourceConfigChanges`, `IEventEmitter`, `Range` |
| T5 | data-types → data-remote | `vuu-data-types/index.d.ts:53` | `PostMessageToClientCallback` |
| T6 | table-types → utils | `vuu-table-types/index.d.ts:17` | `DateTimePattern` |
| T7 | data-types ⇄ table-types ⇄ filter-types | the three `index.d.ts` files | mutual type references |

## Where the code that survives the removals should go

These are the runtime uses of the three packages by other packages. Each destination is
chosen so that it can't create a new cycle.

| From | Used by | What | Destination |
|---|---|---|---|
| `vuu-popups` | `ui-controls`, `filters` | `Portal`, `Popup`, `PopupMenu`, `Tooltip`/`useTooltip` | Fold into `vuu-ui-controls`. Popups' only upward import was `Icon`, so this can't create a cycle. |
| `vuu-data-react` | `table` | `buildValidationChecker`, `getEditValidationRules` and the edit-rule modules | `vuu-data-editing` (B5) |
| | `table-extras` | `OK`, `useLookupValues`, `useTypeaheadSuggestions`, `getTypeaheadParams` | `vuu-data-editing` or `vuu-utils`. Anything at or below `table-extras` is fine. |
| | `shell` | `useVuuTables`, `useLostConnection` | `vuu-shell`, or anything below it |
| | apps | `VuuDataSourceProvider`, `useAutoLoginToVuuServer`, `useVisualLinks`, `useVuuMenuActions`, `EditForm`, … | Decide per item. Anything that imports `table` must sit above it. |
| `vuu-layout` | `shell` | most of the API | The replacement (`grid-layout`?) must not import `table`, `table-extras`, `datatable` or `shell` |
| | `datatable` | `useViewContext`, `Flexbox`, `Stack`, `View` | Same rule |
| | `ui-controls` | `ContextPanelProvider` needs `layoutFromJson`, `useLayoutOperation` | If `ContextPanelProvider` survives, it moves to the layout replacement, not `ui-controls` |

`grid-layout` currently imports only from `vuu-ui-controls` (that dependency isn't declared
in its `package.json`) and is not on any cycle, so it fits as the layout replacement.

## Target layering (bottom → top)

```
0  protocol-types · data-types · table-types · filter-types · data-schema-types
1  vuu-utils
2  vuu-filter-parser · vuu-icons · vuu-codemirror · vuu-context-menu
3  vuu-data-local · vuu-data-remote
4  vuu-ui-controls        (absorbs vuu-popups)
5  vuu-data-editing · vuu-notifications · grid-layout
6  vuu-table
7  vuu-table-extras · vuu-filters
8  vuu-shell
9  vuu-datatable
```

A package may import only from lower layers (or the same layer, as long as it doesn't
create a cycle).

## Plan

### Phase 0: guardrail (do first)

`npm run check:cycles` runs `scripts/check-package-cycles.ts`. It runs in the
`lint-and-typecheck` job of `.github/workflows/test-ui.yml`.

- It builds the graph as described above, using Babel's TypeScript transform to drop
  type-only imports, since TS 7 has no JS API.
- It fails on any runtime cycle in package source that the allow-list in
  `scripts/package-cycles-allowlist.json` doesn't cover, and on any deep `@vuu-ui/*/src/`
  import that isn't allow-listed.
- It also fails on stale allow-list entries: an edge the graph no longer needs to break a
  cycle, or a deep import that no longer exists. So each later step must delete its entries,
  and the list only shrinks.
- `--report` additionally prints the cycles counting type-only and test imports.

The allow-list starts with the 8 runtime edges B1–B7 plus `vuu-utils → vuu-filter-parser`,
and the deep imports T2 and T3. While packages are being removed, the checker catches any
surviving code that lands in the wrong layer.

Still to do: report imports that don't match `package.json` declared deps (see Phase 5).

### Phase 1: remove `vuu-popups`, `vuu-data-react`, `vuu-layout`

Do this using the destinations in the table above. Separately from the removal itself, this
step:

- does B5 (validation code into `vuu-data-editing`)
- makes B1, B6 and B7 disappear
- makes B2 disappear, or moves `ContextPanelProvider` to the layout replacement

### Phase 2: break the remaining UI cycle (B3, B4)

| Fix | Change | Compatibility |
|---|---|---|
| B4 | Move `TableProvider`, `ColumnMenu` + `column-menu-utils`, `useColumnActions`, `ColumnModel` and the column change-handler types into `vuu-table`. Their deps (`context-menu`, `ui-controls`, `utils`) are already below `table`. | `vuu-table-extras` re-exports them |
| B3 (part) | Move `applyHighlighting` from `vuu-table` into `vuu-utils`. `ItemPicker` and `SearchCell` no longer need `vuu-table`. | `vuu-table` re-exports it |
| B3 (rest) | Move `TablePicker`/`useTablePicker` (instrument-picker) and `TableSearch`/`SearchCell` out of `vuu-ui-controls` into `vuu-table-extras`. Move `isNavigationKey`, `isRowSelectionKey` to `vuu-utils` if anything below table needs them. | Breaking: `ui-controls` can't re-export them. Update showcase and sample-apps, and add a CHANGELOG note. |

If Phase 1 is already a breaking release, ship B3 in the same release.

### Phase 3: `vuu-utils` ⇄ `vuu-filter-parser`

Recommended: **finish the Filter-only API migration** that the TODO in
`datasource-filter-utils.ts` describes. Data sources store and combine `Filter` objects, not
strings, so `parseFilter` drops out of `vuu-utils`, and the parser is used only at the edges
(filter input, persistence).

If that migration isn't close, use a stop-gap: move `BaseDataSource` and
`datasource-filter-utils` out of `vuu-utils` into a small package above `filter-parser`
(their only consumers are `vuu-data-local` and `vuu-data-remote`). Avoid moving the filter
type guards under the parser: they're used throughout `vuu-utils`.

### Phase 4: type-only edges

- **T1:** `import type { TableModel }`, and better, move the `TableModel` interface into
  `vuu-table-types`.
- **T2, T3:** move `SerializableFilter` to `vuu-filter-types` and `IconProvider`'s interface
  to `vuu-data-types`. Remove the deep `src/` imports.
- **T4–T6:** move `DataSourceConfigChanges`, `IEventEmitter`, `Range` (the interface, not the
  class), `PostMessageToClientCallback` and `DateTimePattern` declarations into the types
  packages. `vuu-utils` and `vuu-data-remote` then import them from there.
- **T7:** low priority. The three ambient `.d.ts` packages can stay mutually referential.
  Merging them is possible, but the churn isn't justified unless the type-def build requires
  it.

### Phase 5: `package.json` hygiene

After the code moves, regenerate each package's `@vuu-ui/*` dependencies from its actual
imports. Removing the three packages takes most of the stale declarations with it. These
remain, not counting declarations of the three removed packages, which go with them:

- Declared but unused: `vuu-datatable → vuu-table-extras`, `vuu-shell → vuu-table`,
  `vuu-data-remote → vuu-filter-parser`, `vuu-context-menu → vuu-utils`
- Imported but undeclared: `grid-layout → vuu-ui-controls`,
  `vuu-table-extras → vuu-context-menu`, and the types packages used across the board

Extend the Phase 0 script so declared deps must match imports. Then
`build-all-rslib`/`type-defs` can rely on a topological order.

## Suggested PR sequence

1. Phase 0 checker + allow-list
2. B4 (column menu/provider into `vuu-table`). Independent of the removals and can go any time.
3. Remove `vuu-popups` (fold into `vuu-ui-controls`). The smallest of the three removals.
4. Remove `vuu-data-react`, including B5
5. Remove `vuu-layout`, including B2/B6/B7
6. B3 (`applyHighlighting`, table-based pickers). Ship with a breaking release.
7. Phase 3 (filter-parser)
8. Phase 4 + Phase 5, and switch the checker from allow-list to "no cycles"
