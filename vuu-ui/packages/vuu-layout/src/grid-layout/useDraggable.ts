import {
  DragEvent,
  DragEventHandler,
  MouseEventHandler,
  useCallback,
} from "react";

export interface DraggableHookProps {
  getPayload: (evt: DragEvent<Element>) => [string, string];
}

export const useDraggable = ({ getPayload }: DraggableHookProps) => {
  const onDragStart = useCallback<DragEventHandler>(
    (e) => {
      console.log("drag start");
      const [type, payload] = getPayload(e);
      e.dataTransfer.setData(type, payload);
      e.dataTransfer.effectAllowed = "move";
    },
    [getPayload]
  );

  const onDragEnd = useCallback<DragEventHandler>((e) => {
    (e.target as HTMLElement).classList.remove("dragging");
    console.log(
      `%conDragEnd dropEffect ${e.dataTransfer.dropEffect}`,
      "color: brown",
      {
        e,
      }
    );
  }, []);

  const onMouseDown = useCallback<MouseEventHandler>((e) => {
    const el = e.target as HTMLElement;
    const dolly = document.getElementById("dragImage") as HTMLElement;
    const { height, width } = el.getBoundingClientRect();
    dolly.innerHTML = el.outerHTML;
    dolly.style.cssText = `position: absolute; left: 0px;height:${height}px;width:${width}px`;
  }, []);

  return {
    onDragEnd,
    onDragStart,
    onMouseDown,
  };
};
