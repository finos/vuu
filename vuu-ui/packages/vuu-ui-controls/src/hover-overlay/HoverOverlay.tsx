import {
  Overlay,
  OverlayPanel,
  OverlayPanelContent,
  OverlayProps,
  OverlayTrigger,
} from "@salt-ds/core";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

export interface HoverOverlayProps extends Pick<OverlayProps, "onOpenChange"> {
  children: ReactNode;
  open?: boolean;
  trigger: ReactNode;
}

export const HoverOverlay = ({
  children,
  open: openProp = false,
  onOpenChange,
  trigger,
}: HoverOverlayProps) => {
  const [open, _setOpen] = useState(openProp);
  const isOpen = useRef(false);
  const showHandle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideHandle = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  useEffect(() => {
    if (openProp !== isOpen.current) {
      setOpen(openProp);
    }
  }, [openProp, setOpen]);

  const handleOverlayMouseEnter = useCallback(() => {
    if (hideHandle.current) {
      clearTimeout(hideHandle.current);
      hideHandle.current = undefined;
    }
  }, []);

  const handleOverlayMouseLeave = useCallback(() => {
    hideHandle.current = setTimeout(() => {
      setOpen(false);
      hideHandle.current = undefined;
    }, 300);
  }, [setOpen]);

  const handleMouseEnter = useCallback(() => {
    showHandle.current = setTimeout(() => {
      setOpen(true);
      showHandle.current = undefined;
    }, 400);
    if (hideHandle.current) {
      clearTimeout(hideHandle.current);
      hideHandle.current = undefined;
    }
  }, [setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (showHandle.current) {
      clearTimeout(showHandle.current);
      showHandle.current = undefined;
    } else if (isOpen.current) {
      hideHandle.current = setTimeout(() => {
        setOpen(false);
        hideHandle.current = undefined;
      }, 300);
    }
  }, [setOpen]);

  const handleClick = useCallback(() => {
    if (showHandle.current) {
      clearTimeout(showHandle.current);
      showHandle.current = undefined;
    } else if (isOpen.current) {
      setOpen(false);
    }
  }, [setOpen]);

  return (
    <Overlay placement="right" onOpenChange={onOpenChange} open={open}>
      <OverlayTrigger>
        <div
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {trigger}
        </div>
      </OverlayTrigger>
      <OverlayPanel>
        <OverlayPanelContent
          onMouseEnter={handleOverlayMouseEnter}
          onMouseLeave={handleOverlayMouseLeave}
        >
          {children}
        </OverlayPanelContent>
      </OverlayPanel>
    </Overlay>
  );
};
