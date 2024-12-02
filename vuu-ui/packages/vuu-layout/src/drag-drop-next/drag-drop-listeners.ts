import { orientationType, queryClosest } from "@finos/vuu-utils";
import { DragContext } from "./DragContextNext";
import { SpaceMan } from "./SpaceMan";

let dragContainerInc = 0;

const isDraggable = (
  target: EventTarget | HTMLElement | null,
): target is HTMLElement => {
  const el = target as HTMLElement;
  return el !== null && queryClosest(el, '[draggable="true"]') !== null;
};

const getDraggableEl = (target: EventTarget | HTMLElement | null) => {
  const el = target as HTMLElement;
  if (el === null) {
    return null;
  } else if (el?.classList.contains("vuuDraggableItem")) {
    return el;
  } else {
    return queryClosest(el, ".vuuDraggableItem");
  }
};

const getDataIndex = (el: HTMLElement | null) =>
  el ? parseInt(el.dataset.index ?? "-1") : -1;

const getDropTargetIndex = (target: EventTarget | HTMLElement | null) =>
  getDataIndex(getDraggableEl(target));

type DragState = {
  draggedIndex: number;
  dragImage: HTMLElement | undefined;
  x: number;
  y: number;
};

export function initializeDragContainer(
  containerEl: HTMLElement | null,
  dragContext: DragContext,
  orientation: orientationType = "horizontal",
) {
  const dragState: DragState = {
    draggedIndex: -1,
    dragImage: undefined,
    x: -1,
    y: -1,
  };
  const dragId = containerEl?.id ?? `drag-container-${++dragContainerInc}`;
  const spaceMan = new SpaceMan(dragId, orientation);
  spaceMan.setDragContainer(containerEl);

  const onDragStart = (e: DragEvent) => {
    console.log(`DragStart`);

    const draggableEl = getDraggableEl(e.target);
    if (draggableEl) {
      const index = getDataIndex(draggableEl);
      e.stopPropagation();
      dragState.draggedIndex = index;
      dragState.x = e.clientX;
      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", String(index));
        e.dataTransfer.effectAllowed = "move";
      }
      spaceMan.dragStart(index);
      // this should be where we store the dragItem, then all
      // SpaceMan instances will have access to it. Right now,
      // we store it on every SpaceMan
      dragContext.beginDrag(dragId, draggableEl, index);
    }
  };

  const onDragEnter = (e: DragEvent) => {
    if (dragContext.withinDropZone(e.target)) {
      e.stopPropagation();
      if (isDraggable(e.target)) {
        console.log("onDragEnter");
        const index = getDropTargetIndex(e.target);
        const { draggedIndex, x, y } = dragState;
        if (index !== -1 && index !== draggedIndex) {
          const direction =
            orientation === "horizontal"
              ? e.clientX > x
                ? "fwd"
                : "bwd"
              : e.clientY > y
                ? "fwd"
                : "bwd";
          spaceMan.dragEnter(index, direction);
        }
      }
    }
    dragState.x = e.clientX;
    dragState.y = e.clientY;
  };

  const onDragLeave = (e: DragEvent) => {
    const container = queryClosest(e.relatedTarget, ".vuuDragContainer");
    if (container === null) {
      spaceMan.leaveDragContainer();
    }
  };

  const onDragOver = (e: DragEvent) => {
    if (dragContext.canDropHere(e.target)) {
      e.preventDefault();
    }
  };

  const onDrop = async ({ clientX, clientY }: DragEvent) => {
    await spaceMan.drop(clientX, clientY);
    dragContext.drop({
      toId: dragId,
      toIndex: spaceMan.toIndex,
    });
  };
  const onDragEnd = () => {
    if (!dragContext.dropped) {
      spaceMan.dragEnd();
    }
  };

  const onMouseDown = ({ clientX, clientY, target }: MouseEvent) => {
    // TODO we will need to get the actual draggable, before measuring
    const draggable = getDraggableEl(target);
    if (draggable) {
      const { left, top } = draggable.getBoundingClientRect();
      spaceMan.mouseOffset = {
        x: clientX - left,
        y: clientY - top,
      };
    }
  };

  containerEl?.addEventListener("mousedown", onMouseDown);
  containerEl?.addEventListener("dragstart", onDragStart);
  containerEl?.addEventListener("dragenter", onDragEnter);
  containerEl?.addEventListener("dragleave", onDragLeave);
  containerEl?.addEventListener("dragover", onDragOver);
  containerEl?.addEventListener("drop", onDrop);
  containerEl?.addEventListener("dragend", onDragEnd);

  function cleanUp() {
    containerEl?.removeEventListener("mousedown", onMouseDown);
    containerEl?.removeEventListener("dragstart", onDragStart);
    containerEl?.removeEventListener("dragenter", onDragEnter);
    containerEl?.removeEventListener("dragleave", onDragLeave);
    containerEl?.removeEventListener("dragover", onDragOver);
    containerEl?.removeEventListener("drop", onDrop);
    containerEl?.removeEventListener("dragend", onDragEnd);
  }

  return cleanUp;
}
