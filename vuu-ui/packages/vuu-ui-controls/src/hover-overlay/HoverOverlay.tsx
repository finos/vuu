import {
  Overlay,
  OverlayPanel,
  OverlayPanelContent,
  OverlayProps,
  OverlayTrigger,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { containsPoint } from "@vuu-ui/vuu-utils";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import hoverOverlayCss from "./HoverOverlay.css";

const classBase = "vuuHoverOverlay";

const OPEN_DELAY = 400;
const CLOSE_DELAY = 300;

export interface HoverOverlayProps extends Pick<
  OverlayProps,
  "placement" | "onOpenChange"
> {
  children: ReactNode;
  open?: boolean;
  /**
   * hover (default) opens the overlay after a short delay when pointer
   * enters trigger and closes it when pointer leaves both trigger and
   * overlay. click leaves open/close entirely to Salt Overlay.
   */
  openOn?: "hover" | "click";
  trigger: ReactNode;
}

export const HoverOverlay = ({
  children,
  open: openProp = false,
  onOpenChange,
  openOn = "hover",
  placement = "right",
  trigger,
}: HoverOverlayProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-hover-overlay",
    css: hoverOverlayCss,
    window: targetWindow,
  });

  const [open, _setOpen] = useState(openProp);
  const isOpen = useRef(false);
  const showHandle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideHandle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const clearShowTimer = useCallback(() => {
    if (showHandle.current) {
      clearTimeout(showHandle.current);
      showHandle.current = undefined;
    }
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideHandle.current) {
      clearTimeout(hideHandle.current);
      hideHandle.current = undefined;
    }
  }, []);

  const setOpen = useCallback(
    (open: boolean) => {
      if (open !== isOpen.current) {
        isOpen.current = open;
        _setOpen(open);
        onOpenChange?.(open);
      }
    },
    [onOpenChange],
  );

  const startHideTimer = useCallback(() => {
    if (hideHandle.current === undefined) {
      hideHandle.current = setTimeout(() => {
        hideHandle.current = undefined;
        setOpen(false);
      }, CLOSE_DELAY);
    }
  }, [setOpen]);

  useEffect(() => {
    if (openProp !== isOpen.current) {
      setOpen(openProp);
    }
  }, [openProp, setOpen]);

  useEffect(
    () => () => {
      clearShowTimer();
      clearHideTimer();
    },
    [clearHideTimer, clearShowTimer],
  );

  // While open, Salt's OverlayPanel makes everything outside the panel inert,
  // including our trigger. That fires a spurious mouseleave on the trigger, so
  // we can't rely on trigger mouse events. Track the pointer at document level
  // instead and compare with the trigger and panel bounds.
  useEffect(() => {
    if (open && openOn === "hover") {
      const doc = triggerRef.current?.ownerDocument ?? document;
      const handlePointerMove = ({ clientX, clientY }: PointerEvent) => {
        if (
          containsPoint(triggerRef.current, clientX, clientY) ||
          containsPoint(panelRef.current, clientX, clientY)
        ) {
          clearHideTimer();
        } else {
          startHideTimer();
        }
      };
      doc.addEventListener("pointermove", handlePointerMove);
      doc.documentElement.addEventListener("mouseleave", startHideTimer);
      return () => {
        doc.removeEventListener("pointermove", handlePointerMove);
        doc.documentElement.removeEventListener("mouseleave", startHideTimer);
        clearHideTimer();
      };
    }
  }, [clearHideTimer, open, openOn, startHideTimer]);

  const handleMouseEnter = useCallback(() => {
    if (!isOpen.current && showHandle.current === undefined) {
      showHandle.current = setTimeout(() => {
        showHandle.current = undefined;
        setOpen(true);
      }, OPEN_DELAY);
    }
  }, [setOpen]);

  const handleMouseLeave = useCallback(() => {
    // once open, closing is handled by the pointermove listener
    clearShowTimer();
  }, [clearShowTimer]);

  const handleClick = useCallback(() => {
    // Salt Overlay opens on click, no need to wait for open timer
    clearShowTimer();
  }, [clearShowTimer]);

  // Salt Overlay requests open on click, close on Escape or click outside
  const handleOpenChange = useCallback(
    (open: boolean) => {
      clearShowTimer();
      clearHideTimer();
      setOpen(open);
    },
    [clearHideTimer, clearShowTimer, setOpen],
  );

  const triggerProps =
    openOn === "hover"
      ? {
          onClick: handleClick,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }
      : undefined;

  return (
    <Overlay placement={placement} onOpenChange={handleOpenChange} open={open}>
      <OverlayTrigger>
        <div {...triggerProps} ref={triggerRef}>
          {trigger}
        </div>
      </OverlayTrigger>
      <OverlayPanel className={`${classBase}-panel`} ref={panelRef}>
        <OverlayPanelContent>{children}</OverlayPanelContent>
      </OverlayPanel>
    </Overlay>
  );
};
