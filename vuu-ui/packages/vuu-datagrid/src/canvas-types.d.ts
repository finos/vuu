type ToggleStrategy = {
  expand_level_1?: false;
};

interface CanvasProps {
  columnGroupIdx: number;
  contentHeight: number;
  firstVisibleRow: number;
  gridModel: GridModel;
  height: number;
  horizontalScrollbarHeight: number;
  onColumnDragStart?: onColumnDragStart;
  ref?: CanvasRef;
  data: {rows: Row[], offset: number};
  toggleStrategy: ToggleStrategy;
}

type Canvas = React.ForwardRefExoticComponent<CanvasProps>;
