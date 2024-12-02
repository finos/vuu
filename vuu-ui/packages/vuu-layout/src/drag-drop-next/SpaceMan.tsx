import { RefCallback } from "react";
import { asInteger, isValidNumber, orientationType } from "@finos/vuu-utils";

export type State = "initial" | "away" | "1spacer" | "2spacer";

type Direction = "fwd" | "bwd";

export class SpaceMan {
  #dragItem: HTMLElement | undefined;
  #dragContainer: HTMLElement | null = null;
  #dragSize = 0;
  #dragOperation: "local" | "remote" | "none" = "none";
  #fromIndex: string | number | undefined;
  #mouseOffset: { x: number; y: number } = { x: 0, y: 0 };
  #orientation: orientationType;
  #sizeProperty: "height" | "width";
  #spacer1 = this.createDragSpacer(true);
  #spacer2 = this.createDragSpacer();
  #state: State = "initial";
  #toDirection: Direction | undefined;
  #toIndex: string | number | undefined = undefined;
  #transitioning: [number, number | undefined] | false = false;
  #withinDragContainer = false;

  constructor(
    public id: string,
    orientation: orientationType = "horizontal",
  ) {
    this.#orientation = orientation;
    this.#sizeProperty = orientation === "horizontal" ? "width" : "height";
  }

