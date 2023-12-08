import { TableCellRendererProps } from "packages/vuu-datagrid-types";
/**
 * A memo compare function for cell renderers. Can be used to suppress
 * render where column and data are both unchanged. Avoids render
 * when row changes, where changes in row are unrelated to this cell.
 */
export const dataAndColumnUnchanged = (
  p: TableCellRendererProps,
  p1: TableCellRendererProps
) =>
  p.column === p1.column &&
  p.row[p.columnMap[p.column.name]] === p1.row[p1.columnMap[p1.column.name]];
