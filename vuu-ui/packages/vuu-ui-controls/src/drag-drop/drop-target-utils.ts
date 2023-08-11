import { orientationType } from "@finos/vuu-utils";
import { ViewportRange } from "./dragDropTypesNext";
import { Direction, Rect } from "./dragDropTypesNext";

const LEFT_RIGHT = ["left", "right"];
const TOP_BOTTOM = ["top", "bottom"];
// duplicated in repsonsive

export const NOT_OVERFLOWED = ":not(.wrapped)";
export const NOT_HIDDEN = ':not([aria-hidden="true"])';

export type MeasuredDropTarget = {
  /** 
    The index position currently occupied by this item. If draggable 
    is dropped here, this will be the destination drop position.
  */
  currentIndex: number;
  dataIndex?: number;
  element: HTMLElement;
  id: string;
  index: number;
  isDraggedItem: boolean;
  isLast?: boolean;
  isOverflowIndicator?: boolean;
  start: number;
  end: number;
  mid: number;
  size: number;
};

export type targetType = {
  element: HTMLElement | null;
  index: number;
  isLast?: boolean;
};

/** clones and removes id */
export const cloneElement = <T extends HTMLElement>(element: T): T => {
  const dolly = element.cloneNode(true) as T;
  // TOSO should we care about nested id values - perhaps an additional param, defaulting to false ?
  dolly.removeAttribute("id");
  // Set index to -1 in case a moueMove event as we wait for drop to take effect might set highlighted
  // index to wrong value (see useList) -1 will be ignored;
  dolly.dataset.index = "-1";
  return dolly;
};

type MousePosKey = keyof Pick<MouseEvent, "clientX" | "clientY">;
type DOMRectKey = keyof Omit<DOMRect, "toJSON">;
type DOMRectDimensionKey = keyof Pick<DOMRect, "width" | "height">;
type Dimension = keyof Pick<DOMRect, "width" | "height">;
type ElementDimension = keyof Pick<
  HTMLElement,
  | "scrollHeight"
  | "scrollWidth"
  | "clientHeight"
  | "clientWidth"
  | "scrollTop"
  | "scrollLeft"
>;

type ElementPosition = "x" | "y";

export const measureElementSizeAndPosition = (
  element: HTMLElement,
  dimension: Dimension = "width",
  includeAutoMargin = false
) => {
  const pos = dimension === "width" ? "left" : "top";
  const { [dimension]: size, [pos]: position } =
    element.getBoundingClientRect();
  const { padEnd = false, padStart = false } = element.dataset;
  const style = getComputedStyle(element);
  const [start, end] = dimension === "width" ? LEFT_RIGHT : TOP_BOTTOM;
  const marginStart =
    padStart && !includeAutoMargin
      ? 0
      : parseInt(style.getPropertyValue(`margin-${start}`), 10);
  const marginEnd =
    padEnd && !includeAutoMargin
      ? 0
      : parseInt(style.getPropertyValue(`margin-${end}`), 10);

  let minWidth = size;
  const flexShrink = parseInt(style.getPropertyValue("flex-shrink"), 10);
  if (flexShrink > 0) {
    const flexBasis = parseInt(style.getPropertyValue("flex-basis"), 10);
    if (!isNaN(flexBasis) && flexBasis > 0) {
      minWidth = flexBasis;
    }
  }
  return [position, marginStart + minWidth + marginEnd];
};

const DIMENSIONS = {
  horizontal: {
    CLIENT_POS: "clientX" as MousePosKey,
    CLIENT_SIZE: "clientWidth" as ElementDimension,
    CONTRA: "top" as DOMRectKey,
    CONTRA_CLIENT_POS: "clientY" as MousePosKey,
    CONTRA_END: "bottom" as DOMRectDimensionKey,
    CONTRA_POS: "y" as ElementPosition,
    DIMENSION: "width" as DOMRectDimensionKey,
    END: "right" as DOMRectKey,
    POS: "x" as ElementPosition,
    SCROLL_POS: "scrollLeft" as ElementDimension,
    SCROLL_SIZE: "scrollWidth" as ElementDimension,
    START: "left" as DOMRectKey,
  },
  vertical: {
    CLIENT_POS: "clientY" as MousePosKey,
    CLIENT_SIZE: "clientHeight" as ElementDimension,
    CONTRA: "left" as DOMRectKey,
    CONTRA_CLIENT_POS: "clientX" as MousePosKey,
    CONTRA_END: "right" as DOMRectDimensionKey,
    CONTRA_POS: "x" as ElementPosition,
    DIMENSION: "height" as DOMRectDimensionKey,
    END: "bottom" as DOMRectKey,
    POS: "y" as ElementPosition,
    SCROLL_POS: "scrollTop" as ElementDimension,
    SCROLL_SIZE: "scrollHeight" as ElementDimension,
    START: "top" as DOMRectKey,
  },
};
export const dimensions = (orientation: orientationType) =>
  DIMENSIONS[orientation];

