import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import type { Filter, FilterState } from "@finos/vuu-filter-types";
import {
  CSSProperties,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import { Input, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { LocalDataSourceProvider, getSchema } from "@finos/vuu-data-test";

const lastUpdatedColumn = {
  name: "lastUpdated",
  serverDataType: "long",
  type: "date/time",
} as const;

const FilterContainer = ({
  children,
  filter,
  style = { left: 0, position: "absolute", top: 0, width: "100%" },
}: {
  children: ReactElement;
  filter: Filter | null;
  style?: CSSProperties;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.querySelector("input")?.focus();
  }, []);

  return (
    <div className="filter-container" style={style}>
      <Input
        style={{ margin: 20, width: 100 }}
        ref={inputRef}
        data-testid="pre-filterbar"
      />
      <div>{children}</div>
      <Input style={{ margin: 20, width: 100 }} />
      <div style={{ whiteSpace: "pre" }}>{JSON.stringify(filter, null, 2)}</div>
    </div>
  );
};

const DefaultFilterBarCore = ({
  QuickFilterProps,
  filterState,
  onApplyFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  variant,
}: Partial<FilterBarProps>) => {
  const [filterStruct, setFilterStruct] = useState<Filter | null>(null);
  const tableSchema = useMemo(() => getSchema("instruments"), []);
  const columns = useMemo(
    () => [...tableSchema.columns, lastUpdatedColumn],
    [tableSchema],
  );

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      onApplyFilter?.(filter);
      setFilterStruct(filter.filterStruct ?? null);
    },
    [onApplyFilter],
  );

  const handleFilterStateChange = useCallback(
    (filterState: FilterState) => {
      onFilterStateChanged?.(filterState);
    },
    [onFilterStateChanged],
  );

  const handleFilterDeleted = useCallback(
    (filter: Filter) => {
      onFilterDeleted?.(filter);
    },
    [onFilterDeleted],
  );

  const handleFilterRenamed = useCallback(
    (filter: Filter, name: string) => {
      onFilterRenamed?.(filter, name);
    },
    [onFilterRenamed],
  );

  return (
    <FilterContainer filter={filterStruct}>
      <FilterBar
        QuickFilterProps={QuickFilterProps}
        columnDescriptors={columns}
        data-testid="filterbar"
        filterState={filterState}
        onApplyFilter={handleApplyFilter}
        onFilterDeleted={handleFilterDeleted}
        onFilterRenamed={handleFilterRenamed}
        onFilterStateChanged={handleFilterStateChange}
        tableSchema={{ ...tableSchema, columns }}
        variant={variant}
      />
    </FilterContainer>
  );
};

const FilterBarTemplate = ({
  QuickFilterProps,
  filterState: filterStateProp = { filters: [], activeIndices: [] },
  onFilterStateChanged,
  ...rest
}: Partial<FilterBarProps>) => {
  const [filterState, setFilterState] = useState(filterStateProp);
  const [quickFilterColumns, setQuickFilterColumns] = useState(
    QuickFilterProps?.quickFilterColumns ?? [],
  );

  const handleChangeQuickFilterColumns = useCallback((columns: string[]) => {
    console.log("change columns", { columns });
    setQuickFilterColumns(columns);
  }, []);

  const handleFilterStateChange = useCallback(
    (fs: FilterState) => {
      onFilterStateChanged?.(fs);
      setFilterState(fs);
    },
    [onFilterStateChanged],
  );

  return (
    <DefaultFilterBarCore
      {...rest}
      QuickFilterProps={{
        ...QuickFilterProps,
        quickFilterColumns,
        onChangeQuickFilterColumns: handleChangeQuickFilterColumns,
      }}
      filterState={filterState}
      onFilterStateChanged={handleFilterStateChange}
    />
  );
};

export const FilterBarNoSuggestions = (props: Partial<FilterBarProps>) => (
  <FilterBarTemplate {...props} />
);

export const DefaultFilterBar = (props: Partial<FilterBarProps>) => (
  <LocalDataSourceProvider modules={["SIMUL"]}>
    <FilterBarTemplate {...props} />
  </LocalDataSourceProvider>
);

export const FilterBarOneSimpleFilter = () => {
  return (
    <FilterBarTemplate
      filterState={{
        filters: [
          { column: "currency", name: "Filter One", op: "=", value: "EUR" },
        ],
        activeIndices: [],
      }}
    />
  );
};

export const FilterBarOneMultiValueFilter = () => {
  return (
    <FilterBarTemplate
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

export const FilterBarMultipleFilters = ({
  onFilterDeleted,
  onFilterRenamed,
}: Partial<FilterBarProps>) => {
  return (
    <FilterBarTemplate
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

export const FilterBarMultipleFilterSets = () => {
  const [filterSets, setFilterSets] = useState(initialFilterSets);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleChangeSelectedIndex = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const { value } = evt.target as HTMLButtonElement;
      const index = parseInt(value);
      setSelectedIndex(index);
    },
    [],
  );

  const handleChangeFilterState = useCallback(
    (fs: FilterState) => {
      setFilterSets((s) => [
        ...s.slice(0, selectedIndex),
        fs,
        ...s.slice(selectedIndex + 1),
      ]);
    },
    [selectedIndex],
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

export const QuickFilters = () => {
  return (
    <>
      <style>{`
      .vuuFilterBar-quick-filter { width: 100%; }
    `}</style>
      <FilterBarTemplate
        className="quick-filters"
        variant="quick-filters-only"
      />
    </>
  );
};

export const QuickFiltersThreeColumns = () => {
  return (
    <FilterBarTemplate
      variant="quick-filters-only"
      QuickFilterProps={{ quickFilterColumns: ["bbg"] }}
    />
  );
};

export const FullFilters = () => {
  return (
    <>
      <style>{`
      .filter-container { background: var(--salt-container-secondary-background);}
      .vuuFilterBar { width: 100%; }
  `}</style>
      <FilterBarTemplate variant="full-filters" />
    </>
  );
};
