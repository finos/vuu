import { RemoteDataSource } from "@finos/vuu-data";
import { useMemo } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";
import { Schema } from "./useSchemas";

const configureColumns = (columns: any, columnConfig?: any) => {
  if (columnConfig) {
    return Object.keys(columnConfig).map((colname: string) => {
      const column = columns.find((col) => col.name === colname);
      return {
        ...column,
        ...columnConfig[colname],
      };
    });
  } else {
    return columns;
  }
};

export const useTestDataSource = ({
  autoLogin = true,
  bufferSize = 100,
  columnConfig,
  schemas,
  tablename = "instruments",
}: {
  autoLogin?: boolean;
  bufferSize?: number;
  columnConfig?: any;
  schemas: { [key: string]: Schema };
  tablename?: string;
}) => {
  const [columns, config, columnNames, table] = useMemo(() => {
    const schema = schemas[tablename];
    const configuredColumns = configureColumns(schema.columns, columnConfig);
    return [
      configuredColumns,
      { columns: configuredColumns },
      configuredColumns.map((col) => col.name),
      schema.table,
    ];
  }, [columnConfig, schemas, tablename]);

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
