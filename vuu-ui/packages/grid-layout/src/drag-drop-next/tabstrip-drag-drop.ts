import { orientationType, queryClosest } from "@finos/vuu-utils";
import { DragContext } from "./DragContextNext";
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

export function initializeDragContainer(
  containerEl: HTMLElement,
  dragContext: DragContext,
  orientation: orientationType = "horizontal",
) {
  const gridId = getClosestGridLayout(containerEl);
  const dragId = containerEl.id;
  const spaceMan = new SpaceMan(dragContext, dragId, orientation);
  spaceMan.setDragContainer(containerEl);

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
    const element = getDraggableEl(e.target);
    console.log(`[tabstrip-drag-dop#${gridId}] onDragStart`);
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

      requestAnimationFrame(() => {
        console.log(`[tabstrip-drag-dop#${gridId}]] onDragStart<RAF>`);
        spaceMan.dragStart(tabIndex);
        dragContext.detachTab(gridId, gridLayoutItem.id, label);
      });
    }
  };

  const onDragEnter = (e: DragEvent) => {
    // we should really mark drop targets
    const dropTarget = getDraggableEl(e.target);
    console.log(`[tabstrip-drag-dop#${dragId}] onDragEnter`);
    // We always revent default here, that way useAsDropItem will know that another drag handler
    // is responsible for this area
    e.preventDefault();
    const { dragSource, x, y } = dragContext;
    if (dropTarget) {
      console.log(
        `[tabstrip-drag-dop#${dragId}] onDragEnter ${dropTarget.className} preventDefault`,
      );
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
        console.log(`draging a componnet over a tabstrip`);

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
    }
    dragContext.x = e.clientX;
    dragContext.y = e.clientY;
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: DragEvent) => {
    console.log(
      `[tabstrip-drag-dop#${dragId}] onDragleave ${spaceMan.id}.${dragId}`,
    );
    // Have we dragged the draggable item right out of the parent drag container
    const container = queryClosest(e.relatedTarget, `#${spaceMan.id}`);
    if (container === null) {
      spaceMan.leaveDragContainer();
    }
  };

  const onDrop = async (e: DragEvent) => {
    if (e.defaultPrevented) {
      console.log(
        `[tabstrip-drag-dop#${dragId}] onDrop ${dragId} - already handled`,
      );
      spaceMan.cleanup();
    } else {
      const { clientX, clientY } = e;
      e.stopPropagation();

      // important we capture this before calling spaceMan.drop
      const { dropPosition } = spaceMan;

      console.log(
        `[tabstrip-drag-dop] onDrop #${dragId}  ${dropPosition?.position} targetTabId ${dropPosition?.target}`,
      );
      if (dropPosition) {
        await spaceMan.drop(clientX, clientY);
        dragContext.drop({
          tabsId: dragId,
          dropPosition,
        });

        if (dragContext.dragSource) {
          focusDroppedTab(dragId, dragContext.dragSource.label);
        }
      } else {
        console.log(`[tabstrip-drag-dop] onDrop, drop is elsewhere `);
        spaceMan.cleanup();
      }
    }
  };
  const onDragEnd = () => {
    // console.log(`[tabstrip-drag-dop#${dragId}] onDragEnd`, {
    //   dragSource: dragContext.dragSource,
    // });
    if (
      sourceIsTabbedComponent(dragContext.dragSource) &&
      dragContext.dragSource.tabsId === dragId
    ) {
      console.log(`[tabstrip-drag-dop#${dragId}] do we need to cleanup`);
    }
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

  console.log(`[tabstrip-drag-dop#${gridId}] register listeners`);
  containerEl?.addEventListener("mousedown", onMouseDown);
  containerEl?.addEventListener("dragstart", onDragStart);
  containerEl?.addEventListener("dragenter", onDragEnter);
  containerEl?.addEventListener("dragleave", onDragLeave);
  containerEl?.addEventListener("dragover", onDragOver);
  document.body.addEventListener("drop", onDrop);
  document.body.addEventListener("dragend", onDragEnd);

  function cleanUp() {
    console.log(`[tabstrip-drag-dop#${gridId}] unregister listeners`);
    containerEl?.removeEventListener("mousedown", onMouseDown);
    containerEl?.removeEventListener("dragstart", onDragStart);
    containerEl?.removeEventListener("dragenter", onDragEnter);
    containerEl?.removeEventListener("dragleave", onDragLeave);
    containerEl?.removeEventListener("dragover", onDragOver);
    document.body.removeEventListener("drop", onDrop);
    document.body.removeEventListener("dragend", onDragEnd);
  }

  return cleanUp;
}
