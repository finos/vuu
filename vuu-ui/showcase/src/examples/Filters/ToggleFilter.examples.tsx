import {
  Table as DataTable,
  getSchema,
  TickingArrayDataSource,
} from "@vuu-ui/vuu-data-test";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { SingleValueFilterClause, Filter } from "@vuu-ui/vuu-filter-types";
import { ToggleFilter, ToggleFilterProps } from "@vuu-ui/vuu-filters";
import { Table } from "@vuu-ui/vuu-table";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import {
  CommitHandler,
  DataSourceProvider,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";

const containerStyle = {
  padding: 12,
  width: 300,
};

const BuySellFilterTemplate = ({
  defaultValue,
  labels,
  onCommit,
  table,
  value,
}: Partial<
  Pick<
    ToggleFilterProps,
    "defaultValue" | "labels" | "onCommit" | "table" | "value"
  >
>) => {
  const handleCommit: CommitHandler<HTMLElement> = (e, value) => {
    onCommit?.(e, value);
  };
  return (
    <div style={containerStyle}>
      <ToggleFilter
        column="side"
        defaultValue={defaultValue}
        labels={labels}
        onCommit={handleCommit}
        table={table}
        value={value}
        values={["BUY", "SELL"]}
      />
    </div>
  );
};

export const SimpleBuySellFilter = () => <BuySellFilterTemplate />;

export const SimpleBuySellFilterInitialised = () => {
  return (
    <BuySellFilterTemplate
      onCommit={(_e, v) => console.log(v as string)}
      defaultValue="SELL"
    />
  );
};

export const SimpleBuySellFilterWithLabels = () => (
  <BuySellFilterTemplate
    labels={["Long", "Short"]}
    onCommit={(_e, v) => console.log(v as string)}
  />
);

export const SimpleControlledBuySellFilter = () => {
  const [value, setValue] = useState("");
  return (
    <BuySellFilterTemplate
      onCommit={(_e, v) => setValue(v as string)}
      value={value}
    />
  );
};

export const SimpleControlledBuySellFilterInitialised = () => {
  const [value, setValue] = useState("BUY");
  return (
    <BuySellFilterTemplate
      onCommit={(_e, v) => setValue(v as string)}
      value={value}
    />
  );
};

export const ControlledBuySellFilterWithDataSource = () => {
  const [value, setValue] = useState("");
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    const tableSchema = getSchema("parentOrders");
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      table: tableSchema.table,
    });
  }, [VuuDataSource]);
  return (
    <DataSourceProvider dataSource={dataSource}>
      <BuySellFilterTemplate
        onCommit={(_e, v) => setValue(v as string)}
        table={{ module: "SIMUL", table: "parentOrders" }}
        value={value}
      />
    </DataSourceProvider>
  );
};

export const ControlledBuySellFilterWithBuyOnlyDataSource = () => {
  const [value, setValue] = useState("");
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    const tableSchema = getSchema("parentOrders");
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      baseFilterSpec: { filter: 'side = "BUY"' },
      table: tableSchema.table,
    });
  }, [VuuDataSource]);
  return (
    <DataSourceProvider dataSource={dataSource}>
      <BuySellFilterTemplate
        onCommit={(_e, v) => setValue(v as string)}
        table={{ module: "SIMUL", table: "parentOrders" }}
        value={value}
      />
    </DataSourceProvider>
  );
};

/**
 * Toggle selection is applied as a filter to the DataSource, as it would
 * be in an application. A baseFilter can be used to restrict available data.
 * The Table subscribes to the DataSource, so filter changes are processed.
 */
const BuySellFilterAppliedToDataSourceTemplate = ({
  baseFilter,
  initialValue = "",
}: {
  baseFilter?: string;
  initialValue?: string;
}) => {
  const [value, setValue] = useState(initialValue);
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    const tableSchema = getSchema("parentOrders");
    return new VuuDataSource({
      baseFilterSpec: baseFilter ? { filter: baseFilter } : undefined,
      columns: tableSchema.columns.map(toColumnName),
      filterSpec: initialValue
        ? { filter: `side = "${initialValue}"` }
        : undefined,
      table: tableSchema.table,
    });
  }, [VuuDataSource, baseFilter, initialValue]);

  const tableConfig = useMemo<TableConfig>(
    () => ({
      columns: getSchema("parentOrders").columns,
    }),
    [],
  );

  const handleCommit: CommitHandler<HTMLElement> = (_e, v) => {
    const value = v as string;
    setValue(value);
    if (value === "") {
      dataSource.clearFilter?.();
    } else {
      dataSource.setFilter?.({ column: "side", op: "=", value });
    }
  };

  return (
    <DataSourceProvider dataSource={dataSource}>
      <BuySellFilterTemplate
        onCommit={handleCommit}
        table={{ module: "SIMUL", table: "parentOrders" }}
        value={value}
      />
      <Table
        config={tableConfig}
        dataSource={dataSource}
        height={400}
        width={800}
      />
    </DataSourceProvider>
  );
};

