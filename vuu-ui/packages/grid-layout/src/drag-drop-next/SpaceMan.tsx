import type { RefCallback } from "react";
import {
  asInteger,
  isValidNumber,
  type orientationType,
} from "@vuu-ui/vuu-utils";
import type { DragContext, DropPosition } from "./DragContextNext";

export type State = "initial" | "away" | "1spacer" | "2spacer";

type Direction = "fwd" | "bwd";

export class SpaceMan {
  #dragContext: DragContext;
  #dragItem: HTMLElement | undefined;
  #dragContainer: HTMLElement | null = null;
  #dragStartTimer: ReturnType<typeof setTimeout> | undefined;
  #dragSize = 0;
  #dragOperation: "local" | "remote" | "none" = "none";
  #fromIndex: string | number | undefined;
  #mouseOffset: { x: number; y: number } = { x: 0, y: 0 };
  #orientation: orientationType;
  #sizeProperty: "height" | "width";
  #spacer1 = this.createDragSpacer();
  #spacer2 = this.createDragSpacer();
  // TODO do we still need this state
  #state: State = "initial";
  #toDirection: Direction | undefined;
  #toIndex: string | number | undefined = undefined;
  #withinDragContainer = false;

  constructor(
    dragContext: DragContext,
    public id: string,
    orientation: orientationType = "horizontal",
  ) {
    this.#dragContext = dragContext;
    this.#orientation = orientation;
    this.#sizeProperty = orientation === "horizontal" ? "width" : "height";
  }

  get mouseOffset() {
    return this.#mouseOffset;
  }
  set mouseOffset(offset: { x: number; y: number }) {
    this.#mouseOffset = offset;
  }

