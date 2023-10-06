import { MouseOffset } from "./dragDropTypesNext";

export class DragDropState {
  /** Distance between start (top | left) of dragged element and point where user pressed to drag */
  readonly mouseOffset: MouseOffset;
  /** Element where the initial mousedown triggered the drag operation */
  readonly initialDragElement: HTMLElement;
  /** Element being dragged, (initial element cloned and rendered in portal). */
  draggableElement: HTMLElement | null = null;

  payload: unknown = null;

  constructor(evt: MouseEvent, dragElement: HTMLElement) {
    this.initialDragElement = dragElement;
    this.mouseOffset = this.getMouseOffset(evt, dragElement);
  }

  /** Used to capture a ref to the Draggable JSX.Element */
  setDraggable = (el: HTMLElement) => {
    this.draggableElement = el;
  };

  setPayload(payload: unknown) {
    this.payload = payload;
  }

  private getMouseOffset(evt: MouseEvent, dragElement: HTMLElement) {
    const { clientX, clientY } = evt;
    const draggableRect = dragElement.getBoundingClientRect();

    return {
      x: clientX - draggableRect.left,
      y: clientY - draggableRect.top,
    };
  }
}
