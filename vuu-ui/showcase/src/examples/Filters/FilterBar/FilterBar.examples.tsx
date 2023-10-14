import { FilterBar } from "@finos/vuu-filters";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSchema, useTableConfig } from "../../utils";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { Input } from "@salt-ds/core";

let displaySequence = 1;

export const DefaultFilterBar = ({
  filters: filtersProp = [],
}: {
  filters?: Filter[];
}) => {
  const [filters, setFilters] = useState<Filter[]>(filtersProp);
  const [filterStruct, setFilterStruct] = useState<Filter | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableSchema = useSchema("instruments");
  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    setFilterStruct(filter.filterStruct ?? null);
  }, []);

  const handleFiltersChanged = useCallback((filters: Filter[]) => {
    console.log("filters changed");
    setFilters(filters);
  }, []);

  useEffect(() => {
    inputRef.current?.querySelector("input")?.focus();
  }, []);

  return (
    <>
      <Input style={{ margin: 20, width: 100 }} ref={inputRef} />
      <FilterBar
        FilterClauseEditorProps={{
          suggestionProvider: typeaheadHook,
        }}
        filters={filters}
        onApplyFilter={handleApplyFilter}
        onFiltersChanged={handleFiltersChanged}
        tableSchema={tableSchema}
      />
      <div style={{ margin: 10 }}>{JSON.stringify(filterStruct, null, 2)}</div>
    </>
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
