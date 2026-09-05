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
const TAB_CLICK_MOVEMENT_TOLERANCE = 12;
const getDropPosition = (
  target: HTMLElement | null,
  clientX: number,
  clientY: number,
  orientation: orientationType,
): DropPosition | undefined => {
  const itemId = target?.dataset.gridLayoutItemId;
  if (!target || !itemId) {
    return undefined;
  }
  const rect = target.getBoundingClientRect();
  const after =
    orientation === "horizontal"
      ? clientX >= rect.left + rect.width / 2
      : clientY >= rect.top + rect.height / 2;
  return { position: after ? "after" : "before", target: itemId };
};

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

const getDropPositionAtPoint = (
  containerEl: HTMLElement,
  clientX: number,
  clientY: number,
  orientation: orientationType,
): DropPosition | undefined => {
  const tabs = [
    ...containerEl.querySelectorAll<HTMLElement>(
      ".vuuDraggableItem[data-grid-layout-item-id]",
    ),
  ];
  const target = tabs.reduce<HTMLElement | undefined>((closest, tab) => {
    if (!closest) {
      return tab;
    }
    const coordinate = orientation === "horizontal" ? clientX : clientY;
    const rect = tab.getBoundingClientRect();
    const closestRect = closest.getBoundingClientRect();
    const midpoint =
      orientation === "horizontal"
        ? rect.left + rect.width / 2
        : rect.top + rect.height / 2;
    const closestMidpoint =
      orientation === "horizontal"
        ? closestRect.left + closestRect.width / 2
        : closestRect.top + closestRect.height / 2;
    return Math.abs(coordinate - midpoint) <
      Math.abs(coordinate - closestMidpoint)
      ? tab
      : closest;
  }, undefined);
  return getDropPosition(target ?? null, clientX, clientY, orientation);
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
  let mouseDown: { tab: HTMLElement; x: number; y: number } | undefined;
  let tabDropTarget: HTMLElement | undefined;
  const clearTabDropTarget = () => {
    tabDropTarget?.classList.remove(
      "vuuTabDropTarget-after",
      "vuuTabDropTarget-before",
    );
    tabDropTarget = undefined;
  };
  const clearTabDropTargetAfterFrame = () => {
    const target = tabDropTarget;
    tabDropTarget = undefined;
    requestAnimationFrame(() => {
      target?.classList.remove(
        "vuuTabDropTarget-after",
        "vuuTabDropTarget-before",
      );
    });
  };
  const unregisterDragStateCleanup = dragContext.registerDragStateCleanup(
    () => {
      clearTabDropTargetAfterFrame();
      spaceMan.cleanup();
    },
  );

  const focusDroppedTab = (
    tabsId: string,
    itemId: string | undefined,
    tabLabel: string,
  ) => {
    requestAnimationFrame(() => {
      const selector = itemId
        ? `[data-grid-layout-item-id="${CSS.escape(itemId)}"] .saltTabNextTrigger`
        : `[data-label="${CSS.escape(tabLabel)}"] .saltTabNextTrigger`;
      const droppedTab = document
        .getElementById(tabsId)
        ?.querySelector(selector) as HTMLButtonElement;
      droppedTab?.focus();
    });
  };

  const onDragStart = (e: DragEvent) => {
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
          const position = getDropPosition(
            dropTarget,
            e.clientX,
            e.clientY,
            orientation,
          );
          clearTabDropTarget();
          if (position) {
            tabDropTarget = dropTarget;
            dropTarget.classList.add(`vuuTabDropTarget-${position.position}`);
          }
          const direction = position?.position === "after" ? "fwd" : "bwd";

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
    const dropTarget = getDraggableEl(e.target);
    if (dropTarget && sourceIsTabbedComponent(dragContext.dragSource)) {
      const position = getDropPosition(
        dropTarget,
        e.clientX,
        e.clientY,
        orientation,
      );
      clearTabDropTarget();
      if (position) {
        tabDropTarget = dropTarget;
        dropTarget.classList.add(`vuuTabDropTarget-${position.position}`);
      }
    } else if (sourceIsTabbedComponent(dragContext.dragSource)) {
      const position = getDropPositionAtPoint(
        containerEl,
        e.clientX,
        e.clientY,
        orientation,
      );
      const target = position
        ? containerEl.querySelector<HTMLElement>(
            `[data-grid-layout-item-id="${CSS.escape(position.target)}"]`,
          )
        : undefined;
      clearTabDropTarget();
      if (position && target) {
        tabDropTarget = target;
        target.classList.add(`vuuTabDropTarget-${position.position}`);
      }
    }
    e.preventDefault();
  };

  const onDragLeave = (e: DragEvent) => {
    // Have we dragged the draggable item right out of the parent drag container
    const container = queryClosest(e.relatedTarget, `#${spaceMan.id}`);
    if (container === null) {
      clearTabDropTarget();
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
    const { clientX, clientY } = e;
    const dropPosition =
      getDropPosition(
        getDraggableEl(e.target),
        clientX,
        clientY,
        orientation,
      ) ??
      getDropPositionAtPoint(containerEl, clientX, clientY, orientation) ??
      spaceMan.dropPosition ??
      getDropPositionAtEnd(e.target as HTMLElement, containerEl);

    if (!dropPosition) {
      spaceMan.cleanup();
    } else {
      e.preventDefault();
      e.stopPropagation();

      const source = dragContext.dragSource;
      const droppedLabel = source?.label;
      const droppedItemId = sourceIsTabbedComponent(source)
        ? source.tab.id
        : undefined;
      if (sourceIsTabbedComponent(source)) {
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
        focusDroppedTab(tabsId, droppedItemId, droppedLabel);
      }
      dragContext.endDrag();
    }
  };
  const onDragEnd = ({ clientX, clientY }: DragEvent) => {
    if (
      mouseDown &&
      Math.hypot(clientX - mouseDown.x, clientY - mouseDown.y) <=
        TAB_CLICK_MOVEMENT_TOLERANCE &&
      mouseDown.tab.ariaSelected !== "true"
    ) {
      mouseDown.tab.click();
    }
    mouseDown = undefined;
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
      const tab = draggable.querySelector<HTMLElement>('[role="tab"]');
      if (tab) {
        mouseDown = { tab, x: clientX, y: clientY };
      }
      const { left, top } = draggable.getBoundingClientRect();
      spaceMan.mouseOffset = {
        x: clientX - left,
        y: clientY - top,
      };
    }
  };
  const onMouseUp = ({ clientX, clientY }: MouseEvent) => {
    if (
      mouseDown &&
      Math.hypot(clientX - mouseDown.x, clientY - mouseDown.y) <=
        TAB_CLICK_MOVEMENT_TOLERANCE &&
      mouseDown.tab.ariaSelected !== "true"
    ) {
      mouseDown.tab.click();
    }
    mouseDown = undefined;
  };

  containerEl?.addEventListener("mousedown", onMouseDown, true);
  document.body.addEventListener("mouseup", onMouseUp);
  containerEl?.addEventListener("dragstart", onDragStart, true);
  containerEl?.addEventListener("dragenter", onDragEnter, true);
  containerEl?.addEventListener("dragleave", onDragLeave, true);
  containerEl?.addEventListener("dragover", onDragOver, true);
  containerEl?.addEventListener("drop", onDrop, true);
  document.body.addEventListener("dragend", onDragEnd);

  function cleanUp() {
    unregisterDragStateCleanup();
    clearTabDropTarget();
    spaceMan.cleanup();
    containerEl?.removeEventListener("mousedown", onMouseDown, true);
    document.body.removeEventListener("mouseup", onMouseUp);
    containerEl?.removeEventListener("dragstart", onDragStart, true);
    containerEl?.removeEventListener("dragenter", onDragEnter, true);
    containerEl?.removeEventListener("dragleave", onDragLeave, true);
    containerEl?.removeEventListener("dragover", onDragOver, true);
    containerEl?.removeEventListener("drop", onDrop, true);
    document.body.removeEventListener("dragend", onDragEnd);
  }

  return cleanUp;
}
