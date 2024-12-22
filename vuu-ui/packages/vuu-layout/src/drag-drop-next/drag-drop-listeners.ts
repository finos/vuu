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

export function initializeDragContainer(
  containerEl: HTMLElement | null,
  dragContext: DragContext,
  orientation: orientationType = "horizontal",
) {
  const dragId = containerEl?.id ?? `drag-container-${++dragContainerInc}`;
  const spaceMan = new SpaceMan(dragId, orientation);
  spaceMan.setDragContainer(containerEl);

  const onDragStart = (e: DragEvent) => {
    const element = getDraggableEl(e.target);
    if (element) {
      const index = getDataIndex(element);
      e.stopPropagation();
      spaceMan.dragStart(index);
      dragContext.beginDrag(e, {
        id: dragId,
        element,
        index,
        label: dragId,
        type: "component",
      });
    }
  };

  const onDragEnter = (e: DragEvent) => {
    console.log(`[drag-drop-listeners] onDragEnter`);
    // don't think we need this check. DragEnter wouldn't be firing
    // if we weren't in a drop zone
    e.stopPropagation();
    if (isDraggable(e.target)) {
      console.log("onDragEnter");
      const index = getDropTargetIndex(e.target);
      const { dragSource, x, y } = dragContext;
      if (index !== -1 && index !== dragSource?.index) {
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
    dragContext.x = e.clientX;
    dragContext.y = e.clientY;
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: DragEvent) => {
    const container = queryClosest(e.relatedTarget, ".vuuDragContainer");
    if (container === null) {
      spaceMan.leaveDragContainer();
    }
  };

  const onDrop = async (e: DragEvent) => {
    const { clientX, clientY } = e;
    e.stopPropagation();
    console.log("[drag-drop-listeners] drop");
    await spaceMan.drop(clientX, clientY);
    dragContext.drop({
      toId: dragId,
      toIndex: spaceMan.toIndex,
    });
  };
  const onDragEnd = () => {
    console.log("dragend");
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
