import { FilterBar } from "@finos/vuu-filters";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useMemo } from "react";
import { useSchema, useTableConfig } from "../../utils";
import { DataSourceFilter } from "@finos/vuu-data-types";

let displaySequence = 1;

export const EmptyFilterBar = () => {
  const tableSchema = useSchema("instruments");
  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    console.log(`apply filter ${filter.filter}`);
  }, []);

  const handleChangeFilter = useCallback(
    (filter: Filter, newFilter: Filter) => {
      console.log("filkyterChanged", {
        filter,
        newFilter,
      });
    },
    []
  );

  return (
    <FilterBar
      FilterClauseEditorProps={{
        suggestionProvider: typeaheadHook,
      }}
      filters={[]}
      onApplyFilter={handleApplyFilter}
      onChangeFilter={handleChangeFilter}
      tableSchema={tableSchema}
    />
  );
};
EmptyFilterBar.displaySequence = displaySequence++;

export const FilterBarOneSimpleFilter = () => {
  const tableSchema = useSchema("instruments");
  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const filters: Filter[] = useMemo(
    () => [{ column: "currency", name: "Filter One", op: "=", value: "EUR" }],
    []
  );

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    console.log(`apply filter ${filter.filter}`);
  }, []);

  return (
    <FilterBar
      FilterClauseEditorProps={{
        suggestionProvider: typeaheadHook,
      }}
      filters={filters}
      onApplyFilter={handleApplyFilter}
      tableSchema={tableSchema}
    />
  );
};
FilterBarOneSimpleFilter.displaySequence = displaySequence++;

export const FilterBarMultipleFilters = () => {
  const tableSchema = useSchema("instruments");
  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const filters: Filter[] = useMemo(
    () => [
      { column: "currency", name: "Filter One", op: "=", value: "EUR" },
      { column: "exchange", name: "Filter Two", op: "=", value: "XLON" },
      { column: "ric", name: "Filter Three", op: "=", value: "AAPL" },
      { column: "ric", name: "Filter Four", op: "=", value: "AAPL" },
      { column: "ric", name: "Filter Five", op: "=", value: "AAPL" },
    ],
    []
  );

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    console.log(`apply filter ${filter.filter}`);
  }, []);

  return (
    <FilterBar
      FilterClauseEditorProps={{
        suggestionProvider: typeaheadHook,
      }}
      filters={filters}
      onApplyFilter={handleApplyFilter}
      tableSchema={tableSchema}
    />
  );
};
FilterBarMultipleFilters.displaySequence = displaySequence++;
