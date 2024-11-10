import { TableProps } from "@finos/vuu-table";
import { Table } from "@finos/vuu-table";
import { TreeDataSource } from "@finos/vuu-data-local";
import { useEffect, useMemo, useRef } from "react";
import { TableConfig } from "@finos/vuu-table-types";
import {
  isRowSelected,
  metadataKeys,
  type RowToObjectMapper,
  type TreeSourceNode,
} from "@finos/vuu-utils";

const { DEPTH, IS_LEAF, KEY, IDX } = metadataKeys;

export interface TreeTableProps
  extends Omit<TableProps, "config" | "dataSource"> {
  config?: Pick<
    TableConfig,
    "columnSeparators" | "rowSeparators" | "zebraStripes"
  >;
  source: TreeSourceNode[];
}

const rowToTreeNodeObject: RowToObjectMapper = (row, columnMap) => {
  const { [IS_LEAF]: isLeaf, [KEY]: key, [IDX]: index, [DEPTH]: depth } = row;
  const firstColIdx = columnMap.nodeData;
  const labelColIdx = firstColIdx + depth;

  return {
    key,
    index,
    isGroupRow: !isLeaf,
    isSelected: isRowSelected(row),
    data: {
      label: row[labelColIdx],
      nodeData: row[firstColIdx],
    },
  };
};

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
      rowToObject={rowToTreeNodeObject}
      showColumnHeaderMenus={false}
      selectionModel="single"
      selectionBookendWidth={0}
    />
  );
};