export const getItemById = (
  measuredItems: MeasuredDropTarget[],
  id: string
) => {
  const result = measuredItems.find((item) => item.id === id);
  if (result) {
    return result;
  }
  // else {
  //   throw Error(`measuredItems do not contain an item with id #${id}`);
  // }
};

export const removeDraggedItem = (
  measuredItems: MeasuredDropTarget[],
  index: number
) => {
  measuredItems.splice(index, 1);
  for (let i = index; i < measuredItems.length; i++) {
    measuredItems[i].currentIndex -= 1;
  }
};

export type dropZone = "start" | "end";

export const measureDropTargets = (
  container: HTMLElement,
  orientation: orientationType,
  itemQuery?: string,
  viewportRange?: ViewportRange,
  draggedItemId?: string
) => {
  const dragThresholds: MeasuredDropTarget[] = [];
  const { DIMENSION } = dimensions(orientation);
  const children = Array.from(
    itemQuery ? container.querySelectorAll(itemQuery) : container.children
  );

  const itemCount = children.length;
  const start =
    typeof viewportRange?.from === "number"
      ? viewportRange.atEnd
        ? Math.max(0, viewportRange.from - 1)
        : viewportRange.from
      : 0;
  const end =
    typeof viewportRange?.to === "number"
      ? Math.min(viewportRange.to + 2, itemCount - 1)
      : itemCount - 1;
  for (let index = start; index <= end; index++) {
    const element = children[index] as HTMLElement;
    const [start, size] = measureElementSizeAndPosition(element, DIMENSION);
    const isLast = index === itemCount - 1;
    const id = element.id;

    const dataIndex = parseInt(element.dataset.index ?? "-1");

    dragThresholds.push({
      currentIndex: index,
      dataIndex: isNaN(dataIndex) ? -1 : dataIndex,
      id,
      index,
      isDraggedItem: draggedItemId === id,
      isLast,
      isOverflowIndicator: element.dataset.index === "overflow",
      element: element as HTMLElement,
      start,
      end: start + size,
      size,
      mid: start + size / 2,
    });
  }
  return dragThresholds;
};

/**
  The index of the dropped item is its array offset within the
  dropTargets. If there is no scrolling involved, this will be
  the same as the 'absolute' index position. If the dropTargets have
  been scrolled, though, we will only have a window of the full
  dataset, corresponding to the current scroll viewport. In that case
  we need to determine the offset and factor that into the 'absolute'
  index.
 */
export const getIndexOfDraggedItem = (
  dropTargets: MeasuredDropTarget[],
  absoluteIndex = false
) => {
  const indexOfDraggedItem = dropTargets.findIndex((d) => d.isDraggedItem);
  const { index: draggedItemOriginalIndex } = dropTargets[indexOfDraggedItem];
  if (absoluteIndex) {
    const minIndex = dropTargets
      .filter((d) => !d.isDraggedItem)
      .reduce((min, d) => Math.min(min, d.index), Number.MAX_SAFE_INTEGER);
    const scrolled =
      minIndex > 0 && !(draggedItemOriginalIndex === 0 && minIndex === 1);
    if (scrolled) {
      return minIndex + indexOfDraggedItem;
    }
  }
  return indexOfDraggedItem;
};

