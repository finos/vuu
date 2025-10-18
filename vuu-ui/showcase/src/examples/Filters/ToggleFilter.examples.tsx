import { getSchema } from "@vuu-ui/vuu-data-test";
import { ToggleFilter, ToggleFilterProps } from "@vuu-ui/vuu-filters";
import {
  CommitHandler,
  DataSourceProvider,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";

const containerStyle = {
  padding: 12,
  width: 200,
};

const BuySellFilterTemplate = ({
  defaultValue,
  onCommit,
  table,
  value,
}: Partial<
  Pick<ToggleFilterProps, "defaultValue" | "onCommit" | "table" | "value">
>) => {
  const handleCommit: CommitHandler<HTMLElement> = (e, value) => {
    onCommit?.(e, value);
  };
  return (
    <div style={containerStyle}>
      <ToggleFilter
        column="side"
        defaultValue={defaultValue}
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
      filterSpec: { filter: 'side = "BUY"' },
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
