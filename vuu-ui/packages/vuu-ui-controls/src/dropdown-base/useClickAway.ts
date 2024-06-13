import { queryClosest } from "@finos/vuu-utils";
import { RefObject, useEffect, useRef } from "react";
import { CloseReason } from "./dropdownTypes";

export type ClickawayHook = (props: {
  popperRef: RefObject<HTMLElement>;
  rootRef: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: (reason: CloseReason) => void;
}) => void;

type MouseEventHandler = (e: MouseEvent) => void;
type KeyboardEventHandler = (e: KeyboardEvent) => void;

const NO_HANDLERS: [MouseEventHandler?, KeyboardEventHandler?] = [];

export const targetWithinSubPopup = (
  source: HTMLElement | null,
  target: HTMLElement
) => {
  if (source === null) {
    return false;
  }

  const sourcePortal = queryClosest(source, ".vuuPortal");
  const targetPortal = queryClosest(target, ".vuuPortal");

  if (sourcePortal && targetPortal) {
    // If we have two portals, this can only be a popup launched from a popup.
    // There will be a relationship, described by aria attributes.
    const targetWithId = targetPortal.querySelector("[id]");
    const targetOwner = sourcePortal.querySelector(
      `[aria-owns="${targetWithId?.id}"]`
    );
    return targetOwner !== null;
  }

  return false;
};

export const useClickAway: ClickawayHook = ({
  popperRef,
  rootRef,
  isOpen,
  onClose,
}) => {
  //TODO usePropBackedRef
  const openRef = useRef(isOpen);
  useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const [clickHandler, escapeKeyHandler] = isOpen
      ? [
          (evt: MouseEvent) => {
            const targetElement = evt.target as HTMLElement;
            if (
              !popperRef.current?.contains(targetElement) &&
              !rootRef.current?.contains(targetElement)
            ) {
              if (!targetWithinSubPopup(popperRef.current, targetElement)) {
                onClose("click-away");
              }
            }
          },
          (e: KeyboardEvent) => {
            if (e.key === "Escape") {
              if (openRef.current) {
                onClose("Escape");
                e.stopPropagation();
              }
            }
          },
        ]
      : NO_HANDLERS;

    if (clickHandler && escapeKeyHandler) {
      document.body.addEventListener("mousedown", clickHandler, true);
      document.body.addEventListener("keydown", escapeKeyHandler, true);
    }

    return () => {
      if (clickHandler && escapeKeyHandler) {
        document.body.removeEventListener("mousedown", clickHandler, true);
        document.body.removeEventListener("keydown", escapeKeyHandler, true);
      }
    };
  }, [isOpen, onClose, popperRef, rootRef]);
};
