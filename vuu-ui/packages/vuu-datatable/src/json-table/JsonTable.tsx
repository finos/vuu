import { TableProps } from "@finos/vuu-table";
import { JsonData } from "@finos/vuu-utils";
import { TableNext } from "@finos/vuu-table";
import { JsonDataSource } from "@finos/vuu-data";
import { useEffect, useMemo, useRef } from "react";
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
  source: sourceProp = { "": "" },
  ...tableProps
}: JsonTableProps) => {
  const sourceRef = useRef(sourceProp);
  const dataSourceRef = useRef<JsonDataSource>();
  useMemo(() => {
    dataSourceRef.current = new JsonDataSource({
      data: sourceRef.current,
    });
  }, []);

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      ...config,
      columns: dataSourceRef.current?.columnDescriptors ?? [],
    };
  }, [config]);

  useEffect(() => {
    if (dataSourceRef.current) {
      dataSourceRef.current.data = sourceProp;
    }
  }, [sourceProp]);

  if (dataSourceRef.current === undefined) {
    return null;
  }

  return (
    <TableNext
      {...tableProps}
      config={tableConfig}
      dataSource={dataSourceRef.current}
    />
  );
};
