import { RemoteDataSource } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuGroupBy, VuuSort } from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { useMemo } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";
import { Schema } from "./useSchemas";

export const toServerSpec = (column: ColumnDescriptor) =>
  column.expression
    ? `${column.name}:${column.serverDataType}:${column.expression}`
    : column.name;

const getRequestedColumns = (
  columns: ColumnDescriptor[],
  columnNames?: string[]
) => {
  if (Array.isArray(columnNames)) {
    return columnNames.map((name) => {
      const col = columns.find((col) => col.name === name);
      if (!col) {
        throw Error(`no column found '${name}'`);
      }
      return col;
    });
  } else {
    return columns;
  }
};

const configureColumns = (
  columns: ColumnDescriptor[],
  columnConfig?: { [key: string]: ColumnDescriptor },
  columnNames?: string[]
): ColumnDescriptor[] => {
  const requestedColumns = getRequestedColumns(columns, columnNames);
  if (columnConfig) {
    return requestedColumns.map((column) => ({
      ...column,
      ...columnConfig[column.name],
    }));
  } else {
    return requestedColumns;
  }
};

const NO_CONCATENATED_COLUMNS: ColumnDescriptor[] = [];

export const useTestDataSource = ({
  autoLogin = true,
  bufferSize = 100,
  calculatedColumns = NO_CONCATENATED_COLUMNS,
  columnNames: columnNamesProp,
  columnConfig,
  filter,
  groupBy,
  schemas,
  sort,
  tablename = "instruments",
}: {
  autoLogin?: boolean;
  bufferSize?: number;
  calculatedColumns?: ColumnDescriptor[];
  columnConfig?: any;
  columnNames?: string[];
  filter?: DataSourceFilter;
  groupBy?: VuuGroupBy;
  schemas: { [key: string]: Schema };
  sort?: VuuSort;
  tablename?: string;
}) => {
  const [columns, config, columnNames, table] = useMemo(() => {
    const schema = schemas[tablename];
    const configuredColumns = configureColumns(
      schema.columns,
      columnConfig,
      columnNamesProp
    ).concat(calculatedColumns);
    return [
      configuredColumns,
      { columns: configuredColumns },
      configuredColumns.map(toServerSpec),
      schema.table,
    ];
  }, [calculatedColumns, columnConfig, columnNamesProp, schemas, tablename]);

  const dataSource = useMemo(() => {
    const dataConfig = {
      bufferSize,
      columns: columnNames,
      filter,
      groupBy,
      sort,
      table,
      serverUrl: "127.0.0.1:8090/websocket",
    };
    return new RemoteDataSource(dataConfig);
  }, [bufferSize, columnNames, filter, groupBy, sort, table]);

  const error = useAutoLoginToVuuServer(autoLogin);

  return {
    dataSource,
    columns,
    config,
    error,
  };
};
