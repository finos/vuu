import { useForkRef } from "@salt-ds/core";
import cx from "classnames";
import {
  CSSProperties,
  forwardRef,
  MutableRefObject,
  TransitionEventHandler,
  useCallback,
} from "react";
import { Portal } from "@finos/vuu-popups";

import "./Draggable.css";

const makeClassNames = (classNames: string) =>
  classNames.split(" ").map((className) => `vuuDraggable-${className}`);
export const Draggable = forwardRef<
  HTMLDivElement,
  {
    wrapperClassName: string;
    element: HTMLElement;
    onTransitionEnd?: TransitionEventHandler;
    scale?: number;
    style: CSSProperties;
  }
>(function Draggable(
  { wrapperClassName, element, onTransitionEnd, style, scale = 1 },
  forwardedRef
) {
  const callbackRef = useCallback(
    (el: HTMLDivElement) => {
      if (el) {
        el.innerHTML = "";
        el.appendChild(element);
        if (scale !== 1) {
          el.style.transform = `scale(${scale},${scale})`;
        }
      }
    },
    [element, scale]
  );
  const forkedRef = useForkRef<HTMLDivElement>(forwardedRef, callbackRef);

  return (
    <Portal>
      <div
        className={cx("vuuDraggable", ...makeClassNames(wrapperClassName))}
        ref={forkedRef}
        onTransitionEnd={onTransitionEnd}
        style={style}
      />
    </Portal>
  );
});

// const colors = ["black", "red", "green", "yellow"];
// let color_idx = 0;
export const createDragSpacer = (
  transitioning?: MutableRefObject<boolean>
): HTMLElement => {
  // const idx = color_idx++ % 4;

  const spacer = document.createElement("div");
  spacer.className = "vuuDraggable-spacer";
  if (transitioning) {
    spacer.addEventListener("transitionend", () => {
      transitioning.current = false;
    });
  }
  return spacer;
};

export const createDropIndicatorPosition = (): HTMLElement => {
  const spacer = document.createElement("div");
  spacer.className = "vuuDraggable-dropIndicatorPosition";
  return spacer;
};

export const createDropIndicator = (
  transitioning?: MutableRefObject<boolean>
): HTMLElement => {
  // const idx = color_idx++ % 4;
  const spacer = document.createElement("div");
  spacer.className = "vuuDraggable-dropIndicator";
  if (transitioning) {
    spacer.addEventListener("transitionend", () => {
      transitioning.current = false;
    });
  }
  return spacer;
};
