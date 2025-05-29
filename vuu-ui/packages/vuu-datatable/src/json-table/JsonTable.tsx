import { TableProps } from "@vuu-ui/vuu-table";
import { JsonData, registerComponent } from "@vuu-ui/vuu-utils";
import { Table } from "@vuu-ui/vuu-table";
import { JsonDataSource } from "@vuu-ui/vuu-data-local";
import { useEffect, useMemo, useRef } from "react";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { JsonCell } from "./JsonCell";

registerComponent("json", JsonCell, "cell-renderer");

export interface JsonTableProps
  extends Omit<TableProps, "config" | "dataSource"> {
  config?: Pick<
    TableConfig,
    "columnSeparators" | "rowSeparators" | "zebraStripes"
  >;
  source: JsonData;
}

export const JsonTable = ({
  config,
  source: sourceProp,
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
      columnSeparators: true,
      rowSeparators: true,
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
    <Table
      {...tableProps}
      config={tableConfig}
      dataSource={dataSourceRef.current}
      showColumnHeaderMenus={false}
      selectionModel="none"
    />
  );
};