// As the draggedItem is moved, displacing existing items, mirror
// the movements within the dropTargets collection
export const mutateDropTargetsSwitchDropTargetPosition = (
  dropTargets: MeasuredDropTarget[],
  direction: Direction
) => {
  // console.log(`switchDropTargetPosition
  //   direction: ${direction} ${dropTargetsDebugString(dropTargets)}`);

  const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
  const indexOfTarget =
    direction === "fwd" ? indexOfDraggedItem + 1 : indexOfDraggedItem - 1;

  if (indexOfTarget < 0 || indexOfTarget >= dropTargets.length) {
    throw Error("switchDropTargetPosition index out of range");
  }

  const draggedItem = dropTargets.at(indexOfDraggedItem) as MeasuredDropTarget;
  const targetItem = dropTargets.at(indexOfTarget) as MeasuredDropTarget;

  const diff = targetItem.size - draggedItem.size;

  if (direction === "fwd") {
    const draggedStart = targetItem.start + diff;
    const draggedEnd = targetItem.end;

    const newDraggedItem = {
      ...draggedItem,
      start: draggedStart,
      mid: Math.floor(draggedStart + (draggedEnd - draggedStart) / 2),
      end: draggedEnd,
    } as MeasuredDropTarget;

    const targetStart = draggedItem.start;
    const targetEnd = draggedItem.end + diff;

    const newTargetItem = {
      ...targetItem,
      start: targetStart,
      mid: Math.floor(targetStart + (targetEnd - targetStart) / 2),
      end: targetEnd,
    } as MeasuredDropTarget;
    dropTargets.splice(indexOfDraggedItem, 2, newTargetItem, newDraggedItem);
  } else {
    const draggedStart = targetItem.start;
    const draggedEnd = targetItem.end - diff;

    const newDraggedItem = {
      ...draggedItem,
      start: draggedStart,
      mid: Math.floor(draggedStart + (draggedEnd - draggedStart) / 2),
      end: draggedEnd,
    } as MeasuredDropTarget;

    const targetStart = draggedItem.start - diff;
    const targetEnd = draggedItem.end;

    const newTargetItem = {
      ...targetItem,
      start: targetStart,
      mid: Math.floor(targetStart + (targetEnd - targetStart) / 2),
      end: targetEnd,
    } as MeasuredDropTarget;
    dropTargets.splice(indexOfTarget, 2, newDraggedItem, newTargetItem);
  }

  // console.log(`${direction} ${dropTargetsDebugString(dropTargets)}`);
};

export const getNextDropTarget = (
  dropTargets: MeasuredDropTarget[],
  pos: number,
  mouseMoveDirection: Direction
): MeasuredDropTarget => {
  const len = dropTargets.length;
  const indexOfDraggedItem = getIndexOfDraggedItem(dropTargets);
  const draggedItem = dropTargets[indexOfDraggedItem];

  if (mouseMoveDirection === "fwd") {
    const leadingEdge = Math.round(pos + draggedItem.size);
    for (let index = len - 1; index >= 0; index--) {
      const dropTarget = dropTargets[index];
      if (leadingEdge > dropTarget.mid) {
        if (index < indexOfDraggedItem) {
          return draggedItem;
        } else {
          return dropTarget;
        }
      }
    }
  } else {
    const leadingEdge = Math.round(pos);
    for (let index = 0; index < len; index++) {
      const dropTarget = dropTargets[index];
      if (leadingEdge < dropTarget.mid) {
        if (index > indexOfDraggedItem) {
          return draggedItem;
        } else {
          return dropTarget;
        }
      }
    }
  }
  throw Error("no dropTraget identified");
};

/**
 * An item within a scrollable container might have a width or height greater than that of
 * the container. If we drag such an item, we don't want the draggable to be larger than
 * the container.
 */
export function constrainRect(targetRect: Rect, constraintRect: Rect): Rect {
  const { height, left, top, width } = targetRect;
  const { height: constrainedHeight, width: constrainedWidth } = constraintRect;
  return {
    height: Math.min(height, constrainedHeight),
    left,
    top,
    width: Math.min(width, constrainedWidth),
  };
}

export const moveItem = <T = unknown>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] => {
  if (fromIndex === toIndex) {
    return items;
  } else {
    const newItems = items.slice();
    const [item] = newItems.splice(fromIndex, 1);
    if (toIndex === -1) {
      return newItems.concat(item);
    } else {
      const offset = toIndex > fromIndex ? 0 : 0;
      newItems.splice(toIndex + offset, 0, item);
      return newItems;
    }
  }
};

export const dropTargetsDebugString = (dropTargets: MeasuredDropTarget[]) =>
  dropTargets
    .map(
      (d, i) =>
        `\n${d.isDraggedItem ? "*" : " "}[${i}] width : ${Math.floor(
          d.size
        )}    ${Math.floor(d.start)} - ${Math.floor(d.end)} (mid ${Math.floor(
          d.mid
        )})`
    )
    .join("");
