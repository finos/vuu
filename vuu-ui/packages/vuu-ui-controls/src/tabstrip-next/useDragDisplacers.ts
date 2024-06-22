import type { orientationType } from "@finos/vuu-utils";
import { useCallback, useMemo, useRef } from "react";
import { Direction } from "./dragDropTypes";
import { createDragSpacer as createDragDisplacer } from "./Draggable";

export type DragDisplacersHookResult = {
  displaceItem: (
    draggedElement: HTMLElement,
    size: number,
    useTransition?: boolean,
    direction?: Direction | "static",
    orientation?: "horizontal" | "vertical"
  ) => void;
  clearSpacers: (useAnimation?: boolean) => void;
  /** Insert the sized spacer at start or end of collection */
  setTerminalSpacer: (
    container: HTMLElement,
    position: "start" | "end",
    size: number
  ) => void;
};

export type DragDisplacersHook = (
  orientation?: orientationType
) => DragDisplacersHookResult;
/**
 * Manage a pair of displacer elements to smoothly display a moving gap between
 * list items of any kind. Designed to be used in a drag drop operation. The 'static'
 * direction option should be used at drag start or following scroll.
 */
export const useDragDisplacers: DragDisplacersHook = (
  orientation = "horizontal"
) => {
  const animationFrame = useRef(0);
  const transitioning = useRef(false);

  const spacers = useMemo(
    // We only need to listen for transition end on one of the spacers
    () => [createDragDisplacer(transitioning), createDragDisplacer()],
    []
  );

  const animateTransition = useCallback(
    (size: number, propertyName = "width") => {
      const [spacer1, spacer2] = spacers;
      animationFrame.current = requestAnimationFrame(() => {
        transitioning.current = true;
        spacer1.style.cssText = `${propertyName}: 0px`;
        spacer2.style.cssText = `${propertyName}: ${size}px`;
        spacers[0] = spacer2;
        spacers[1] = spacer1;
      });
    },
    [spacers]
  );

  const clearSpacers = useCallback(
    (useTransition = false) => {
      if (useTransition === true) {
        const [spacer] = spacers;
        const cleanup = () => {
          spacer.removeEventListener("transitionend", cleanup);
          clearSpacers();
        };
        const propertyName = orientation === "horizontal" ? "width" : "height";
        spacer.addEventListener("transitionend", cleanup);
        animateTransition(0, propertyName);
      } else {
        spacers.forEach((spacer) => spacer.remove());
      }
    },
    [animateTransition, orientation, spacers]
  );

  const setTerminalSpacer = useCallback(
    (container: HTMLElement, position: "start" | "end", size: number) => {
      clearSpacers();

      const propertyName = orientation === "horizontal" ? "width" : "height";
      const [spacer] = spacers;
      spacer.style.cssText = `${propertyName}: ${size}px`;

      if (position === "start") {
        container.firstChild?.before(spacer);
      } else {
        container.lastChild?.after(spacer);
      }
    },
    [clearSpacers, orientation, spacers]
  );

  const cancelAnyPendingAnimation = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = 0;
    }
  }, []);

  const displaceLastItem = useCallback(
    (
      draggedElement: HTMLElement,
      size: number,
      useTransition = false,
      direction: Direction | "static" = "static"
    ) => {
      const propertyName = orientation === "horizontal" ? "width" : "height";
      const [spacer1, spacer2] = spacers;

      cancelAnyPendingAnimation();

      if (useTransition) {
        if (transitioning.current) {
          clearSpacers();
          spacer1.style.cssText = `${propertyName}: ${size}px`;
          spacer2.style.cssText = `${propertyName}: 0px`;
          draggedElement.before(spacer1);
          draggedElement.after(spacer2);
        } else {
          if (direction === "fwd") {
            draggedElement.after(spacer2);
          } else {
            draggedElement.before(spacer2);
          }
        }
        animateTransition(size, propertyName);
      } else {
        spacer1.style.cssText = `${propertyName}: ${size}px`;
        draggedElement.after(spacer1);
      }

      // return dropTarget.index;
    },
    [
      animateTransition,
      cancelAnyPendingAnimation,
      clearSpacers,
      orientation,
      spacers,
    ]
  );

  const displaceItem = useCallback(
    (
      displacedElement: HTMLElement,
      size: number,
      useTransition = false,
      direction: Direction | "static" = "static"
    ) => {
      if (
        displacedElement === displacedElement.parentElement?.lastElementChild
      ) {
        return displaceLastItem(
          displacedElement,
          size,
          useTransition,
          direction
        );
      }
      if (displacedElement) {
        const propertyName = orientation === "horizontal" ? "width" : "height";
        const [spacer1, spacer2] = spacers;
        cancelAnyPendingAnimation();
        if (useTransition) {
          if (transitioning.current) {
            clearSpacers();
            spacer1.style.cssText = `${propertyName}: ${size}px`;
            spacer2.style.cssText = `${propertyName}: 0px`;
            if (direction === "fwd") {
              displacedElement.before(spacer1);
              displacedElement.after(spacer2);
            } else {
              displacedElement.after(spacer1);
              displacedElement.before(spacer2);
            }
          } else {
            if (direction === "fwd") {
              displacedElement.after(spacer2);
            } else {
              displacedElement.before(spacer2);
            }
          }
          animateTransition(size, propertyName);
        } else if (direction === "static") {
          spacer1.style.cssText = `${propertyName}: ${size}px`;
          displacedElement.before(spacer1);
        } else {
          throw Error(
            "useDragDisplacers currently only supports noTransition for static displacement"
          );
        }
      }
      return -1;
    },
    [
      animateTransition,
      cancelAnyPendingAnimation,
      clearSpacers,
      displaceLastItem,
      orientation,
      spacers,
    ]
  );

  return {
    displaceItem,
    clearSpacers,
    setTerminalSpacer,
  };
};
