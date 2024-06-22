import {
  DragEvent,
  DragEventHandler,
  MouseEventHandler,
  useCallback,
} from "react";
import {
  GridLayoutDragEndHandler,
  GridLayoutDragStartHandler,
} from "./GridLayoutProvider";

export interface DraggableHookProps {
  draggableClassName?: string;
  getPayload: (evt: DragEvent<Element>) => [string, string];
  onDragEnd?: GridLayoutDragEndHandler;
  onDragStart?: GridLayoutDragStartHandler;
}

export const useDraggable = ({
  draggableClassName,
  getPayload,
  onDragEnd,
  onDragStart,
}: DraggableHookProps) => {
  const handleDragStart = useCallback<DragEventHandler<HTMLElement>>(
    (e) => {
      const [type, payload] = getPayload(e);
      e.dataTransfer.setData(type, payload);
      e.dataTransfer.effectAllowed = "move";

      e.stopPropagation();

      // if (type === "text/plain") {
      onDragStart?.(e, payload);
      // }
    },
    [getPayload, onDragStart]
  );

  const handleDragEnd = useCallback<DragEventHandler<HTMLElement>>(
    (e) => {
      (e.target as HTMLElement).classList.remove("dragging");
      console.log(
        `%cuseDraggable onDragEnd dropEffect ${e.dataTransfer.dropEffect}`,
        "color: brown",
        {
          e,
        }
      );
      onDragEnd?.(e);
    },
    [onDragEnd]
  );

  const onMouseDown = useCallback<MouseEventHandler>((e) => {
    e.stopPropagation();
    // if (draggableClassName) {
    //   const layoutEl = queryClosest(e.target, ".vuuGridLayout");
    //   const draggableEl = queryClosest(e.target, `.${draggableClassName}`);
    //   if (layoutEl && draggableEl) {
    //     const gridLayoutBox = layoutEl.getBoundingClientRect();
    //     const gridLayoutItemBox = draggableEl.getBoundingClientRect();
    //     console.log({ box: gridLayoutItemBox });
    //     draggableEl.style.cssText = `position: absolute; left: ${
    //       gridLayoutItemBox.left - gridLayoutBox.left
    //     }px; top: ${gridLayoutItemBox.top - gridLayoutBox.top}px; width: ${
    //       gridLayoutItemBox.width
    //     }px; height: ${gridLayoutItemBox.height}px`;
    //   }
    // }
    // const el = e.target as HTMLElement;
    // const dolly = document.getElementById("dragImage") as HTMLElement;
    // const { height, width } = el.getBoundingClientRect();
    // dolly.innerHTML = el.outerHTML;
    // dolly.style.cssText = `position: absolute; left: 0px;height:${height}px;width:${width}px`;
  }, []);

  return {
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
    onMouseDown,
  };
};
