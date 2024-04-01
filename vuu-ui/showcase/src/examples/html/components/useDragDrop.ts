import {
  DragEventHandler,
  MouseEventHandler,
  useCallback,
  useRef,
} from "react";
import { DragDropState } from "./DragDropState";

export const useDragDrop = () => {
  const dragDropStateRef = useRef<DragDropState | null>(null);

  const onDragStart = useCallback<DragEventHandler>((e) => {
    const target = e.target as HTMLElement;
    const dolly = document.getElementById("dragImage") as HTMLElement;
    const dragDropState = (dragDropStateRef.current = new DragDropState(
      e,
      target
    ));
    e.dataTransfer.setData("text/plain", "1");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(
      dolly,
      dragDropState.mouseOffset.x,
      dragDropState.mouseOffset.y
    );
    requestAnimationFrame(() => {
      (e.target as HTMLElement).classList.add("dragging");
    });
  }, []);

  const onDragEnd = useCallback<DragEventHandler>((e) => {
    (e.target as HTMLElement).classList.remove("dragging");
    console.log(`onDragEnd dropEffect ${e.dataTransfer.dropEffect}`, {
      e,
    });
  }, []);
  const onDragEnter = useCallback<DragEventHandler>((e) => {
    console.log(`onDragEnter ${e.target.className}`);
    (e.target as HTMLElement).classList.add("over");
  }, []);
  const onDragLeave = useCallback<DragEventHandler>((e) => {
    console.log(`onDragLeave ${e.target.className}`);
    (e.target as HTMLElement).classList.remove("over");
  }, []);
  const onDragOver = useCallback<DragEventHandler>((e) => {
    console.log(`onDragOver ${e.target.className}`);
    e.preventDefault();
  }, []);
  const onDrop = useCallback<DragEventHandler>((e) => {
    console.log("onDrop", {
      e,
    });
    e.stopPropagation();

    const data = e.dataTransfer.getData("text/plain");
    console.log(`dropped ${data}`);
    return false;
  }, []);

  const onMouseDown = useCallback<MouseEventHandler>((e) => {
    const el = e.target as HTMLElement;
    console.log(`mousedown ${el.className}`);
    const dolly = document.getElementById("dragImage") as HTMLElement;
    const { height, width } = el.getBoundingClientRect();
    dolly.innerHTML = el.outerHTML;
    dolly.style.cssText = `position: absolute; left: 0px;height:${height}px;width:${width}px`;
  }, []);

  return {
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDragStart,
    onDragOver,
    onDrop,
    onMouseDown,
  };
};
