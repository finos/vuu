import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { Input } from "@salt-ds/core";
import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { ActiveItemChangeHandler } from "packages/vuu-layout/src";

let displaySequence = 1;

export const DefaultFilterBar = ({
  filters: filtersProp = [],
  onApplyFilter,
  onFiltersChanged,
  style,
}: Partial<FilterBarProps>) => {
  const [filters, setFilters] = useState<Filter[]>(filtersProp);
  const [filterStruct, setFilterStruct] = useState<Filter | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableSchema = getSchema("instruments");
  const { typeaheadHook } = vuuModule("SIMUL");

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      onApplyFilter?.(filter);
      setFilterStruct(filter.filterStruct ?? null);
      console.log(`handleApplyFilter ${JSON.stringify(filter)}`);
    },
    [onApplyFilter]
  );

  const handleFiltersChanged = useCallback(
    (filters: Filter[]) => {
      onFiltersChanged?.(filters);
      console.log(`filters changed ${JSON.stringify(filters, null, 2)}`);
      setFilters(filters);
    },
    [onFiltersChanged]
  );

  const handleChangeActiveFilterIndex = useCallback<ActiveItemChangeHandler>(
    (index) => {
      console.log(`filters changed ${index.join(",")}`);
    },
    []
  );

  useEffect(() => {
    inputRef.current?.querySelector("input")?.focus();
  }, []);

  return (
    <div style={style}>
      <Input
        style={{ margin: 20, width: 100 }}
        ref={inputRef}
        data-testid="pre-filterbar"
      />
      <FilterBar
        FilterClauseEditorProps={{
          suggestionProvider: typeaheadHook,
        }}
        data-testid="filterbar"
        filters={filters}
        onApplyFilter={handleApplyFilter}
        onChangeActiveFilterIndex={handleChangeActiveFilterIndex}
        onFiltersChanged={handleFiltersChanged}
        tableSchema={tableSchema}
      />
      <div style={{ margin: 10 }}>{JSON.stringify(filterStruct, null, 2)}</div>
      <Input style={{ margin: 20, width: 100 }} />
    </div>
  );
};
DefaultFilterBar.displaySequence = displaySequence++;

export const FilterBarOneSimpleFilter = () => {
  return (
    <DefaultFilterBar
      filters={[
        { column: "currency", name: "Filter One", op: "=", value: "EUR" },
      ]}
    />
  );
};
FilterBarOneSimpleFilter.displaySequence = displaySequence++;

export const FilterBarMultipleFilters = () => {
  return (
    <DefaultFilterBar
      filters={[
        { column: "currency", name: "Filter One", op: "=", value: "EUR" },
        { column: "exchange", name: "Filter Two", op: "=", value: "XLON" },
        { column: "ric", name: "Filter Three", op: "=", value: "AAPL" },
        { column: "ric", name: "Filter Four", op: "=", value: "AAPL" },
        { column: "ric", name: "Filter Five", op: "=", value: "AAPL" },
      ]}
    />
  );
};
FilterBarMultipleFilters.displaySequence = displaySequence++;
