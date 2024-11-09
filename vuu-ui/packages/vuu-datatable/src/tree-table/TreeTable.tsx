import { TableProps } from "@finos/vuu-table";
import { Table } from "@finos/vuu-table";
import { TreeDataSource } from "@finos/vuu-data-local";
import { useEffect, useMemo, useRef } from "react";
import { TableConfig } from "@finos/vuu-table-types";
import { TreeSourceNode } from "@finos/vuu-utils";

export interface TreeTableProps
  extends Omit<TableProps, "config" | "dataSource"> {
  config?: Pick<
    TableConfig,
    "columnSeparators" | "rowSeparators" | "zebraStripes"
  >;
  source: TreeSourceNode[];
}

export const TreeTable = ({
  config,
  source: sourceProp,
  ...tableProps
}: TreeTableProps) => {
  const sourceRef = useRef(sourceProp);
  const dataSourceRef = useRef<TreeDataSource>();
  useMemo(() => {
    dataSourceRef.current = new TreeDataSource({
      data: sourceRef.current,
    });
  }, []);

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      ...config,
      columns: dataSourceRef.current?.columnDescriptors ?? [],
      columnSeparators: false,
      rowSeparators: false,
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
      className="vuuTreeTable"
      config={tableConfig}
      dataSource={dataSourceRef.current}
      groupToggleTarget="toggle-icon"
      navigationStyle="tree"
      showColumnHeaderMenus={false}
      selectionModel="single"
      selectionBookendWidth={0}
    />
  );
};
