import { getSchema } from "@vuu-ui/vuu-data-test";
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
