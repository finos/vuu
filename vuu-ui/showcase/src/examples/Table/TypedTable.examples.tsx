import { getSchema, LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { useAutoLoginToVuuServer } from "../utils";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import {
  SelectionChangeHandler,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";

const TableTemplate = ({
  navigationStyle,
  schema = getSchema("instruments"),
}: Partial<TableProps> & {
  schema?: TableSchema;
}) => {
  useAutoLoginToVuuServer();
  const { VuuDataSource } = useData();

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

  const onSelect = useCallback<TableRowSelectHandler>((row) => {
    console.log("onSelect", { row });
  }, []);
  const onSelectionChange = useCallback<SelectionChangeHandler>(
    (selectionChange) => {
      console.log("onSelectionChange", { selectionChange });
    },
    [],
  );

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

export const TypedInstruments = () => {
  return (
    <LocalDataSourceProvider>
      <TableTemplate navigationStyle="row" />
    </LocalDataSourceProvider>
  );
};
