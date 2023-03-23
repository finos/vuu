import { TableProps } from "@finos/vuu-table";
import { JsonData } from "@finos/vuu-utils";
import { Table } from "@finos/vuu-table";
import { JsonDataSource } from "@finos/vuu-data";
import { useMemo } from "react";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";

export interface JsonTableProps
  extends Omit<TableProps, "config" | "dataSource"> {
  source: JsonData | undefined;
}

export const JsonTable = ({
  source = { "": "" },
  ...tableProps
}: JsonTableProps) => {
  const [dataSource, tableConfig] = useMemo((): [
    JsonDataSource,
    { columns: ColumnDescriptor[] }
  ] => {
    const ds = new JsonDataSource({
      data: source,
    });

    return [ds, { columns: ds.columnDescriptors }];
  }, [source]);

  return <Table {...tableProps} config={tableConfig} dataSource={dataSource} />;
};
