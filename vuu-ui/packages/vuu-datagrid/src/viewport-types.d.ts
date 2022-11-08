interface ViewportProps {
  columnDragData?: ColumnDragData;
  gridModel: GridModel;
  onColumnDrop?: onColumnDragHandler;
  onColumnDragStart?: any;
  ref?: React.Ref<any>;
}

type Viewport = React.FC<ViewportProps>;
