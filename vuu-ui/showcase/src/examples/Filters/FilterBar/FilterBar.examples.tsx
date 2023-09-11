import { FilterBar } from "@finos/vuu-filters";
import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useRef } from "react";
import { useSchema, useTableConfig } from "../../utils";
import { DataSourceFilter } from "@finos/vuu-data-types";

let displaySequence = 1;

export const DefaultFilterBar = ({
  filters: filtersProp = [],
}: {
  filters?: Filter[];
}) => {
  const filtersRef = useRef<Filter[]>(filtersProp);
  const tableSchema = useSchema("instruments");
  const { typeaheadHook } = useTableConfig({
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleAddFilter = useCallback((filter: Filter) => {
    filtersRef.current.push(filter);
    console.log(`add`);
  }, []);

  const handleDeleteFilter = useCallback(
    (/*filter: Filter*/) => {
      console.log(`delete filter `);
    },
    []
  );

  const handleRemoveFilter = useCallback(
    (/*filter: Filter*/) => {
      console.log(`remove filter `);
    },
    []
  );

  const handleRenameFilter = useCallback((filter: Filter, name: string) => {
    filtersRef.current = filtersRef.current.map((f) =>
      f === filter ? { ...f, name } : f
    );
  }, []);

  const handleApplyFilter = useCallback((filter: DataSourceFilter) => {
    console.log(`apply filter ${filter.filter}`);
  }, []);

  const handleChangeFilter = useCallback((filter: Filter) => {
    filtersRef.current = filtersRef.current.map((f) =>
      f === filter ? filter : f
    );
  }, []);

  return (
    <FilterBar
      FilterClauseEditorProps={{
        suggestionProvider: typeaheadHook,
      }}
      filters={filtersRef.current}
      onAddFilter={handleAddFilter}
      onApplyFilter={handleApplyFilter}
      onChangeFilter={handleChangeFilter}
      onDeleteFilter={handleDeleteFilter}
      onRemoveFilter={handleRemoveFilter}
      onRenameFilter={handleRenameFilter}
      tableSchema={tableSchema}
    />
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
