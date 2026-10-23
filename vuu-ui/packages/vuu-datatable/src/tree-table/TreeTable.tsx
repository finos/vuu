import type { TableProps } from "@vuu-ui/vuu-table";
import { Table } from "@vuu-ui/vuu-table";
import { TreeDataSource } from "@vuu-ui/vuu-data-local";
import { type ReactNode, useMemo } from "react";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";

interface Props extends Omit<TableProps, "config" | "dataSource"> {
  config?: Pick<
    TableConfig,
    "columnSeparators" | "rowSeparators" | "zebraStripes"
  >;
  dataSource?: TreeDataSource;
  /**
   * Content rendered at the end of each tree node, after the label,
   * e.g. a count, status indicator or action button.
   */
  renderNodeAdornment?: (dataRow: DataRow) => ReactNode;
  source?: TreeSourceNode[];
}

export type TreeTableProps = Props &
  ({ dataSource: TreeDataSource } | { source: TreeSourceNode[] });

export const TreeTable = ({
  className,
  config,
  dataSource: dataSourceProp,
  renderNodeAdornment,
  source,
  ...tableProps
}: TreeTableProps) => {
  const dataSource = useMemo(() => {
    if (dataSourceProp) {
      return dataSourceProp;
    } else if (source) {
      return new TreeDataSource({ data: source });
    } else {
      throw Error("TreeTable either source or dataSource must be provided");
    }
  }, [dataSourceProp, source]);

  const tableConfig = useMemo<TableConfig>(() => {
    const columns = renderNodeAdornment
      ? dataSource.columnDescriptors.map((column) =>
          column.hidden
            ? column
            : { ...column, getGroupAdornment: renderNodeAdornment },
        )
      : dataSource.columnDescriptors;
    return {
      ...config,
      columns,
      columnSeparators: false,
      selectionBookendWidth: 0,
      rowSeparators: false,
    };
  }, [config, dataSource, renderNodeAdornment]);

  return (
    <Table
      {...tableProps}
      className={cx("vuuTreeTable", className)}
      config={tableConfig}
      dataSource={dataSource}
      groupToggleTarget="toggle-icon"
      navigationStyle="tree"
      showColumnHeaderMenus={false}
      selectionModel="single"
    />
  );
};
