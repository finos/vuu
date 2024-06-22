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

//-----------------------------------

export type dragStrategy =
  | "drop-indicator"
  | "natural-movement"
  | "drag-copy"
  | "drop-only";

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
  revealOverflowedItems?: boolean;
}

export interface InternalDragHookResult
  extends Omit<DragHookResult, "isDragging" | "isScrolling"> {
  beginDrag: (dragElement: HTMLElement) => void;
  drag: (dragPos: number, mouseMoveDirection: "fwd" | "bwd") => void;
  drop: () => DropOptions;
  handleScrollStart?: (scrollDirection: "fwd" | "bwd") => void;
  handleScrollStop?: (
    scrollDirection: "fwd" | "bwd",
    _scrollPos: number,
    atEnd: boolean
  ) => void;
  /**
   * Draggable item has been dragged out of container. Remove any local drop
   * indicators. Dragged element itself should not yet be removed from DOM.
   */
  releaseDrag?: () => void;
}

export interface DropOptions {
  fromIndex: number;
  toIndex: number;
  isExternal?: boolean;
  payload?: unknown;
}

export type DropHandler = (options: DropOptions) => void;

export type DragDropContext = {
  dragElement: HTMLElement;
  dragPayload: unknown;
  mouseOffset: MouseOffset;
};
