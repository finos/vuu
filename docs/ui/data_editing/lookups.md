# Lookups

A lookup offers the user a choice of values held in another Vuu table, such
as a list of exchanges or currencies.

## In a table cell

Give the column a `dropdown-cell` renderer with a `lookup`:

```ts
{
  name: "exchange",
  serverDataType: "string",
  type: {
    name: "string",
    renderer: {
      name: "dropdown-cell",
      lookup: {
        labelColumn: "description",
        table: { module: "SIMUL", table: "exchanges" },
        valueColumn: "code",
      },
    },
  },
}
```

The cell's options come from `getLookupValues` in the shell context
(`useShellContext`), which loads and caches each lookup table once. For a fixed
list, use `values` instead of `lookup`, or pass
`{ renderer: "dropdown-cell", values }` in `EditableTable`'s `editable`.

## In a form

An `EditField` with `type: "dropdown"` loads its options from a lookup table:

```tsx
<EditField
  dataRow={row}
  label="Exchange"
  name="exchange"
  optionMap={{ label: "description", value: "code" }}
  table={{ module: "SIMUL", table: "exchanges" }}
  type="dropdown"
/>
```

`optionMap` names the column holding the value saved to the row (`value`), the
column shown to the user (`label`) and, optionally, `additionalFields` to keep
as `metadata` on each option. Pass a stable `optionMap` (a module constant or
memoised), because a new object reloads the options.

## Your own controls: useLookupOptions

For other controls, `useLookupOptions` subscribes to a lookup table and returns
its rows as options:

```tsx
import { useLookupOptions } from "@vuu-ui/vuu-data-editing";

const { error, loading, options } = useLookupOptions({
  filter: 'region = "EMEA"',
  maxRows: 200,
  optionMap: { label: "description", value: "code" },
  table: { module: "SIMUL", table: "exchanges" },
});
```

| Prop | Description |
| ---- | ----------- |
| `table` | The lookup table. |
| `optionMap` | Maps rows to `{ value, label, metadata }` options. |
| `columns`, `mapRow` | Instead of `optionMap`: the columns to load, and a function from a row (column name to value) to any option shape you like. |
| `filter` | A Vuu filter expression. |
| `maxRows` | Maximum number of rows loaded. Default 100. |
| `enabled` | Set to `false` to skip loading until needed. Default `true`. |

Pass stable (module constant or memoised) values for `optionMap`, `columns` and `mapRow`.

It returns `{ options, loading, error }`. Lookup tables are expected to be
small; for large tables, use a typeahead search instead.

The older `useLookupValues({ enabled, optionMap, table })` returns just the
options array and is used by `EditField`.
