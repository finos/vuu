import { TableSchema } from "@finos/vuu-data-types";
import { Table, TableProps } from "@finos/vuu-table";
import { useDataSource } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { useAutoLoginToVuuServer } from "../utils";
import { TableConfig } from "@finos/vuu-table-types";
import { LocalDataSourceProvider, getSchema } from "@finos/vuu-data-test";

const TableTemplate = ({
  navigationStyle,
  schema = getSchema("instruments"),
}: Partial<TableProps> & {
  schema?: TableSchema;
}) => {
  useAutoLoginToVuuServer();
  const { VuuDataSource } = useDataSource();
  const dataSource = useMemo(() => {
    const { table } = schema;
    const dataSource = new VuuDataSource({
      columns: schema.columns.map((c) => c.name),
      table,
    });
    return dataSource;
  }, [VuuDataSource, schema]);

  const config = useMemo<TableConfig>(
    () => ({
      columns: schema.columns,
    }),
    [schema.columns],
  );

  console.log({ columns: schema.columns });

  const onSelect = useCallback((row) => {
    console.log("onSelect", { row });
  }, []);
  const onSelectionChange = useCallback((selected) => {
    console.log("onSelectionChange", { selected });
  }, []);

  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={625}
      navigationStyle={navigationStyle}
      onSelect={onSelect}
      onSelectionChange={onSelectionChange}
      renderBufferSize={5}
      width={715}
    />
  );
};

export const RowNavigation = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <TableTemplate navigationStyle="row" />
    </LocalDataSourceProvider>
  );
};

export const CellNavigation = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <TableTemplate navigationStyle="cell" />
    </LocalDataSourceProvider>
  );
};