  get fromIndex() {
    return asInteger(this.#fromIndex);
  }
  get toIndex() {
    return asInteger(this.#toIndex);
  }

  get mouseOffset() {
    return this.#mouseOffset;
  }
  set mouseOffset(offset: { x: number; y: number }) {
    this.#mouseOffset = offset;
  }

  set transitioning(value: [number, number | undefined] | false) {
    this.#transitioning = value;
  }

  setDragContainer: RefCallback<HTMLElement> = (el: HTMLElement | null) => {
    this.#dragContainer = el;
  };

  enterDragContainer() {
    console.log(`%cEnterDragContainer`, "color:red;font-weight:bold;");
    this.#withinDragContainer = true;

    // create spacers
  }

  leaveDragContainer() {
    console.log(`%cLeaveDragContainer`, "color:red;font-weight:bold;");
    // TODO we need to undo this at end of drag operation
    this.freezeContainer();
    this.#withinDragContainer = false;
    this.#state = "away";
    this.setSpacerSizes(0, 0);
    setTimeout(() => {
      // TODO deal with situation where item re-enters before this happens
      this.clearSpacers();
    }, 300);
  }

  dragStart(index: number | string) {
    console.log("[SpaceMan] dragStart");
    const item = this.#dragContainer?.querySelector(
      `[data-index="${index}"]`,
    ) as HTMLElement;
    if (item) {
      this.#dragContainer?.classList.add("vuuDragContainer-dragging");
      const propertyName = this.#sizeProperty;
      const { [propertyName]: size } = item.getBoundingClientRect();
      this.#dragSize = size;
      this.#dragOperation = "local";
      this.#withinDragContainer = true;
      setTimeout(() => {
        item.classList.add("vuuDraggableItem-hidden");

        this.#spacer1.style[propertyName] = `${size}px`;
        item?.before(this.#spacer1);
        this.#dragItem = item;
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

  insertSpacer(index: number | string, size: number) {
    if (this.#state === "initial" || this.#state === "away") {
      const item = this.#dragContainer?.querySelector(
        `[data-index="${index}"]`,
      );
      if (item) {
        this.#dragSize = size;
        item?.before(this.#spacer1);
        this.#state = "1spacer";
        this.setSpacerSizes(size);
      } else {
        throw Error(`[SpaceMan] inject no item at index[${index}]`);
      }
    } else {
      throw Error(
        'can only inject drag content when state is "initial" or "away"',
      );
    }
  }

  private freezeContainer() {
    if (this.#dragContainer) {
      const { width } = this.#dragContainer.getBoundingClientRect();
      this.#dragContainer.style.width = `${width}px`;
    }
  }
  private unfreezeContainer() {
    if (this.#dragContainer) {
      this.#dragContainer.style.width = "";
    }
  }

  // If the index is same as existing value, direction has changed, an
  // offset will apply, depending on direction.
  private getDropTargetIndex(index: number, direction: Direction) {
    if (index === this.#toIndex) {
      if (direction === "fwd") {
        return index + 1;
      } else {
        return index - 1;
      }
    } else {
      return index;
    }
  }

  dragEnter(index: number, direction: Direction) {
    const propertyName = this.#sizeProperty;
    if (index === this.#toIndex && direction === this.#toDirection) {
      return;
    }
    const dropTargetIndex = this.getDropTargetIndex(index, direction);

    if (this.#withinDragContainer === false) {
      this.#toIndex =
        dropTargetIndex > asInteger(this.#fromIndex, Number.MAX_SAFE_INTEGER)
          ? dropTargetIndex - 1
          : dropTargetIndex;
      this.enterDragContainer();
      this.insertSpacer(index, 100);
    } else {
      this.#toIndex = dropTargetIndex;
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
                if (this.#transitioning) {
                  item.before(this.#spacer1);
                  item.after(this.#spacer2);
                } else {
                  item.after(this.#spacer1);
                  this.setSpacerSizes(this.#dragSize, 0);
                }
              } else {
                if (this.#transitioning) {
                  item.before(this.#spacer2);
                  item.after(this.#spacer1);
                } else {
                  item.after(this.#spacer2);
                  this.setSpacerSizes(0, this.#dragSize);
                }
              }
            }
          } else {
            if (this.#state === "1spacer") {
              item.before(this.#spacer2);
              this.#state = "2spacer";
              this.setSpacerSizes(0, this.#dragSize);
            } else if (this.#state === "2spacer") {
              if (this.#spacer1.style[propertyName] === "0px") {
                if (this.#transitioning) {
                  item.before(this.#spacer2);
                  item.after(this.#spacer1);
                } else {
                  item.before(this.#spacer1);
                  this.setSpacerSizes(this.#dragSize, 0);
                }
              } else {
                if (this.#transitioning) {
                  item.after(this.#spacer2);
                  item.before(this.#spacer1);
                } else {
                  item.before(this.#spacer2);
                  this.setSpacerSizes(0, this.#dragSize);
                }
              }
            }
          }
        }
      } else {
        throw Error(`[SpaceMan] dragEnter no item at index[${index}]`);
      }
    }
  }

  private clearSpacers() {
    const propertyName = this.#sizeProperty;
    this.#spacer1.remove();
    this.#spacer2.remove();
    this.#spacer1.style[propertyName] = "0px";
    this.#spacer2.style[propertyName] = "0px";
  }

  private cleanup() {
    console.log("cleanup");
    this.clearSpacers();

    if (this.#dragItem) {
      console.log("reset drag item");
      this.#dragItem.classList.remove("vuuDraggableItem-settling");
      this.#dragItem.classList.remove("vuuDraggableItem-animating");
      this.#dragItem.style.left = "";
      this.#dragItem.style.top = "";
      this.#dragItem.style.width = "";
      this.#dragItem = undefined;
    }
  }

  drop(x: number, y: number): Promise<void> {
    // TODO dragItem should be passed in
    return new Promise((resolve) => {
      if (this.#dragItem) {
        const dragItem = this.#dragItem;

        const settleComplete = () => {
          dragItem.removeEventListener("transitionend", settleComplete);
          this.cleanup();
          this.unfreezeContainer();
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

  dragEnd() {
    console.log("drag end");
    //TODO only if not dropped
    this.#dragContainer?.classList.remove("vuuDragContainer-dragging");
    // we need to do a bit more than this
    // this.#dragItem?.classList.remove("vuuDraggableItem-hidden");
    // this.#dragItem = undefined;
  }

  private alreadyScheduled(size1: number, size2?: number) {
    return (
      this.#transitioning &&
      this.#transitioning[0] === size1 &&
      this.#transitioning[1] === size2
    );
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
    console.log(`setSpacerSizes ${size1} ${size2}`);
    if (!this.alreadyScheduled(size1, size2)) {
      setTimeout(() => {
        if (this.#spacer1.parentNode === null) {
          // do nothing
          console.log("null parento");
        } else {
          console.log(
            `animate from ${this.#spacer1.style[propertyName]} ${this.#spacer2.style[propertyName]} to ${size1} ${size2}`,
          );
          this.transitioning = [size1, size2];
          this.#spacer1.style[propertyName] = `${size1}px`;
          if (isValidNumber(size2)) {
            this.#spacer2.style[propertyName] = `${size2}px`;
          }
        }
      }, timeout);
    } else console.log("already scheduled");
  }

  private createDragSpacer(trackTransitionEnd = false) {
    const spacer = document.createElement("div");
    spacer.className = "DragSpacer transitioning";
    if (trackTransitionEnd) {
      spacer.addEventListener("transitionend", () => {
        this.transitioning = false;
      });
    }
    return spacer;
  }
}
