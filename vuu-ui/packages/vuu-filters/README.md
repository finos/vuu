# Life of a filter

## Filter

Filters are applied to data and Vuu data is arranged in rows and columns. Filters are defined in terms of tests applied against column values. There are a fixed set of filter operators that the Vuu filter engine supports. A single test applied to a data column is a `FilterClause`, these are examples of `SingleValueFilterClause`

- currency = "GBP"
- price > 1000
- name starts "Nat"
- cancelled = false

Vuu also supports `MultiValueFilterClause`

- status in ["CANCELLED", "REJECTED"]

## ColumnFilter

Set `showOperatorPicker` to render a compact operator dropdown before the value.
It is opt-in; existing fixed-operator filters are unchanged.

```tsx
<ColumnFilter
  column={{ name: "price", serverDataType: "double" }}
  showOperatorPicker
  operators={["=", ">", ">=", "between-inclusive"]}
  defaultValue=""
  onCommit={handleCommit}
/>
```

`operators` replaces the default options and preserves their order. Numeric
(including scaled-decimal) and temporal columns default to `=`, `!=`, `>`, `>=`,
`<`, `<=`; text columns to `=`, `!=`, `starts`, `ends`, `contains`; boolean
columns to `=`, `!=`. Numeric and temporal filters can also opt into `between`
and `between-inclusive`. Multi-value `in` filters are not supported by this
control. Empty lists, incompatible operators, and selections outside the list
raise an error.

Use `defaultOperator` for an uncontrolled picker, or `operator` together with
`onOperatorChange(event, operator)` for a controlled picker. The initial operator
is `=` if allowed, otherwise the first option. Operator control is independent
of value control (`value` / `defaultValue`).

Selecting a different operator preserves the value and immediately commits a
populated, valid filter using the new operator. An already empty value only changes the
selection. Switching to a range retains the lower value and starts with an empty
upper value; switching back retains the lower value (and clears a filter if only
the upper value was populated). Incomplete ranges use the
existing partial-range commit behaviour. The operator picker respects
`InputProps.disabled` and `InputProps.readOnly`.

`FilterContainerColumnFilter` accepts the same picker options, manages selection
internally, and restores operators and values from externally loaded or saved
filters. A loaded operator must be included in the configured options. Clearing
an external filter resets the operator to its default; clearing a value locally
keeps the selected operator.

onCommit is a `ColumnFilterCommitHandler`

```typescript
type ColumnFilterCommitHandler = (
  column: ColumnDescriptor,
  op: FilterClauseOp | "between" | "between-inclusive",
  value: ColumnFilterValue,
) => void;
```

When used with a `FilterContainer` and `FilterProvider`, the `ColumnFilter` is wrapped with a `FilterContainerColumnFilter`. The commit is re-raised to the `FilterContainer` via `useFilterContainer.onCommit`. Here the filter will be added to a `FilterAggregator` and the `onFilterApplied` callback will be invoked, with the combined composite filter incorporating each individual clause created via individual `ColumnFilter` controls. Note, the `Filter` applied is a `FilterContainerFilter`, a slightly constrained variant of a full `Filter`, see definition below. It supports a single clause or an ANDed collection of clauses. The clauses can be the simplest type - `SingleValueFilterClause` or they can be `between` clauses for range filters.

A `ColumnFilter` can be used as a standalone control, in which case it can be used in either controlled or uncontrolled mode. It is then entirely the responsibility of the caller to translate the details from the `onCommit` callback to a useable filter and to apply that filter.

```typescript
type FilterContainerFilter =
  | SingleValueFilterClause
  | MultiClauseFilter<
      "and",
      | SingleValueFilterClause
      | MultiClauseFilter<"and", SingleValueFilterClause>
    >;

type FilterAppliedHandler = (filter: FilterContainerFilter) => void;
```

## FilterContainer

A pure container component that can be used to manage one or more `ColumnFilter` controls. The `onCommit` callback events from nested `ColumnFilter`s will be translated to a higher level commit that combines the details of individual `ColumnFilter`s to a single `Filter`. This higher level commit callback is `onFilterApplied`. Conversely, if filter details have been entirely cleared, an `onFilterCleared` callback will be invoked.

## FilterPanel, InlineFilter

These are both container controls thet employ a nested `FilterContainer` to manage a collection of `ColumnFilter`s. The `FilterPanel` renders a panel of filters, with clear and save buttons. The `InlineFilter` renders a Table Row that can be embedded within a data Table. It renders a filter per column, each filter rendered within a Table Cell.

## FilterProvider

A `FilterProvider` can be used to orchestrate a filter or filters across the entirety of an application or across a subset of an application.
It sits higher in the component hierarchy than a `FilterPanel` or `FilterContainer` and allows disparate components to collaborate over the manipulation and application of filters.

## DataSource

A `DataSource` is always the ultimate target of a filter. It is by setting the `filter` property of a `DataSource` that we actually filter data.

prop `filter` is a `DataSourceFilter`

```typescript
type VuuFilter = {
  filter: string;
};

interface SingleValueFilterClause
  name?: string
  op: SingleValueFilterClauseOp;
  column: string;
  value: string | number | boolean;
}
interface MultiValueFilterClause
  name?: string
  op: MultipleValueFilterClauseOp;
  column: string;
  values: string[] | number[] | boolean[];
}

interface MultiClauseFilter {
  name?: string
  op: FilterCombinatorOp;
  filters: Filter[];
}

type Filter = MultiClauseFilter | SingleValueFilterClause | MultiValueFilterClause;

interface DataSourceFilter {
  filter: string;
  filterStruct?: Filter;
}
```

##Saved Filters
