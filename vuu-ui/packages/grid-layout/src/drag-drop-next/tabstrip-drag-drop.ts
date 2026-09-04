import { type orientationType, queryClosest } from "@vuu-ui/vuu-utils";
import type { DragContext, DropPosition } from "./DragContextNext";
import { SpaceMan } from "./SpaceMan";
import { sourceIsTabbedComponent } from "../GridLayoutContext";
import { getClosestGridLayout } from "../grid-dom-utils";

const isDraggable = (
  target: EventTarget | HTMLElement | null,
): target is HTMLElement => {
  const el = target as HTMLElement;
  return el !== null && queryClosest(el, '[draggable="true"]') !== null;
};

const getDraggableEl = (target: EventTarget | HTMLElement | null) => {
  const el = target as HTMLElement;
  if (isDraggable(target)) {
    if (el?.classList.contains("vuuDraggableItem")) {
      return el;
    } else {
      return queryClosest(el, ".vuuDraggableItem");
    }
  } else {
    return null;
  }
};

const isRemoteContainer = (
  sourceElement: HTMLElement,
  targetElement: HTMLElement,
) => {
  return sourceElement.parentElement !== targetElement?.parentElement;
};

const getDataIndex = (el: HTMLElement | null) =>
  el ? parseInt(el.dataset.index ?? "-1") : -1;

const getDataLabel = (el: HTMLElement | null) => el?.dataset.label ?? "";
const TAB_DRAG_ACTIVATION_DELAY = 150;

const eventTargetsGrid = (event: DragEvent, gridId: string) => {
  const target = event.target;
  return (
    target instanceof Element &&
    target.closest<HTMLElement>(".vuuGridLayout")?.id === gridId
  );
};

const getDropPositionAtEnd = (
  target: HTMLElement,
  containerEl: HTMLElement,
): DropPosition | undefined => {
  if (target.closest(".vuuDragContainer") !== containerEl) {
    return undefined;
  }

  const tabs = containerEl.querySelectorAll<HTMLElement>(
    ".vuuDraggableItem[data-label]",
  );
  const lastTab = tabs.item(tabs.length - 1);
  return lastTab
    ? {
        position: "after",
        target: lastTab.dataset.gridLayoutItemId ?? getDataLabel(lastTab),
      }
    : undefined;
};

