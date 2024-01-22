import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import type { Filter } from "@finos/vuu-filter-types";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import {
  Input,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";
import { getSchema, vuuModule } from "@finos/vuu-data-test";
import type { ActiveItemChangeHandler } from "@finos/vuu-ui-controls";

let displaySequence = 1;

const lastUpdatedColumn = {
  name: "lastUpdated",
  serverDataType: "long",
  type: "date/time",
} as const;

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
  const columns = [...tableSchema.columns, lastUpdatedColumn];
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
        tableSchema={{ ...tableSchema, columns }}
        columnDescriptors={columns}
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

export const FilterBarOneMultiValueFilter = () => {
  return (
    <DefaultFilterBar
      filters={[
        {
          column: "currency",
          name: "Filter One",
          op: "in",
          values: ["CAD", "EUR"],
        },
      ]}
    />
  );
};
FilterBarOneMultiValueFilter.displaySequence = displaySequence++;

export const FilterBarMultipleFilters = () => {
  return (
    <DefaultFilterBar
      filters={[
        { column: "currency", name: "Filter One", op: "=", value: "EUR" },
        { column: "exchange", name: "Filter Two", op: "=", value: "XLON" },
        {
          column: "ric",
          name: "Filter Three",
          op: "in",
          values: ["AAPL", "BP.L", "VOD.L"],
        },
        {
          column: "ric",
          name: "Filter Four",
          op: "in",
          values: ["AAPL", "BP.L", "VOD.L", "TSLA"],
        },
        {
          op: "and",
          name: "Filter Five",
          filters: [
            { column: "ric", op: "in", values: ["AAPL", "VOD.L"] },
            { column: "exchange", op: "=", value: "NASDAQ" },
            { column: "price", op: ">", value: 1000 },
          ],
        },
      ]}
    />
  );
};
FilterBarMultipleFilters.displaySequence = displaySequence++;

export const FilterBarMultipleFilterSets = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handleChangeFilterSet = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const { value } = evt.target as HTMLButtonElement;
      const index = parseInt(value);
      setSelectedIndex(index);
    },
    []
  );
  const filters = useMemo<Filter[]>(() => {
    if (selectedIndex === 0) {
      return [
        { column: "currency", name: "Filter One", op: "=", value: "EUR" },
        { column: "exchange", name: "Filter Two", op: "=", value: "XLON" },
        {
          column: "ric",
          name: "Filter Three",
          op: "in",
          values: ["AAPL", "BP.L", "VOD.L"],
        },
      ];
    } else if (selectedIndex === 1) {
      return [
        {
          column: "ric",
          name: "Filter Four",
          op: "in",
          values: ["AAPL", "BP.L", "VOD.L", "TSLA"],
        },
        {
          op: "and",
          name: "Filter Five",
          filters: [
            { column: "ric", op: "in", values: ["AAPL", "VOD.L"] },
            { column: "exchange", op: "=", value: "NASDAQ" },
            { column: "price", op: ">", value: 1000 },
          ],
        },
      ];
    } else {
      throw Error(`selectedIndex ${selectedIndex} out of range`);
    }
  }, [selectedIndex]);

  console.log({ filters });
  return (
    <div>
      <ToggleButtonGroup value={selectedIndex} onChange={handleChangeFilterSet}>
        <ToggleButton value={0}>Filter Set 1 (three filters)</ToggleButton>
        <ToggleButton value={1}>Filter Set 2 (two filters)</ToggleButton>
      </ToggleButtonGroup>
      <DefaultFilterBar filters={filters} />
    </div>
  );
};
FilterBarMultipleFilterSets.displaySequence = displaySequence++;
