
type gridHeight = number | string;
type gridWidth = any;

interface GridProps {
  className?: string;
  columns: ColumnDescriptor[];
  columnSizing? : ColumnSizing;
  dataSource: DataSource;
  defaultColumnWidth?: number;
  groupBy?: GroupBy;
  headerHeight?: number;
  height: gridHeight;
  minColumnWidth?: number;
  pivotBy?: GroupBy;
  rowHeight?: number;
  selectionModel?: SelectionModel;
  width: gridWidth;
}

type GridBase = React.FC<GridProps>;
