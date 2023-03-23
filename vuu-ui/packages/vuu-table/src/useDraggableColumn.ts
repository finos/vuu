import { useDragDrop } from "@heswell/salt-lab";
import {
  MouseEvent,
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type MousePos = {
  clientX: number;
  clientY: number;
  idx: string;
};

export interface DraggableColumnHookProps {
  onDrop: (fromIndex: number, toIndex: number) => void;
  tableContainerRef: RefObject<HTMLDivElement>;
  tableLayout: "column" | "row";
}

export const useDraggableColumn = ({
  onDrop,
  tableContainerRef,
  tableLayout: tableLayoutProp,
}: DraggableColumnHookProps) => {
  const [tableLayout, setTableLayout] = useState(tableLayoutProp);
  const mousePosRef = useRef<MousePos>();

  const handleDropSettle = useCallback(() => {
    console.log(`handleDropSettle`);
    mousePosRef.current = undefined;
    setTableLayout("row");
  }, []);

  const { draggable, draggedItemIndex, onMouseDown } = useDragDrop({
    allowDragDrop: true,
    draggableClassName: "table-column",
    orientation: "horizontal",
    containerRef: tableContainerRef,
    itemQuery: ".vuuTable-table",
    onDrop,
    onDropSettle: handleDropSettle,
  });

  const handleHeaderCellDragStart = useCallback((evt: MouseEvent) => {
    const { clientX, clientY } = evt;
    console.log(
      `useDraggableColumn handleHeaderCellDragStart means mouseDown fired on a column in RowBasedTable`
    );
    const sourceElement = evt.target as HTMLElement;
    const thElement = sourceElement.closest(".vuuTable-headerCell");
    const {
      dataset: { idx = "-1" },
    } = thElement as HTMLElement;
    mousePosRef.current = {
      clientX,
      clientY,
      idx,
    };
    setTableLayout("column");
  }, []);

  useLayoutEffect(() => {
    if (tableLayout === "column" && mousePosRef.current && !draggable) {
      const { clientX, clientY, idx } = mousePosRef.current;
      const target = tableContainerRef.current?.querySelector(
        `.vuuTable-table[data-idx="${idx}"]`
      ) as HTMLElement;
      if (target) {
        const evt = {
          persist: () => undefined,
          nativeEvent: {
            clientX,
            clientY,
            target,
          },
        };
        onMouseDown?.(evt as unknown as MouseEvent);
      }
    }
  }, [draggable, onMouseDown, tableContainerRef, tableLayout]);

  return {
    draggable,
    draggedItemIndex,
    tableLayout,
    onHeaderCellDragStart:
      tableLayout === "row" ? handleHeaderCellDragStart : undefined,
  };
};
