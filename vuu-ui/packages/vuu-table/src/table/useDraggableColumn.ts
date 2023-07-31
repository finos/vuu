import { useDragDropNext as useDragDrop } from "@finos/vuu-ui-controls";
import { MouseEvent, useCallback, useRef } from "react";

type MousePos = {
  clientX: number;
  clientY: number;
  idx: string;
};

export interface DraggableColumnHookProps {
  onDrop: (fromIndex: number, toIndex: number) => void;
}

export const useDraggableColumn = ({ onDrop }: DraggableColumnHookProps) => {
  const mousePosRef = useRef<MousePos>();
  const containerRef = useRef<HTMLElement | null>(null);

  const handleDropSettle = useCallback(() => {
    console.log(`handleDropSettle`);
    mousePosRef.current = undefined;
    containerRef.current = null;
  }, []);

  const { draggable, draggedItemIndex, onMouseDown } = useDragDrop({
    // allowDragDrop: "drop-indicator",
    allowDragDrop: true,
    draggableClassName: "vuuTable-headerCell",
    orientation: "horizontal",
    containerRef,
    itemQuery: ".vuuTable-headerCell",
    onDrop,
    onDropSettle: handleDropSettle,
  });

  const onHeaderCellDragStart = useCallback(
    (evt: MouseEvent) => {
      const { clientX, clientY } = evt;
      console.log(
        `useDraggableColumn handleHeaderCellDragStart means mouseDown fired on a column in RowBasedTable`
      );
      const sourceElement = evt.target as HTMLElement;
      const columnHeaderCell = sourceElement.closest(".vuuTable-headerCell");
      containerRef.current = columnHeaderCell?.closest(
        "[role='row']"
      ) as HTMLDivElement;
      const {
        dataset: { idx = "-1" },
      } = columnHeaderCell as HTMLElement;
      mousePosRef.current = {
        clientX,
        clientY,
        idx,
      };
      onMouseDown?.(evt);
    },
    [onMouseDown]
  );

  // useLayoutEffect(() => {
  //   if (tableLayout === "column" && mousePosRef.current && !draggable) {
  //     const { clientX, clientY, idx } = mousePosRef.current;
  //     const target = tableContainerRef.current?.querySelector(
  //       `.vuuTable-table[data-idx="${idx}"]`
  //     ) as HTMLElement;
  //     if (target) {
  //       const evt = {
  //         persist: () => undefined,
  //         nativeEvent: {
  //           clientX,
  //           clientY,
  //           target,
  //         },
  //       };
  //       onMouseDown?.(evt as unknown as MouseEvent);
  //     }
  //   }
  // }, [draggable, onMouseDown, tableContainerRef, tableLayout]);

  return {
    draggable,
    draggedItemIndex,
    onHeaderCellDragStart,
  };
};
