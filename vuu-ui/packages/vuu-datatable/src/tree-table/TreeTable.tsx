import { TableProps } from "@vuu-ui/vuu-table";
import { Table } from "@vuu-ui/vuu-table";
import { TreeDataSource } from "@vuu-ui/vuu-data-local";
import { useMemo, useRef } from "react";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import {
  metadataKeys,
  type RowToObjectMapper,
  type TreeSourceNode,
} from "@vuu-ui/vuu-utils";

const { DEPTH, IS_LEAF, KEY, IDX, SELECTED } = metadataKeys;

interface Props extends Omit<TableProps, "config" | "dataSource"> {
  config?: Pick<
    TableConfig,
    "columnSeparators" | "rowSeparators" | "zebraStripes"
  >;
  dataSource?: TreeDataSource;
  source?: TreeSourceNode[];
}

export type TreeTableProps = Props &
  ({ dataSource: TreeDataSource } | { source: TreeSourceNode[] });

const rowToTreeNodeObject: RowToObjectMapper = (row, columnMap) => {
  const { [IS_LEAF]: isLeaf, [KEY]: key, [IDX]: index, [DEPTH]: depth } = row;
  const firstColIdx = columnMap.nodeData;
  const labelColIdx = firstColIdx + depth;

  return {
    key,
    index,
    isGroupRow: !isLeaf,
    isSelected: row[SELECTED] !== 0,
    data: {
      label: row[labelColIdx],
      nodeData: row[firstColIdx],
    },
  };
};

export const TreeTable = ({
  config,
  dataSource,
  source,
  ...tableProps
}: TreeTableProps) => {
  const dataSourceRef = useRef<TreeDataSource>(undefined);
  useMemo(() => {
    if (dataSource) {
      dataSourceRef.current = dataSource;
    } else if (source) {
      dataSourceRef.current = new TreeDataSource({
        data: source,
      });
    } else {
      throw Error(`TreeTable either source or dataSource must be provided`);
    }
  }, [dataSource, source]);

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      ...config,
      columns: dataSourceRef.current?.columnDescriptors ?? [],
      columnSeparators: false,
      selectionBookendWidth: 0,
      rowSeparators: false,
    };
  }, [config]);

  console.log({ tableConfig, dataSource: dataSourceRef.current });

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
    />
  );
};
