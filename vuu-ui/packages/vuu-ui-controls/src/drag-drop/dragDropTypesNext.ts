import { MouseEventHandler, RefObject } from "react";

//-----------------------------------
// From useScrollPosition in List
export type ViewportRange = {
  atEnd: boolean;
  atStart: boolean;
  from: number;
  to: number;
};

// From overflow types - probably don't need
type dimension = "width" | "height" | "scrollWidth" | "scrollHeight";

type dimensions = {
  size: dimension;
  depth: dimension;
  scrollDepth: dimension;
};

export type dimensionsType = {
  horizontal: dimensions;
  vertical: dimensions;
};

export type orientationType = keyof dimensionsType;
//-----------------------------------

export type dragStrategy = "drop-indicator" | "natural-movement";

export type Direction = "fwd" | "bwd";
export const FWD: Direction = "fwd";
export const BWD: Direction = "bwd";

export interface MouseOffset {
  x: number;
  y: number;
}

export type Rect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export interface DragHookResult {
  draggable?: JSX.Element;
  dropIndicator?: JSX.Element;
  draggedItemIndex?: number;
  isDragging: boolean;
  isScrolling: RefObject<boolean>;
  onMouseDown?: MouseEventHandler;
  revealOverflowedItems: boolean;
}

export interface InternalDragHookResult
  extends Omit<DragHookResult, "isDragging" | "isScrolling"> {
  beginDrag: (evt: MouseEvent) => void;
  drag: (dragPos: number, mouseMoveDirection: "fwd" | "bwd") => void;
  drop: () => void;
  handleScrollStart: () => void;
  handleScrollStop: (
    scrollDirection: "fwd" | "bwd",
    _scrollPos: number,
    atEnd: boolean
  ) => void;
}

export interface DragDropProps {
  allowDragDrop?: boolean | dragStrategy;
  /** this is the className that will be assigned during drag to the dragged element  */
  draggableClassName: string;
  extendedDropZone?: boolean;
  id?: string;
  isDragSource?: boolean;
  isDropTarget?: boolean;
  onDragStart?: () => void;
  onDrop: (fromIndex: number, toIndex: number) => void;
  onDropSettle?: (toIndex: number) => void;
  orientation: orientationType;
  containerRef: RefObject<HTMLElement>;
  itemQuery?: string;
  // selected?: CollectionItem<unknown> | CollectionItem<unknown>[] | null;
  viewportRange?: ViewportRange;
}

export type DragDropHook = (props: DragDropProps) => DragHookResult;

export interface InternalDragDropProps
  extends Omit<DragDropProps, "draggableClassName"> {
  draggableRef: RefObject<HTMLDivElement>;
  isDragSource?: boolean;
  isDropTarget?: boolean;
  selected?: unknown;
}
