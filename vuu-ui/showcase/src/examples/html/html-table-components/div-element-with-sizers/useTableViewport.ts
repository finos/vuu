import { ColumnDescriptor } from "@finos/vuu-datagrid-types";

export const useTableViewport = ({
  columns,
  headerHeight,
  rowCount,
  rowHeight,
  size,
}: {
  columns: ColumnDescriptor[];
  headerHeight: number;
  rowCount: number;
  rowHeight: number;
  size: {
    height: number;
    width: number;
  };
}) => {
  return {
    contentHeight: 30000,
    height: 700,
    visibleRowCount: 20,
  };
};
