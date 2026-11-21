import { useData } from "@vuu-ui/core";
import {
  FilterBar,
  FilterBarProps,
  type QuickFilterValues,
} from "@vuu-ui/vuu-filters";
import type {
  Filter,
  FilterHandler,
  FilterState,
} from "@vuu-ui/vuu-filter-types";
import {
  CSSProperties,
  isValidElement,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Input,
  Pill,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  DataSourceProvider,
  toColumnName,
  VuuShellLocation,
} from "@vuu-ui/vuu-utils";
import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import { ContextPanel, type ContextPanelProps } from "@vuu-ui/vuu-shell";
import {
  ContextPanelProvider,
  Icon,
  type ShowContextPanel,
} from "@vuu-ui/vuu-ui-controls";

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
  onClearFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
  style,
  variant,
}: Partial<FilterBarProps>) => {
  const [filterStruct, setFilterStruct] = useState<Filter | null>(null);
  const [appliedRecords, setAppliedRecords] = useState<unknown[]>([]);
  const [stateRecords, setStateRecords] = useState<unknown[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<unknown[]>([]);
  const [renamedRecords, setRenamedRecords] = useState<unknown[]>([]);
  const tableSchema = useMemo(() => getSchema("instruments"), []);
  const columns = useMemo(
    () => columnDescriptors ?? [...tableSchema.columns, lastUpdatedColumn],
    [columnDescriptors, tableSchema.columns],
  );

  const handleApplyFilter = useCallback<FilterHandler>(
    (filter) => {
      setAppliedRecords((records) => [...records, [filter]]);
      onApplyFilter?.(filter);
      setFilterStruct(filter);
    },
    [onApplyFilter],
  );
  const handleClearFilter = useCallback(() => {
    onClearFilter?.();
    setFilterStruct(null);
  }, [onClearFilter]);

  const handleFilterStateChange = useCallback(
    (filterState: FilterState) => {
      setStateRecords((records) => [...records, [filterState]]);
      onFilterStateChanged?.(filterState);
    },
    [onFilterStateChanged],
  );

  const handleFilterDeleted = useCallback(
    (filter: Filter) => {
      setDeletedRecords((records) => [...records, [filter]]);
      onFilterDeleted?.(filter);
    },
    [onFilterDeleted],
  );

  const handleFilterRenamed = useCallback(
    (filter: Filter, name: string) => {
      setRenamedRecords((records) => [...records, [filter, name]]);
      onFilterRenamed?.(filter, name);
    },
    [onFilterRenamed],
  );

  return (
    <FilterContainer filter={filterStruct}>
      <>
        <FilterBar
          QuickFilterProps={QuickFilterProps}
          columnDescriptors={columns}
          data-testid="filterbar"
          filterState={filterState}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          onFilterDeleted={handleFilterDeleted}
          onFilterRenamed={handleFilterRenamed}
          onFilterStateChanged={handleFilterStateChange}
          style={style}
          vuuTable={tableSchema.table}
          variant={variant}
        />
        <input
          hidden
          data-testid="applied-records"
          readOnly
          value={JSON.stringify(appliedRecords.at(-1) ?? null)}
        />
        <input
          hidden
          data-testid="state-records"
          readOnly
          value={JSON.stringify(stateRecords.at(-1) ?? null)}
        />
        <input
          hidden
          data-testid="deleted-records"
          readOnly
          value={JSON.stringify(deletedRecords.at(-1) ?? null)}
        />
        <input
          hidden
          data-testid="renamed-records"
          readOnly
          value={JSON.stringify(renamedRecords.at(-1) ?? null)}
        />
      </>
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
export const FilterBarMixedNestedFilter = () => {
  const dataSource = useInstrumentsDataSource();

  return (
    <DataSourceProvider dataSource={dataSource}>
      <FilterBarTemplate
        filterState={{
          filters: [
            {
              name: "Mixed",
              op: "and",
              filters: [
                { column: "currency", op: "=", value: "EUR" },
                {
                  op: "or",
                  filters: [
                    { column: "exchange", op: "=", value: "XLON" },
                    { column: "lotSize", op: ">", value: 1000 },
                  ],
                },
              ],
            },
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

/**
 * Column labels, as a Table shows them in column headers, that differ from
 * the column names. Filters show the labels and are built with the names.
 */
const INSTRUMENT_COLUMN_LABELS: Record<string, string> = {
  bbg: "Bloomberg ID",
  currency: "Ccy",
  description: "Name",
  exchange: "Venue",
  isin: "ISIN",
  lotSize: "Lot size",
  ric: "RIC",
  lastUpdated: "Last updated",
};

const useLabelledInstrumentColumns = () =>
  useMemo<ColumnDescriptor[]>(
    () =>
      [...getSchema("instruments").columns, lastUpdatedColumn].map(
        (column) => ({
          ...column,
          label: INSTRUMENT_COLUMN_LABELS[column.name],
        }),
      ),
    [],
  );

/** tags=data-consumer */
export const FullFilters = () => {
  const dataSource = useInstrumentsDataSource();
  const columnDescriptors = useLabelledInstrumentColumns();

  return (
    <>
      <style>{`
      .filter-container { background: var(--salt-container-secondary-background);}
      .vuuFilterBar { width: 100%; }
  `}</style>
      <DataSourceProvider dataSource={dataSource}>
        <FilterBarTemplate
          QuickFilterProps={{
            quickFilterColumns: ["currency", "exchange", "lotSize"],
          }}
          columnDescriptors={columnDescriptors}
          filterState={{
            filters: [
              { column: "currency", name: "Euro trades", op: "=", value: "EUR" },
              { column: "exchange", name: "London", op: "=", value: "XLON" },
              { column: "lotSize", name: "Large lots", op: ">", value: 1000 },
            ],
            activeIndices: [0],
          }}
          variant="full-filters"
        />
      </DataSourceProvider>
    </>
  );
};

/**
 * FullFilters inside a layout with a context panel. The quick filter column
 * chooser opens in the context panel, so the bar does not shift under the
 * picker as columns are added.
 *
 * tags=data-consumer
 */
export const FullFiltersWithContextPanel = () => {
  const dataSource = useInstrumentsDataSource();
  const columnDescriptors = useLabelledInstrumentColumns();
  const [contextPanelProps, setContextPanelProps] = useState<
    ContextPanelProps | undefined
  >(undefined);

  const showContextPanel = useCallback<ShowContextPanel>((content, title) => {
    if (isValidElement(content)) {
      setContextPanelProps({ content, expanded: true, title });
    }
  }, []);
  const hideContextPanel = useCallback(() => {
    setContextPanelProps(undefined);
  }, []);

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      <style>{`
      .filter-container { background: var(--salt-container-secondary-background);}
      .vuuFilterBar { width: 100%; }
  `}</style>
      <FlexboxLayout style={{ height: 600, width: "100%" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <DataSourceProvider dataSource={dataSource}>
            <FilterBarTemplate
              QuickFilterProps={{
                quickFilterColumns: ["currency", "exchange", "lotSize"],
              }}
              columnDescriptors={columnDescriptors}
              filterState={{
                filters: [
                  {
                    column: "currency",
                    name: "Euro trades",
                    op: "=",
                    value: "EUR",
                  },
                  { column: "exchange", name: "London", op: "=", value: "XLON" },
                ],
                activeIndices: [0],
              }}
              variant="full-filters"
            />
          </DataSourceProvider>
        </div>
        <ContextPanel
          {...contextPanelProps}
          id={VuuShellLocation.ContextPanel}
          overlay
        />
      </FlexboxLayout>
    </ContextPanelProvider>
  );
};

/**
 * More filters than fit on one row: labels truncate, then filters move
 * into the "+N" menu at the end of the row.
 *
 * tags=data-consumer
 */
export const FilterBarOverflow = () => {
  const dataSource = useInstrumentsDataSource();
  const names = [
    "Euro trades",
    "London",
    "Large orders",
    "Buys only",
    "Tech names",
    "Today",
    "Desk 4 flow",
    "High touch",
    "Algo fills",
  ];
  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ position: "relative", width: 560 }}>
        <FilterBarTemplate
          filterState={{
            filters: names.map((name, i) => ({
              column: "lotSize",
              name,
              op: ">",
              value: i * 100,
            })),
            activeIndices: [0, 1, 5, 8],
          }}
          style={{ width: "100%" }}
        />
      </div>
    </DataSourceProvider>
  );
};

const QUICK_FILTER_COLUMN_SETS: Record<string, string[]> = {
  Listing: ["currency", "exchange", "lotSize"],
  Identifiers: ["bbg", "isin", "ric"],
};

/**
 * The host owns the quick filter values. Each column set shows its own quick
 * filter columns. Values on columns outside the current set still apply
 * (applyHiddenValues) and are listed under "Also applied", where the host
 * can clear them.
 *
 * tags=data-consumer
 */
export const ControlledQuickFilterValues = () => {
  const dataSource = useInstrumentsDataSource();
  const columnDescriptors = useLabelledInstrumentColumns();
  const [columnSet, setColumnSet] = useState("Listing");
  const [quickFilterValues, setQuickFilterValues] = useState<QuickFilterValues>(
    { currency: { op: "=", value: "EUR" } },
  );
  const [quickFilterCount, setQuickFilterCount] = useState(0);

  const quickFilterColumns = QUICK_FILTER_COLUMN_SETS[columnSet];
  const hiddenValues = Object.entries(quickFilterValues).filter(
    ([name]) => !quickFilterColumns.includes(name),
  );

  const clearValue = (name: string) =>
    setQuickFilterValues(({ [name]: _, ...rest }) => rest);

  const getLabel = (name: string) =>
    columnDescriptors.find((column) => column.name === name)?.label ?? name;

  return (
    <DataSourceProvider dataSource={dataSource}>
      <style>{`
      .filter-container { background: var(--salt-container-secondary-background);}
      .vuuFilterBar { width: 100%; }
  `}</style>
      <div style={{ display: "flex", gap: 8, padding: "8px 20px" }}>
        <ToggleButtonGroup
          aria-label="Column set"
          onChange={(e) => setColumnSet(e.currentTarget.value)}
          value={columnSet}
        >
          {Object.keys(QUICK_FILTER_COLUMN_SETS).map((name) => (
            <ToggleButton key={name} value={name}>
              {name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {hiddenValues.length > 0 ? <Text>Also applied</Text> : null}
        {hiddenValues.map(([name, { op, value }]) => (
          <Pill
            aria-label={`Clear ${getLabel(name)}`}
            key={name}
            onClick={() => clearValue(name)}
          >
            {`${getLabel(name)} ${op} ${value}`}
            <Icon name="close" size={10} />
          </Pill>
        ))}
      </div>
      <input
        data-testid="quick-filter-values"
        hidden
        readOnly
        value={JSON.stringify(quickFilterValues)}
      />
      <input
        data-testid="quick-filter-count"
        hidden
        readOnly
        value={quickFilterCount}
      />
      <div style={{ position: "relative" }}>
        <DefaultFilterBarCore
          QuickFilterProps={{
            allowAddColumn: false,
            applyHiddenValues: true,
            onQuickFilterChange: (_filter, count) =>
              setQuickFilterCount(count),
            onQuickFilterValuesChange: setQuickFilterValues,
            quickFilterColumns,
            quickFilterValues,
          }}
          columnDescriptors={columnDescriptors}
          variant="quick-filters-only"
        />
      </div>
    </DataSourceProvider>
  );
};
