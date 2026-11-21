import { useForkRef } from "@salt-ds/core";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  CSSProperties,
  forwardRef,
  HTMLAttributes,
  MutableRefObject,
  RefCallback,
  TransitionEventHandler,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useThemeAttributes } from "@vuu-ui/vuu-utils";

import draggableCss from "./Draggable.css";

const makeClassNames = (classNames: string) =>
  classNames.split(" ").map((className) => `vuuDraggable-${className}`);

export interface DraggableProps extends HTMLAttributes<HTMLDivElement> {
  wrapperClassName: string;
  element: HTMLElement;
  onDropped?: () => void;
  onTransitionEnd?: TransitionEventHandler;
  scale?: number;
  style: CSSProperties;
}

export const Draggable = forwardRef<HTMLDivElement, DraggableProps>(
  function Draggable(
    { wrapperClassName, element, onDropped, onTransitionEnd, style, scale = 1 },
    forwardedRef,
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-draggable",
      css: draggableCss,
      window: targetWindow,
    });

    const handleVuuDrop = useCallback(() => {
      onDropped?.();
    }, [onDropped]);

    const callbackRef = useCallback<RefCallback<HTMLDivElement>>(
      (el: HTMLDivElement) => {
        if (el) {
          el.innerHTML = "";
          el.appendChild(element);
          if (scale !== 1) {
            el.style.transform = `scale(${scale},${scale})`;
          }
          el.addEventListener("vuu-dropped", handleVuuDrop);
        }
      },
      [element, handleVuuDrop, scale],
    );
    const forkedRef = useForkRef<HTMLDivElement>(forwardedRef, callbackRef);

    const [themeClass, densityClass, dataMode] = useThemeAttributes();

    // Rendered outside the app tree, so the theme classes are applied here
    return createPortal(
      <div
        className={cx("vuuDraggable-portal", themeClass, densityClass)}
        data-mode={dataMode}
      >
        <div
          className={cx("vuuDraggable", ...makeClassNames(wrapperClassName))}
          ref={forkedRef}
          onTransitionEnd={onTransitionEnd}
          style={style}
        />
      </div>,
      document.body,
    );
  },
);

// const colors = ["black", "red", "green", "yellow"];
// let color_idx = 0;
export const createDragSpacer = (
  transitioning?: MutableRefObject<boolean>,
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
  transitioning?: MutableRefObject<boolean>,
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
