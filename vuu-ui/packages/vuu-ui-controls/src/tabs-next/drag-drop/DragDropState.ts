import { DragEvent } from "react";
import { Direction, MouseOffset } from "../hooks/dragDropTypes";
import { orientationType } from "@finos/vuu-utils";

export interface IDragDropState {
  direction?: Direction;
  draggedElement?: HTMLElement;
  dragContainerElement?: HTMLElement;
  x: number;
  y: number;
}

export const NullDragState: IDragDropState = {
  x: -1,
  y: -1,
};

export type DragDropStateProps = {
  event: DragEvent;
  draggedElement: HTMLElement;
  dragContainerElement: HTMLElement;
  orientation: orientationType;
  onEnterDragContainer?: () => void;
  onLeaveDragContainer?: () => void;
  onReverseDirection?: (direction: Direction) => void;
};

export type ContainerBounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

const nullContainerBounds: ContainerBounds = {
  bottom: -1,
  left: -1,
  right: -1,
  top: -1,
};

export class DragDropState implements IDragDropState {
  #containerBounds = nullContainerBounds;
  #direction: Direction | undefined;
  /** The drag container, for Tabs it will be the TabList. */
  #dragContainerElement: HTMLElement | undefined;
  /** Distance between start (top | left) of dragged element and point where user pressed to drag */
  readonly mouseOffset: MouseOffset;
  #orientation: orientationType;
  #withinContainerX = true;
  #withinContainerY = true;
  #x = -1;
  #y = -1;
  #onEnterDragContainer: undefined | (() => void);
  #onLeaveDragContainer: undefined | (() => void);
  #onReverseDirection: undefined | ((direction: Direction) => void);

  /** Element being dragged, (initial element cloned and rendered in portal). */
  draggedElement: HTMLElement | undefined;

  payload: unknown = null;

  constructor({
    event: e,
    draggedElement,
    dragContainerElement,
    orientation = "horizontal",
    onEnterDragContainer,
    onLeaveDragContainer,
    onReverseDirection,
  }: DragDropStateProps) {
    this.draggedElement = draggedElement;
    this.dragContainerElement = dragContainerElement;
    this.mouseOffset = this.getMouseOffset(e, draggedElement);
    this.#orientation = orientation;
    this.#onEnterDragContainer = onEnterDragContainer;
    this.#onLeaveDragContainer = onLeaveDragContainer;
    this.#onReverseDirection = onReverseDirection;
  }

  /** Used to capture a ref to the Draggable JSX.Element */
  setDraggable = (el: HTMLElement | undefined) => {
    this.draggedElement = el;
  };

  get dragContainerElement() {
    return this.#dragContainerElement;
  }

  set dragContainerElement(el: HTMLElement | undefined) {
    this.#dragContainerElement = el;
    this.#containerBounds = this.getContainerBounds();
  }

  setPayload(payload: unknown) {
    this.payload = payload;
  }

  get direction() {
    return this.#direction;
  }
  set direction(direction: Direction | undefined) {
    if (this.#direction !== direction) {
      if (direction && this.#direction) {
        this.#onReverseDirection?.(direction);
      }
      this.#direction = direction;
    }
  }

  get x() {
    return this.#x;
  }
  set x(value: number) {
    const { left, right } = this.#containerBounds;
    //TODO take mouse offset into account
    this.withinContainerX = value >= left && value <= right;
    if (
      this.#orientation === "horizontal" &&
      value !== this.#x &&
      this.withinContainer
    ) {
      this.direction = value > this.#x ? "fwd" : "bwd";
    }
    this.#x = value;
  }

  get y() {
    return this.#y;
  }
  set y(value: number) {
    const { bottom, top } = this.#containerBounds;
    this.withinContainerY = value >= top && value <= bottom;
    if (
      this.#orientation === "vertical" &&
      value !== this.#y &&
      this.withinContainer
    ) {
      this.direction = value > this.#y ? "fwd" : "bwd";
    }
    this.#y = value;
  }

  // TODO once we're outside the contaoiner, we can stop listening for every draf event and just wait for dragEnmter
  private set withinContainerX(value: boolean) {
    if (value !== this.#withinContainerX) {
      this.#withinContainerX = value;
      if (value && this.#withinContainerY) {
        this.#onEnterDragContainer?.();
      } else {
        this.#onLeaveDragContainer?.();
      }
    }
  }
  // TODO once we're outside the contaoiner, we can stop listening for every draf event and just wait for dragEnmter
  private set withinContainerY(value: boolean) {
    if (value !== this.#withinContainerY) {
      this.#withinContainerY = value;
      if (value && this.#withinContainerX) {
        this.#onEnterDragContainer?.();
      } else {
        this.#onLeaveDragContainer?.();
      }
    }
  }

  get withinContainer() {
    return this.#withinContainerX && this.#withinContainerY;
  }

  private getMouseOffset(e: DragEvent, dragElement: HTMLElement) {
    const { clientX, clientY } = e;
    const draggableRect = dragElement.getBoundingClientRect();

    return {
      x: clientX - draggableRect.left,
      y: clientY - draggableRect.top,
    };
  }

  private getContainerBounds() {
    const container = this.draggedElement?.parentElement;
    if (container) {
      const { bottom, left, right, top } = container.getBoundingClientRect();
      return { bottom, left, right, top };
    } else {
      const { clientHeight, clientWidth } = document.body;
      return { bottom: clientHeight, left: 0, right: clientWidth, top: 0 };
    }
  }
}
