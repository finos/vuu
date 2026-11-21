import { useFloatingUI } from "@salt-ds/core";
import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export type PortalNavFooterVariant = "expanded" | "rail";

export type FooterPopoverOpenedBy = "hover" | "click";

export interface FooterPopoverOptions {
  /** Delay before hovering the trigger opens the popover, in ms. */
  openDelay: number;
  /** Delay before the pointer leaving closes a hover-opened popover, in ms. */
  closeDelay: number;
  variant: PortalNavFooterVariant;
  /**
   * Called when the popover is opened by click or keyboard, to move focus
   * into it. Not called when it is opened by hover.
   */
  focusOnOpen: (floating: HTMLElement) => void;
}

/**
 * Open/close behaviour shared by the nav footer popovers: open on hover
 * after a delay or on click / Enter / Space; close after a delay when the
 * pointer leaves, on Escape (returning focus to the trigger), on a pointer
 * press outside, or when focus leaves. Opens above the trigger in the
 * expanded nav and to the right of it in the rail.
 */
export const useFooterPopover = ({
  closeDelay,
  focusOnOpen,
  openDelay,
  variant,
}: FooterPopoverOptions) => {
  const [openedBy, setOpenedBy] = useState<FooterPopoverOpenedBy | null>(null);
  const open = openedBy !== null;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLElement | null>(null);
  const focusRequested = useRef(false);
  const popoverId = useId();

  const { refs, strategy, x, y } = useFloatingUI({
    open,
    placement: variant === "rail" ? "right-end" : "top-start",
    strategy: "fixed",
  });

  const clearTimer = useCallback(() => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  const close = useCallback(
    (returnFocus = false) => {
      clearTimer();
      setOpenedBy(null);
      if (returnFocus) {
        triggerRef.current?.focus();
      }
    },
    [clearTimer],
  );

  const isWithin = useCallback(
    (target: EventTarget | null) =>
      target instanceof Node &&
      Boolean(
        triggerRef.current?.contains(target) ||
          floatingRef.current?.contains(target),
      ),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const doc = triggerRef.current?.ownerDocument ?? document;
    const onPointerDown = (event: Event) => {
      if (!isWithin(event.target)) {
        close();
      }
    };
    doc.addEventListener("pointerdown", onPointerDown, true);
    return () => doc.removeEventListener("pointerdown", onPointerDown, true);
  }, [close, isWithin, open]);

  useEffect(() => {
    if (open && focusRequested.current && floatingRef.current) {
      focusRequested.current = false;
      focusOnOpen(floatingRef.current);
    }
  });

  const onMouseEnter = () => {
    clearTimer();
    if (!open) {
      timer.current = setTimeout(() => {
        timer.current = undefined;
        setOpenedBy("hover");
      }, openDelay);
    }
  };

  const onMouseLeave = () => {
    clearTimer();
    if (openedBy === "hover") {
      timer.current = setTimeout(() => {
        timer.current = undefined;
        setOpenedBy(null);
      }, closeDelay);
    }
  };

  const onClick = () => {
    clearTimer();
    if (open && openedBy !== "hover") {
      close();
    } else {
      // Opens, or pins a hover-opened popover rather than closing it.
      focusRequested.current = true;
      setOpenedBy("click");
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      event.preventDefault();
      close(true);
    }
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.relatedTarget !== null && !isWithin(event.relatedTarget)) {
      close();
    }
  };

  const setTriggerRef = useCallback(
    (element: HTMLElement | null) => {
      triggerRef.current = element;
      refs.setReference(element);
    },
    [refs],
  );
  const setFloatingRef = useCallback(
    (element: HTMLElement | null) => {
      floatingRef.current = element;
      refs.setFloating(element);
    },
    [refs],
  );

  const floatingStyle: CSSProperties = {
    left: x ?? 0,
    position: strategy,
    top: y ?? 0,
  };

  return {
    close,
    open,
    openedBy,
    triggerProps: {
      "aria-controls": open ? popoverId : undefined,
      "aria-expanded": open,
      onBlur,
      onClick,
      onKeyDown,
      onMouseEnter,
      onMouseLeave,
      ref: setTriggerRef,
    },
    floatingProps: {
      "data-variant": variant,
      id: popoverId,
      onBlur,
      onKeyDown,
      onMouseEnter,
      onMouseLeave,
      ref: setFloatingRef,
      style: floatingStyle,
    },
  };
};
