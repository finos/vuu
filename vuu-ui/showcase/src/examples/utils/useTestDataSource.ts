import { RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuGroupBy, VuuSort } from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { useMemo, useRef } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";
import { toDataSourceColumns } from "@finos/vuu-utils";

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
  columnConfig?: { [key: string]: Omit<ColumnDescriptor, "name"> },
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

/**
 * Either pass in a tableSchema or a map of schemas and the tablename
 */
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
  tableSchema = schemas[tablename],
}: {
  autoLogin?: boolean;
  bufferSize?: number;
  calculatedColumns?: ColumnDescriptor[];
  columnConfig?: { [key: string]: Omit<ColumnDescriptor, "name"> };
  columnNames?: string[];
  filter?: DataSourceFilter;
  groupBy?: VuuGroupBy;
  schemas: { [key: string]: TableSchema };
  sort?: VuuSort;
  tablename?: string;
  tableSchema?: TableSchema;
}) => {
  const dataSourceRef = useRef<RemoteDataSource | undefined>();

  const [columns, config, columnNames, table] = useMemo(() => {
    const configuredColumns = configureColumns(
      tableSchema.columns,
      columnConfig,
      columnNamesProp
    ).concat(calculatedColumns);
    return [
      configuredColumns,
      { columns: configuredColumns },
      configuredColumns.map(toDataSourceColumns),
      tableSchema.table,
      tableSchema,
    ];
  }, [calculatedColumns, columnConfig, columnNamesProp, tableSchema]);

  const tableRef = useRef(table);

  const dataSource = useMemo(() => {
    const dataConfig = {
      bufferSize,
      columns: columnNames,
      filter,
      groupBy,
      sort,
      table,
    };

    const { current: activeTable } = tableRef;
    const { current: activeDataSource } = dataSourceRef;

    if (activeDataSource && activeTable !== table) {
      activeDataSource.unsubscribe();
    }

    if (!activeDataSource || activeTable !== table) {
      dataSourceRef.current = new RemoteDataSource(dataConfig);
    }
    tableRef.current = table;

    if (dataSourceRef.current === undefined) {
      throw Error("no dataSource configuration specified");
    }

    return dataSourceRef.current;
  }, [bufferSize, columnNames, filter, groupBy, sort, table]);

  const error = useAutoLoginToVuuServer(autoLogin);

  return {
    dataSource,
    columns,
    config,
    error,
    tableSchema,
  };
};
