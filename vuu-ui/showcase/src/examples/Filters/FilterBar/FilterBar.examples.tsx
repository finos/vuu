import { FilterBar, FilterBarProps } from "@vuu-ui/vuu-filters";
import type { Filter, FilterState } from "@vuu-ui/vuu-filter-types";
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
import type { DataSourceFilter } from "@vuu-ui/vuu-data-types";
import { Input, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";

const useInstrumentsDataSource = () => {
  const instrumentsSchema = getSchema("instruments");
  const dataSourceProps = useMemo(
    () => ({
      columns: instrumentsSchema.columns.map(toColumnName),
      table: instrumentsSchema.table,
    }),
    [instrumentsSchema],
  );

  const { VuuDataSource } = useData();
  return useMemo(
    () => new VuuDataSource(dataSourceProps),
    [VuuDataSource, dataSourceProps],
  );
};

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
  columnDescriptors,
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
    () => columnDescriptors ?? [...tableSchema.columns, lastUpdatedColumn],
    [columnDescriptors, tableSchema.columns],
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
        vuuTable={tableSchema.table}
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

/** tags=data-consumer */
export const DefaultFilterBar = (props: Partial<FilterBarProps>) => {
  const dataSource = useInstrumentsDataSource();
  return (
    <DataSourceProvider dataSource={dataSource}>
      <FilterBarTemplate {...props} />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const DefaultFilterBarColumnLabels = (
  props: Partial<FilterBarProps>,
) => {
  const columnDescriptors: ColumnDescriptor[] = [
    { label: "BBG", name: "bbg", serverDataType: "string" },
    { label: "Currency", name: "currency", serverDataType: "string" },
    { label: "Description", name: "description", serverDataType: "string" },
    { label: "Exchange", name: "exchange", serverDataType: "string" },
    { label: "ISIN", name: "isin", serverDataType: "string" },
    { label: "Lot size", name: "lotSize", serverDataType: "int" },
    { label: "RIC", name: "ric", serverDataType: "string" },
    { label: "Supported", name: "supported", serverDataType: "boolean" },
    { label: "Wish list", name: "wishlist", serverDataType: "boolean" },
    { label: "Last Updated", name: "lastUpdated", serverDataType: "long" },
    { label: "Price", name: "price", serverDataType: "double" },
    { label: "Date", name: "date", serverDataType: "long" },
  ];
  const dataSource = useInstrumentsDataSource();

  return (
    <DataSourceProvider dataSource={dataSource}>
      <FilterBarTemplate {...props} columnDescriptors={columnDescriptors} />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const FilterBarOneSimpleFilter = () => {
  const dataSource = useInstrumentsDataSource();

  return (
    <DataSourceProvider dataSource={dataSource}>
      <FilterBarTemplate
        filterState={{
          filters: [
            { column: "currency", name: "Filter One", op: "=", value: "EUR" },
          ],
          activeIndices: [],
        }}
      />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const FilterBarOneMultiValueFilter = () => {
  const dataSource = useInstrumentsDataSource();

  return (
    <DataSourceProvider dataSource={dataSource}>
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
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const FilterBarMultipleFilters = ({
  onFilterDeleted,
  onFilterRenamed,
}: Partial<FilterBarProps>) => {
  const dataSource = useInstrumentsDataSource();

  return (
    <DataSourceProvider dataSource={dataSource}>
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
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const FilterBarMultipleFilterSets = () => {
  const [filterSets, setFilterSets] = useState(initialFilterSets);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dataSource = useInstrumentsDataSource();

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
    <DataSourceProvider dataSource={dataSource}>
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
    </DataSourceProvider>
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

/** tags=data-consumer */
export const QuickFilters = () => {
  const dataSource = useInstrumentsDataSource();

  return (
    <>
      <DataSourceProvider dataSource={dataSource}>
        <style>{`
      .vuuFilterBar-quick-filter { width: 100%; }
    `}</style>
        <FilterBarTemplate
          className="quick-filters"
          variant="quick-filters-only"
        />
      </DataSourceProvider>
    </>
  );
};

/** tags=data-consumer */
export const QuickFiltersThreeColumns = () => {
  const dataSource = useInstrumentsDataSource();

  return (
    <DataSourceProvider dataSource={dataSource}>
      <FilterBarTemplate
        variant="quick-filters-only"
        QuickFilterProps={{ quickFilterColumns: ["bbg"] }}
      />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const FullFilters = () => {
  const dataSource = useInstrumentsDataSource();

  return (
    <>
      <style>{`
      .filter-container { background: var(--salt-container-secondary-background);}
      .vuuFilterBar { width: 100%; }
  `}</style>
      <DataSourceProvider dataSource={dataSource}>
        <FilterBarTemplate variant="full-filters" />
      </DataSourceProvider>
    </>
  );
};