export const BuySellFilterAppliedToDataSource = () => (
  <BuySellFilterAppliedToDataSourceTemplate />
);

export const BuySellFilterAppliedToBuyOnlyDataSource = () => (
  <BuySellFilterAppliedToDataSourceTemplate baseFilter='side = "BUY"' />
);

export const BuySellFilterAppliedToBuyOnlyDataSourceInitialised = () => (
  <BuySellFilterAppliedToDataSourceTemplate
    baseFilter='side = "BUY"'
    initialValue="BUY"
  />
);

// prettier-ignore
const TradesSchema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "side", serverDataType: "string" },
    { name: "region", serverDataType: "string" },
    { name: "status", serverDataType: "string" },
  ],
  key: "id",
  table: { module: "TEST", table: "Trades" },
};

/**
 * Contrived data, with gaps, so that selections in one ToggleFilter
 * leave values in other ToggleFilters with no matching data.
 * - APAC has only BUY, AMER has only SELL
 * - Cancelled only occurs for EMEA BUY
 */
// prettier-ignore
const tradesTable = new DataTable(
  TradesSchema,
  [
    ["T-001", "BUY", "EMEA", "Open"],
    ["T-002", "SELL", "EMEA", "Filled"],
    ["T-003", "BUY", "EMEA", "Cancelled"],
    ["T-004", "BUY", "APAC", "Open"],
    ["T-005", "BUY", "APAC", "Filled"],
    ["T-006", "SELL", "AMER", "Open"],
    ["T-007", "SELL", "AMER", "Filled"],
  ],
  { id: 0, side: 1, region: 2, status: 3 },
);

const tradeFilterColumns = ["side", "region", "status"] as const;
type TradeFilterColumn = (typeof tradeFilterColumns)[number];
type TradeFilterValues = Record<TradeFilterColumn, string>;

const buildTradesFilter = (values: TradeFilterValues): Filter | undefined => {
  const filters = tradeFilterColumns
    .filter((column) => values[column] !== "")
    .map<SingleValueFilterClause>((column) => ({
      column,
      op: "=",
      value: values[column],
    }));
  if (filters.length === 0) {
    return undefined;
  } else if (filters.length === 1) {
    return filters[0];
  } else {
    return { op: "and", filters };
  }
};

/**
 * Multiple ToggleFilters, selections combined into a single DataSource
 * filter. As selections are made, values in other ToggleFilters that no
 * longer have matching data are flagged as unavailable.
 */
export const MultipleInteractingToggleFilters = () => {
  const [values, setValues] = useState<TradeFilterValues>({
    side: "",
    region: "",
    status: "",
  });

  const dataSource = useMemo(
    () =>
      new TickingArrayDataSource({
        columnDescriptors: TradesSchema.columns,
        table: tradesTable,
      }),
    [],
  );

  const tableConfig = useMemo<TableConfig>(
    () => ({ columns: TradesSchema.columns }),
    [],
  );

  const handleCommit =
    (column: TradeFilterColumn): CommitHandler<HTMLElement> =>
    (_e, value) => {
      const newValues = { ...values, [column]: value as string };
      setValues(newValues);
      const filter = buildTradesFilter(newValues);
      if (filter) {
        dataSource.setFilter?.(filter);
      } else {
        dataSource.clearFilter?.();
      }
    };

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div
        style={{
          ...containerStyle,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 400,
        }}
      >
        <ToggleFilter
          column="side"
          data-testid="side-filter"
          onCommit={handleCommit("side")}
          table={TradesSchema.table}
          value={values.side}
          values={["BUY", "SELL"]}
        />
        <ToggleFilter
          column="region"
          data-testid="region-filter"
          onCommit={handleCommit("region")}
          table={TradesSchema.table}
          value={values.region}
          values={["EMEA", "APAC", "AMER"]}
        />
        <ToggleFilter
          column="status"
          data-testid="status-filter"
          onCommit={handleCommit("status")}
          table={TradesSchema.table}
          value={values.status}
          values={["Open", "Filled", "Cancelled"]}
        />
      </div>
      <Table
        config={tableConfig}
        dataSource={dataSource}
        height={300}
        width={400}
      />
    </DataSourceProvider>
  );
};
