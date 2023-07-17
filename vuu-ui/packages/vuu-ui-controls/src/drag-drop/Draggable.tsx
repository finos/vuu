import { useForkRef } from "@salt-ds/core";
import { clsx } from "clsx";
import {
  CSSProperties,
  forwardRef,
  MutableRefObject,
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
    style: CSSProperties;
    scale?: number;
  }
>(function Draggable(
  { wrapperClassName, element, style, scale = 1 },
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
        className={clsx("vuuDraggable", ...makeClassNames(wrapperClassName))}
        ref={forkedRef}
        style={style}
      />
    </Portal>
  );
});

export const createDragSpacer = (
  transitioning?: MutableRefObject<boolean>
): HTMLElement => {
  const spacer = document.createElement("div");
  spacer.className = "vuuDraggable-spacer";
  if (transitioning) {
    spacer.addEventListener("transitionend", () => {
      transitioning.current = false;
    });
  }
  return spacer;
};
