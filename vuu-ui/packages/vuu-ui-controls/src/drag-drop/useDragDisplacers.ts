import { useCallback, useMemo, useRef } from "react";
import { MeasuredDropTarget } from "./dragUtils";
import { createDragSpacer as createDragDisplacer } from "./Draggable";
import { Direction } from "./dragDropTypes";

export type DragDisplacersHookResult = {
  clearDisplacedItem: () => void;
  displaceItem: (
    dropTarget: MeasuredDropTarget,
    size: number,
    useTransition?: boolean,
    direction?: Direction | "static",
    orientation?: "horizontal" | "vertical"
  ) => void;
  displaceLastItem: (
    dropTarget: MeasuredDropTarget,
    size: number,
    useTransition?: boolean,
    direction?: Direction | "static",
    orientation?: "horizontal" | "vertical"
  ) => void;
  clearSpacers: () => void;
};

export type DragDisplacersHook = () => DragDisplacersHookResult;
/**
 * Manage a pair of displacer elements to smoothly display a moving gap between
 * list items of any kind. Designed to be used in a drag drop operation. The 'static'
 * direction option should be used at drag start or following scroll.
 */
export const useDragDisplacers: DragDisplacersHook = () => {
  const animationFrame = useRef(0);
  const transitioning = useRef(false);

  const spacers = useMemo(
    // We only need to listen for transition end on one of the spacers
    () => [createDragDisplacer(transitioning), createDragDisplacer()],
    []
  );

  const clearSpacers = useCallback(
    () => spacers.forEach((spacer) => spacer.remove()),
    [spacers]
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

  const cancelAnyPendingAnimation = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = 0;
    }
  }, []);

  const clearDisplacedItem = useCallback(() => {
    clearSpacers();
  }, [clearSpacers]);

  const displaceItem = useCallback(
    (
      dropTarget: MeasuredDropTarget,
      size: number,
      useTransition = false,
      direction?: Direction | "static",
      orientation: "horizontal" | "vertical" = "horizontal"
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
        return dropTarget;
      }
    },
    [animateTransition, cancelAnyPendingAnimation, clearSpacers, spacers]
  );
  const displaceLastItem = useCallback(
    (
      dropTarget: MeasuredDropTarget,
      size: number,
      useTransition = false,
      direction: Direction | "static" = "static",
      orientation: "horizontal" | "vertical" = "horizontal"
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
    },
    [animateTransition, cancelAnyPendingAnimation, clearSpacers, spacers]
  );

  return {
    clearDisplacedItem,
    displaceItem,
    displaceLastItem,
    clearSpacers,
  };
};
