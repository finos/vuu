import type { orientationType } from "@finos/vuu-utils";
import { useCallback, useMemo, useRef } from "react";
import { Direction } from "./dragDropTypesNext";
import { createDragSpacer as createDragDisplacer } from "./Draggable";
import {
  MeasuredDropTarget,
  mutateDropTargetsSwitchDropTargetPosition,
} from "./drop-target-utils";

export type DragDisplacersHookResult = {
  displaceItem: (
    dropTargets: MeasuredDropTarget[],
    dropTarget: MeasuredDropTarget,
    size: number,
    useTransition?: boolean,
    direction?: Direction | "static",
    orientation?: "horizontal" | "vertical"
  ) => void;
  displaceLastItem: (
    dropTargets: MeasuredDropTarget[],
    dropTarget: MeasuredDropTarget,
    size: number,
    useTransition?: boolean,
    direction?: Direction | "static",
    orientation?: "horizontal" | "vertical"
  ) => void;
  clearSpacers: (useAnimation?: boolean) => void;
};

export type DragDisplacersHook = (
  orientation: orientationType
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

  const cancelAnyPendingAnimation = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = 0;
    }
  }, []);

  const displaceItem = useCallback(
    (
      dropTargets: MeasuredDropTarget[],
      dropTarget: MeasuredDropTarget,
      size: number,
      useTransition = false,
      direction: Direction | "static" = "static"
    ) => {
      if (dropTarget) {
        const propertyName = orientation === "horizontal" ? "width" : "height";
        const [spacer1, spacer2] = spacers;
        cancelAnyPendingAnimation();
        if (useTransition) {
          if (transitioning.current) {
            clearSpacers();
            spacer1.style.cssText = `${propertyName}: ${size}px`;
            spacer2.style.cssText = `${propertyName}: 0px`;
            if (direction === "fwd") {
              dropTarget.element.before(spacer1);
              dropTarget.element.after(spacer2);
            } else {
              dropTarget.element.after(spacer1);
              dropTarget.element.before(spacer2);
            }
          } else {
            if (direction === "fwd") {
              dropTarget.element.after(spacer2);
            } else {
              dropTarget.element.before(spacer2);
            }
          }
          animateTransition(size, propertyName);
        } else if (direction === "static") {
          spacer1.style.cssText = `${propertyName}: ${size}px`;
          dropTarget.element.before(spacer1);
        } else {
          throw Error(
            "useDragDisplacers currently only supports noTransition for static displacement"
          );
        }
        if (direction !== "static") {
          mutateDropTargetsSwitchDropTargetPosition(dropTargets, direction);
        }
      }
    },
    [
      animateTransition,
      cancelAnyPendingAnimation,
      clearSpacers,
      orientation,
      spacers,
    ]
  );
  const displaceLastItem = useCallback(
    (
      dropTargets: MeasuredDropTarget[],
      dropTarget: MeasuredDropTarget,
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
          dropTarget.element.before(spacer1);
          dropTarget.element.after(spacer2);
        } else {
          if (direction === "fwd") {
            dropTarget.element.after(spacer2);
          } else {
            dropTarget.element.before(spacer2);
          }
        }
        animateTransition(size, propertyName);
      } else {
        spacer1.style.cssText = `${propertyName}: ${size}px`;
        dropTarget.element.after(spacer1);
      }

      if (direction !== "static") {
        mutateDropTargetsSwitchDropTargetPosition(dropTargets, direction);
      }
    },
    [
      animateTransition,
      cancelAnyPendingAnimation,
      clearSpacers,
      orientation,
      spacers,
    ]
  );

  return {
    displaceItem,
    displaceLastItem,
    clearSpacers,
  };
};
