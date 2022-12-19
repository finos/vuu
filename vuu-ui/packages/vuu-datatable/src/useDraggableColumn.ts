import { useDragDrop } from "@heswell/salt-lab";
import {
  MouseEvent,
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

export const useDraggableColumn = ({
  onDrop,
  tableContainerRef,
  tableLayout: tableLayoutProp,
}) => {
  const [tableLayout, setTableLayout] = useState(tableLayoutProp);
  const mousePosRef = useRef<MousePos>();

  const handleDropSettle = useCallback(() => {
    setTableLayout("row");
  }, []);

  const { draggable, draggedItemIndex, onMouseDown } = useDragDrop({
    allowDragDrop: true,
    draggableClassName: "table-column",
    orientation: "horizontal",
    containerRef: tableContainerRef,
    itemQuery: ".vuuDataTable-table",
    onDrop,
    onDropSettle: handleDropSettle,
  });

  const handleHeaderCellDragStart = useCallback((evt: MouseEvent) => {
    const { clientX, clientY } = evt;
    const {
      dataset: { idx = "-1" },
    } = evt.target as HTMLElement;
    mousePosRef.current = {
      clientX,
      clientY,
      idx,
    };
    setTableLayout("column");
  }, []);

  useLayoutEffect(() => {
    if (tableLayout === "column" && mousePosRef.current) {
      const { clientX, clientY, idx } = mousePosRef.current;
      const target = tableContainerRef.current?.querySelector(
        `.vuuDataTable-table[data-idx="${idx}"]`
      ) as HTMLElement;
      if (target) {
        const evt = {
          persist: () => console.log("persist"),
          nativeEvent: {
            clientX,
            clientY,
            target,
          },
        };
        onMouseDown?.(evt as unknown as MouseEvent);
      }
    }
  }, [onMouseDown, tableContainerRef, tableLayout]);

  return {
    draggable,
    draggedItemIndex,
    tableLayout,
    handleHeaderCellDragStart,
  };
};
