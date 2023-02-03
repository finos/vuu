import { RemoteDataSource } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useMemo } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";
import { Schema } from "./useSchemas";

export const toServerSpec = (column: ColumnDescriptor) =>
  column.expression
    ? `${column.name}:${column.serverDataType}:${column.expression}`
    : column.name;

const configureColumns = (
  columns: ColumnDescriptor[],
  columnConfig?: { [key: string]: ColumnDescriptor }
): ColumnDescriptor[] => {
  if (columnConfig) {
    return columns.map((column) => ({
      ...column,
      ...columnConfig[column.name],
    }));
  } else {
    return columns;
  }
};

const NO_CONCATENATED_COLUMNS: ColumnDescriptor[] = [];

export const useTestDataSource = ({
  autoLogin = true,
  bufferSize = 100,
  calculatedColumns = NO_CONCATENATED_COLUMNS,
  columnConfig,
  schemas,
  tablename = "instruments",
}: {
  autoLogin?: boolean;
  bufferSize?: number;
  calculatedColumns?: ColumnDescriptor[];
  columnConfig?: any;
  schemas: { [key: string]: Schema };
  tablename?: string;
}) => {
  const [columns, config, columnNames, table] = useMemo(() => {
    const schema = schemas[tablename];
    const configuredColumns = configureColumns(
      schema.columns,
      columnConfig
    ).concat(calculatedColumns);
    return [
      configuredColumns,
      { columns: configuredColumns },
      configuredColumns.map(toServerSpec),
      schema.table,
    ];
  }, [calculatedColumns, columnConfig, schemas, tablename]);

  const dataSource = useMemo(() => {
    const dataConfig = {
      bufferSize,
      columns: columnNames,
      table,
      serverUrl: "127.0.0.1:8090/websocket",
    };
    return new RemoteDataSource(dataConfig);
  }, [bufferSize, columnNames, table]);

  const error = useAutoLoginToVuuServer(autoLogin);

  return {
    dataSource,
    columns,
    config,
    error,
  };
};
