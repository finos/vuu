import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import type { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import { Input, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { getSchema, vuuModule } from "@finos/vuu-data-test";

const lastUpdatedColumn = {
  name: "lastUpdated",
  serverDataType: "long",
  type: "date/time",
} as const;

const DefaultFilterBarCore = ({
  filterState,
  onApplyFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  style = { left: 0, position: "absolute", top: 0 },
}: Partial<FilterBarProps>) => {
  const [filterStruct, setFilterStruct] = useState<Filter | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableSchema = useMemo(() => getSchema("instruments"), []);
  const columns = useMemo(
    () => [...tableSchema.columns, lastUpdatedColumn],
    [tableSchema]
  );
  const { typeaheadHook } = vuuModule("SIMUL");

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      onApplyFilter?.(filter);
      setFilterStruct(filter.filterStruct ?? null);
      console.log(`appply filter ${JSON.stringify(filter, null, 2)}`);
    },
    [onApplyFilter]
  );

  const handleFilterStateChange = useCallback(
    (filterState: FilterState) => {
      onFilterStateChanged?.(filterState);
      console.log(
        `filter state changed ${JSON.stringify(filterState, null, 2)}`
      );
    },
    [onFilterStateChanged]
  );

  const handleFilterRenamed = useCallback(
    (filter: Filter, name: string) => {
      onFilterRenamed?.(filter, name);
      console.log(
        `filter renames ${JSON.stringify(filter, null, 2)}
        new name ${name}`
      );
    },
    [onFilterRenamed]
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
        filterState={filterState}
        onApplyFilter={handleApplyFilter}
        onFilterDeleted={onFilterDeleted}
        onFilterRenamed={handleFilterRenamed}
        onFilterStateChanged={handleFilterStateChange}
        tableSchema={{ ...tableSchema, columns }}
        columnDescriptors={columns}
      />
      <div style={{ margin: 10 }}>{JSON.stringify(filterStruct, null, 2)}</div>
      <Input style={{ margin: 20, width: 100 }} />
    </div>
  );
};

let displaySequence = 1;

export const DefaultFilterBar = ({
  filterState: filterStateProp = { filters: [], activeIndices: [] },
  onFilterStateChanged,
  ...rest
}: Partial<FilterBarProps>) => {
  const [filterState, setFilterState] = useState(filterStateProp);

  const handleFilterStateChange = useCallback(
    (fs: FilterState) => {
      onFilterStateChanged?.(fs);
      setFilterState(fs);
    },
    [onFilterStateChanged]
  );

  return (
    <DefaultFilterBarCore
      {...rest}
      filterState={filterState}
      onFilterStateChanged={handleFilterStateChange}
    />
  );
};
DefaultFilterBar.displaySequence = displaySequence++;

export const FilterBarOneSimpleFilter = () => {
  return (
    <DefaultFilterBar
      filterState={{
        filters: [
          { column: "currency", name: "Filter One", op: "=", value: "EUR" },
        ],
        activeIndices: [],
      }}
    />
  );
};
FilterBarOneSimpleFilter.displaySequence = displaySequence++;

export const FilterBarOneMultiValueFilter = () => {
  return (
    <DefaultFilterBar
      filterState={{
        filters: [
          {
            column: "currency",
            name: "Filter One",
            op: "in",
            values: ["CAD", "EUR"],
          },
        ],
        activeIndices: [],
      }}
    />
  );
};
FilterBarOneMultiValueFilter.displaySequence = displaySequence++;

export const FilterBarMultipleFilters = ({
  onFilterDeleted,
  onFilterRenamed,
}: Partial<FilterBarProps>) => {
  return (
    <DefaultFilterBar
      filterState={{
        filters: [
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
        ],
        activeIndices: [],
      }}
      onFilterDeleted={onFilterDeleted}
      onFilterRenamed={onFilterRenamed}
    />
  );
};
FilterBarMultipleFilters.displaySequence = displaySequence++;

export const FilterBarMultipleFilterSets = () => {
  const [filterSets, setFilterSets] = useState(initialFilterSets);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleChangeSelectedIndex = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const { value } = evt.target as HTMLButtonElement;
      const index = parseInt(value);
      setSelectedIndex(index);
    },
    []
  );

  const handleChangeFilterState = useCallback(
    (fs: FilterState) => {
      setFilterSets((s) => [
        ...s.slice(0, selectedIndex),
        fs,
        ...s.slice(selectedIndex + 1),
      ]);
    },
    [selectedIndex]
  );

  return (
    <div>
      <ToggleButtonGroup
        value={selectedIndex}
        onChange={handleChangeSelectedIndex}
      >
        {filterSets.map((fs, i) => (
          <ToggleButton key={i} value={i}>
            {`Filter Set ${i + 1} (${fs.filters.length} filters)`}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <DefaultFilterBarCore
        filterState={filterSets[selectedIndex]}
        onFilterStateChanged={handleChangeFilterState}
      />
    </div>
  );
};

const initialFilterSets: FilterState[] = [
  {
    filters: [
      {
        column: "currency",
        name: "Filter One",
        op: "=",
        value: "EUR",
      },
      {
        column: "exchange",
        name: "Filter Two",
        op: "=",
        value: "XLON",
      },
      {
        column: "ric",
        name: "Filter Three",
        op: "in",
        values: ["AAPL", "BP.L", "VOD.L"],
      },
    ],
    activeIndices: [],
  },
  {
    filters: [
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
    ],
    activeIndices: [],
  },
];
FilterBarMultipleFilterSets.displaySequence = displaySequence++;