  get dropPosition(): DropPosition | undefined {
    // console.log("[SpaceMan] get dropPosition");
    const dropTargetSpacer = this.#dragContainer?.querySelector(
      '[data-drop-target="true"]',
    );
    if (dropTargetSpacer) {
      let siblingElement = dropTargetSpacer.nextElementSibling as HTMLElement;
      if (siblingElement) {
        return {
          position: "before",
          target: siblingElement.dataset.label ?? siblingElement.id,
        };
      }

      siblingElement = dropTargetSpacer.previousElementSibling as HTMLElement;
      if (siblingElement === this.#dragItem) {
        siblingElement = siblingElement.previousElementSibling as HTMLElement;
      }
      if (siblingElement) {
        return {
          position: "after",
          target: siblingElement.dataset.label ?? siblingElement.id,
        };
      }

      return undefined;
    }
    return undefined;
  }

  get positionRelativeToTargetTab(): "before" | "after" {
    return "before";
  }

  setDragContainer: RefCallback<HTMLElement> = (el: HTMLElement | null) => {
    this.#dragContainer = el;
  };

  enterDragContainer() {
    this.#withinDragContainer = true;

    // create spacers
  }

  leaveDragContainer() {
    // TODO we need to undo this at end of drag operation
    // this.freezeContainer();
    this.#withinDragContainer = false;
    this.#state = "away";
    this.setSpacerSizes(0, 0);
    //TODO is the timeout just to allow the spacer rezuse to animate ?
    // seems to work without it
    setTimeout(() => {
      // TODO deal with situation where item re-enters before this happens
      this.clearSpacers();
    }, 200);
  }

  dragStart(index: number | string) {
    const item = this.#dragContainer?.querySelector(
      `[data-index="${index}"]`,
    ) as HTMLElement;
    if (item) {
      this.clearDragStartTimer();
      this.#dragContainer?.classList.add("vuuDragContainer-dragging");
      const propertyName = this.#sizeProperty;
      const { [propertyName]: size } = item.getBoundingClientRect();
      this.#dragSize = size;
      this.#dragOperation = "local";
      this.#withinDragContainer = true;
      this.#dragStartTimer = setTimeout(() => {
        this.#dragStartTimer = undefined;
        this.#spacer1.style[propertyName] = `${size}px`;
        this.#spacer1.dataset.dropTarget = "true";
        item?.after(this.#spacer1);
        this.#dragItem = item;
        item.classList.add("vuuDraggableItem-hidden");
        if (!this.#withinDragContainer) {
          // Item has been dragged straight out of container
          // Delay this slightly more than RequestAnimationFrame. Avoids
          // skipping animation completely where user drags item very quickly
          // out of container.
          this.setSpacerSizes(0, 0, 30);
        }
      }, 60);
      this.#state = "1spacer";
      this.#fromIndex = index;
    } else {
      throw Error(`[SpaceMan] spaceOut no item at index[${index}]`);
    }
  }

  dragEnter(index: number, direction: Direction) {
    const propertyName = this.#sizeProperty;
    if (index === this.#toIndex && direction === this.#toDirection) {
      return;
    }
    // we need to use ID rather than index, index is only meaningful
    // within a tabs/list drag operation
    if (this.#withinDragContainer === false) {
      this.#toIndex =
        // we will not have #fromIndex if dragged item is from another container
        index > asInteger(this.#fromIndex, Number.MAX_SAFE_INTEGER)
          ? index - 1
          : index;
      this.enterDragContainer();
      this.insertSpacer(index, this.#dragContext.dragLabelWidth, direction);

      if (this.#dragOperation === "none") {
        this.#dragOperation = "remote";
      }
    } else {
      this.#toIndex = index;
      this.#toDirection = direction;

      const item = this.#dragContainer?.querySelector(
        `[data-index="${index}"]`,
      );
      if (item) {
        if (this.#dragOperation === "none") {
          this.#dragOperation = "remote";
          this.insertSpacer(index, 100);
        } else {
          if (direction === "fwd") {
            if (this.#state === "1spacer") {
              item.after(this.#spacer2);
              this.#state = "2spacer";
              this.setSpacerSizes(0, this.#dragSize);
            } else if (this.#state === "2spacer") {
              if (this.#spacer1.style[propertyName] === "0px") {
                item.after(this.#spacer1);
                this.setSpacerSizes(this.#dragSize, 0);
              } else {
                item.after(this.#spacer2);
                this.setSpacerSizes(0, this.#dragSize);
              }
            }
          } else {
            if (this.#state === "1spacer") {
              item.before(this.#spacer2);
              this.#state = "2spacer";
              this.setSpacerSizes(0, this.#dragSize);
            } else if (this.#state === "2spacer") {
              if (this.#spacer1.style[propertyName] === "0px") {
                item.before(this.#spacer1);
                this.setSpacerSizes(this.#dragSize, 0);
              } else {
                item.before(this.#spacer2);
                this.setSpacerSizes(0, this.#dragSize);
              }
            }
          }
        }
      } else {
        throw Error(`[SpaceMan] dragEnter no item at index[${index}]`);
      }
    }
  }

  insertSpacer(
    index: number | string,
    size: number,
    direction: Direction = "bwd",
  ) {
    if (this.#state === "initial" || this.#state === "away") {
      const item = this.#dragContainer?.querySelector(
        `[data-index="${index}"]`,
      );
      if (item) {
        this.#dragSize = size;
        if (direction === "fwd") {
          item.after(this.#spacer1);
        } else {
          item.before(this.#spacer1);
        }
        this.#state = "1spacer";
        this.setSpacerSizes(size);
      } else {
        throw Error(`[SpaceMan] inject no item at index[${index}]`);
      }
    } else {
      throw Error(
        `can only inject drag content when state is "initial" or "away", found "${this.#state}"`,
      );
    }
  }

  private clearSpacers() {
    const propertyName = this.#sizeProperty;
    this.#spacer1.remove();
    this.#spacer2.remove();
    this.#spacer1.style[propertyName] = "0px";
    this.#spacer2.style[propertyName] = "0px";
  }

  private clearDragStartTimer() {
    if (this.#dragStartTimer !== undefined) {
      clearTimeout(this.#dragStartTimer);
      this.#dragStartTimer = undefined;
    }
  }

  cleanup() {
    this.clearDragStartTimer();
    this.clearSpacers();
    this.#dragContainer?.classList.remove("vuuDragContainer-dragging");

    if (this.#dragItem) {
      this.#dragItem.classList.remove("vuuDraggableItem-hidden");
      this.#dragItem.classList.remove("vuuDraggableItem-settling");
      this.#dragItem.classList.remove("vuuDraggableItem-animating");
      this.#dragItem.style.left = "";
      this.#dragItem.style.top = "";
      this.#dragItem.style.transform = "";
      this.#dragItem.style.width = "";
      this.#dragItem = undefined;
    }
    this.#dragOperation = "none";
    this.#fromIndex = undefined;
    this.#state = "initial";
    this.#toDirection = undefined;
    this.#toIndex = undefined;
    this.#withinDragContainer = false;
  }

  drop(x: number, y: number): Promise<void> {
    // TODO dragItem should be passed in
    // console.log(`[SpaceMan#${this.id}] drop, returns a promise`, {
    //   dragItem: this.#dragItem,
    // });
    return new Promise((resolve) => {
      if (this.#dragItem) {
        const dragItem = this.#dragItem;

        const settleComplete = () => {
          dragItem.removeEventListener("transitionend", settleComplete);
          this.cleanup();
          // this.unfreezeContainer();
          resolve();
        };

        dragItem?.classList.replace(
          "vuuDraggableItem-hidden",
          "vuuDraggableItem-settling",
        );

        const { left: containerLeft, top: containerTop } =
          this.getPositionOfDragContainer();
        const { left, top, width } = this.getPositionOfDropTarget();
        if (this.#orientation === "vertical") {
          dragItem.style.width = `${width}px`;
        }
        dragItem.style.left = `${left - containerLeft}px`;
        dragItem.style.top = `${top - containerTop}px`;

        const offsetLeft = x - this.#mouseOffset.x - left - 1;
        const offsetTop = y - this.#mouseOffset.y - top - 1;

        dragItem.style.transform = `translate(${offsetLeft}px, ${offsetTop}px)`;

        this.#dragContainer?.classList.remove("vuuDragContainer-dragging");

        requestAnimationFrame(() => {
          dragItem?.classList.add("vuuDraggableItem-animating");
          dragItem.addEventListener("transitionend", settleComplete);
          dragItem.style.transform = `translate(${0}px, ${0}px)`;
        });
      } else {
        // remote drag
        this.cleanup();
        resolve();
      }
    });
  }

  private getPositionOfDragContainer() {
    if (this.#dragContainer) {
      const { left, top } = this.#dragContainer.getBoundingClientRect();
      return { left, top };
    } else {
      throw Error("[SpaceMan] getPositionOfDragContainer, no drag container");
    }
  }

  private getPositionOfDropTarget(index = 0): {
    left: number;
    top: number;
    width: number;
  } {
    const spacer = index === 0 ? this.#spacer1 : this.#spacer2;
    const {
      [this.#sizeProperty]: size,
      left,
      top,
      width,
    } = spacer.getBoundingClientRect();
    if (size === 0) {
      if (index === 0) {
        return this.getPositionOfDropTarget(1);
      } else {
        throw Error("no spacer with expected width");
      }
    } else {
      return { left, top, width };
    }
  }

  private setSpacerSizes(size1: number, size2?: number, timeout = 0) {
    const propertyName = this.#sizeProperty;
    setTimeout(() => {
      if (this.#spacer1.parentNode === null) {
        // do nothing
      } else {
        this.#spacer1.style[propertyName] = `${size1}px`;
        this.#spacer1.dataset.dropTarget = size1 > 0 ? "true" : "false";
        if (isValidNumber(size2)) {
          this.#spacer2.style[propertyName] = `${size2}px`;
          this.#spacer2.dataset.dropTarget = size2 > 0 ? "true" : "false";
        }
      }
    }, timeout);
  }

  private createDragSpacer() {
    const spacer = document.createElement("div");
    spacer.className = "SpaceMan";
    return spacer;
  }
}