export function initializeDragContainer(
  containerEl: HTMLElement,
  dragContext: DragContext,
  orientation: orientationType = "horizontal",
  tabsId = containerEl.id,
) {
  const gridId = getClosestGridLayout(containerEl);
  const spaceMan = new SpaceMan(dragContext, containerEl.id, orientation);
  spaceMan.setDragContainer(containerEl);
  let mouseDownAt: number | undefined;
  const unregisterDragStateCleanup = dragContext.registerDragStateCleanup(() =>
    spaceMan.cleanup(),
  );

  const focusDroppedTab = (tabsId: string, tabLabel: string) => {
    requestAnimationFrame(() => {
      const droppedTab = document
        .getElementById(tabsId)
        ?.querySelector(
          `[data-label="${tabLabel}"] .saltTabNextTrigger`,
        ) as HTMLButtonElement;
      droppedTab?.focus();
    });
  };

  const onDragStart = (e: DragEvent) => {
    if (
      mouseDownAt !== undefined &&
      performance.now() - mouseDownAt < TAB_DRAG_ACTIVATION_DELAY
    ) {
      e.preventDefault();
      e.stopPropagation();
      mouseDownAt = undefined;
      return;
    }
    mouseDownAt = undefined;
    const element = getDraggableEl(e.target);
    if (element) {
      const tabsContainer = queryClosest(e.target, ".vuuDragContainer", true);
      const gridLayout = queryClosest(tabsContainer, ".vuuGridLayout", true);
      const gridLayoutItem = queryClosest(
        tabsContainer,
        ".vuuGridLayoutItem",
        true,
      );
      const tabIndex = getDataIndex(element);
      const label = getDataLabel(element);
      const isSelectedTab =
        element.querySelector('[aria-selected="true"]') !== null;

      const { gridLayoutItemId } = element.dataset;
      e.stopPropagation();
      dragContext.beginDrag(e, {
        element,
        label,
        isSelectedTab,
        layoutId: gridLayout.id,
        tab: { id: gridLayoutItemId ?? "", label },
        tabIndex,
        tabsId: gridLayoutItem.id,
        type: "tabbed-component",
      });

      dragContext.detachTab(
        gridId,
        gridLayoutItem.id,
        gridLayoutItemId ?? "",
        label,
      );
      spaceMan.dragStart(tabIndex);
    }
  };

  const onDragEnter = (e: DragEvent) => {
    // we should really mark drop targets
    const dropTarget = getDraggableEl(e.target);
    // We always revent default here, that way useAsDropItem will know that another drag handler
    // is responsible for this area
    e.preventDefault();
    const { dragSource, x, y } = dragContext;
    if (dropTarget) {
      const indexOfDropTarget = getDataIndex(dropTarget);
      if (sourceIsTabbedComponent(dragSource)) {
        if (
          indexOfDropTarget !== -1 &&
          (indexOfDropTarget !== dragSource?.tabIndex ||
            isRemoteContainer(dragSource.element, dropTarget))
        ) {
          const direction =
            orientation === "horizontal"
              ? e.clientX > x
                ? "fwd"
                : "bwd"
              : e.clientY > y
                ? "fwd"
                : "bwd";

          spaceMan.dragEnter(indexOfDropTarget, direction);
        }
      } else {
        const direction =
          orientation === "horizontal"
            ? e.clientX > x
              ? "fwd"
              : "bwd"
            : e.clientY > y
              ? "fwd"
              : "bwd";

        spaceMan.dragEnter(indexOfDropTarget, direction);
      }
    } else if (
      dragSource &&
      !sourceIsTabbedComponent(dragSource) &&
      (e.target as HTMLElement).closest(".vuuDragContainer")
    ) {
      const tabs = containerEl.querySelectorAll<HTMLElement>(
        ".vuuDraggableItem[data-index]",
      );
      const lastTab = tabs.item(tabs.length - 1);
      const lastIndex = getDataIndex(lastTab);
      if (lastIndex !== -1) {
        spaceMan.dragEnter(lastIndex, "fwd");
      }
    }
    dragContext.x = e.clientX;
    dragContext.y = e.clientY;
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: DragEvent) => {
    // Have we dragged the draggable item right out of the parent drag container
    const container = queryClosest(e.relatedTarget, `#${spaceMan.id}`);
    if (container === null) {
      spaceMan.leaveDragContainer();
    }
  };

  const onDrop = async (e: DragEvent) => {
    if (!eventTargetsGrid(e, gridId)) {
      return;
    }
    if (dragContext.dropped) {
      spaceMan.cleanup();
      return;
    }
    if (e.defaultPrevented) {
      spaceMan.cleanup();
    } else {
      const { clientX, clientY } = e;
      e.preventDefault();
      e.stopPropagation();

      // important we capture this before calling spaceMan.drop
      const dropPosition =
        spaceMan.dropPosition ??
        getDropPositionAtEnd(e.target as HTMLElement, containerEl);

      if (dropPosition) {
        const droppedLabel = dragContext.dragSource?.label;
        if (sourceIsTabbedComponent(dragContext.dragSource)) {
          dragContext.beginDrop();
          await spaceMan.drop(clientX, clientY);
          dragContext.drop({
            tabsId,
            dropPosition,
          });
        } else {
          spaceMan.cleanup();
          dragContext.drop({
            tabsId,
            dropPosition,
          });
        }

        if (droppedLabel) {
          focusDroppedTab(tabsId, droppedLabel);
        }
        dragContext.endDrag();
      } else {
        spaceMan.cleanup();
      }
    }
  };
  const onDragEnd = () => {
    if (!dragContext.ownsDrag) {
      return;
    }
    if (!dragContext.dropped && !dragContext.dropPending) {
      dragContext.cancelDrag();
    } else if (dragContext.dropped) {
      dragContext.endDrag();
    }
  };

  const onMouseDown = (event: MouseEvent) => {
    const { clientX, clientY, target } = event;
    // TODO we will need to get the actual draggable, before measuring
    const draggable = getDraggableEl(target);
    if (draggable) {
      mouseDownAt = performance.now();
      const { left, top } = draggable.getBoundingClientRect();
      spaceMan.mouseOffset = {
        x: clientX - left,
        y: clientY - top,
      };
    }
  };
  const onMouseUp = () => {
    mouseDownAt = undefined;
  };

  containerEl?.addEventListener("mousedown", onMouseDown);
  document.body.addEventListener("mouseup", onMouseUp);
  containerEl?.addEventListener("dragstart", onDragStart);
  containerEl?.addEventListener("dragenter", onDragEnter);
  containerEl?.addEventListener("dragleave", onDragLeave);
  containerEl?.addEventListener("dragover", onDragOver);
  containerEl?.addEventListener("drop", onDrop);
  document.body.addEventListener("drop", onDrop);
  document.body.addEventListener("dragend", onDragEnd);

  function cleanUp() {
    unregisterDragStateCleanup();
    spaceMan.cleanup();
    containerEl?.removeEventListener("mousedown", onMouseDown);
    document.body.removeEventListener("mouseup", onMouseUp);
    containerEl?.removeEventListener("dragstart", onDragStart);
    containerEl?.removeEventListener("dragenter", onDragEnter);
    containerEl?.removeEventListener("dragleave", onDragLeave);
    containerEl?.removeEventListener("dragover", onDragOver);
    containerEl?.removeEventListener("drop", onDrop);
    document.body.removeEventListener("drop", onDrop);
    document.body.removeEventListener("dragend", onDragEnd);
  }

  return cleanUp;
}
