import { TableProps } from "@finos/vuu-table";
import { JsonData } from "@finos/vuu-utils";
import { TableNext } from "@finos/vuu-table";
import { JsonDataSource } from "@finos/vuu-data";
import { useMemo } from "react";
import { TableConfig } from "@finos/vuu-datagrid-types";

export interface JsonTableProps
  extends Omit<TableProps, "config" | "dataSource"> {
  config?: Pick<
    TableConfig,
    "columnSeparators" | "rowSeparators" | "zebraStripes"
  >;
  source: JsonData | undefined;
}

export const JsonTable = ({
  config,
  source = { "": "" },
  ...tableProps
}: JsonTableProps) => {
  const [dataSource, tableConfig] = useMemo<
    [JsonDataSource, TableConfig]
  >(() => {
    const ds = new JsonDataSource({
      data: source,
    });

    return [ds, { ...config, columns: ds.columnDescriptors }];
  }, [config, source]);
  return (
    <TableNext {...tableProps} config={tableConfig} dataSource={dataSource} />
  );
};
