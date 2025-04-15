import { DragEventHandler, useCallback } from "react";

export const useGridSplitter = () => {
  const handleDragStart = useCallback<DragEventHandler>((evt) => {
    console.log(`[useGridSplitterResizingNext] handleDragStart`);
    evt.stopPropagation();
  }, []);
  const handleDrag = useCallback<DragEventHandler>((evt) => {
    console.log(`[useGridSplitterResizingNext] handleDrag`);
    evt.stopPropagation();
  }, []);
  const handleDragEnd = useCallback<DragEventHandler>((evt) => {
    console.log(`[useGridSplitterResizingNext] handleDragEnd`);
    evt.stopPropagation();
  }, []);

  return {
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  };
};
