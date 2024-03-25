import { queryClosest, useId } from "@finos/vuu-utils";
import { MouseEvent, ReactNode, useCallback, useRef, useState } from "react";
import { TooltipProps } from "./Tooltip";
import { TooltipPlacement } from "./useAnchoredPosition";

export interface TooltipHookProps {
  anchorQuery?: string;
  id: string;
  placement?: TooltipPlacement | TooltipPlacement[];
  tooltipContent: ReactNode;
}

export const useTooltip = ({
  anchorQuery = "*",
  id: idProp,
  placement = "right",
  tooltipContent,
}: TooltipHookProps) => {
  const hideTooltipRef = useRef<() => void>();
  const isHoveringRef = useRef(false);
  const anchorElementRef = useRef<HTMLElement | null>(null);
  const mouseEnterTimerRef = useRef<number | undefined>();
  const mouseLeaveTimerRef = useRef<number | undefined>();
  const [tooltipProps, setTooltipProps] = useState<TooltipProps | undefined>();

  const id = useId(idProp);

  const escapeListener = useCallback((evt: KeyboardEvent) => {
    if (evt.key === "Escape") {
      hideTooltipRef.current?.();
    }
  }, []);

  hideTooltipRef.current = useCallback(() => {
    setTooltipProps(undefined);
    document.removeEventListener("keydown", escapeListener);
  }, [escapeListener]);

  const handleMouseEnterTooltip = useCallback(() => {
    window.clearTimeout(mouseLeaveTimerRef.current);
  }, []);

  const handleMouseLeaveTooltip = useCallback(() => {
    hideTooltipRef.current?.();
  }, []);

  const hideTooltip = useCallback((defer = 0) => {
    if (mouseEnterTimerRef.current) {
      window.clearTimeout(mouseEnterTimerRef.current);
      mouseEnterTimerRef.current = undefined;
    } else if (hideTooltipRef.current) {
      if (defer === 0) {
        hideTooltipRef.current();
      } else {
        mouseLeaveTimerRef.current = window.setTimeout(
          hideTooltipRef.current,
          defer
        );
      }
    }
  }, []);

  const showTooltip = useCallback(
    (ref = anchorElementRef) => {
      const { current: anchorEl } = ref;
      if (anchorEl) {
        setTooltipProps({
          anchorElement: ref,
          children: tooltipContent,
          id: `${id}-tooltip`,
          onMouseEnter: handleMouseEnterTooltip,
          onMouseLeave: handleMouseLeaveTooltip,
          placement: placement,
        });
        // register ESC listener
        document.addEventListener("keydown", escapeListener);
      }
      mouseEnterTimerRef.current = undefined;
      hideTooltip(isHoveringRef.current ? 3000 : 1000);
    },
    [
      escapeListener,
      handleMouseEnterTooltip,
      handleMouseLeaveTooltip,
      hideTooltip,
      id,
      placement,
      tooltipContent,
    ]
  );

  const handleMouseEnter = useCallback(
    (evt: MouseEvent) => {
      isHoveringRef.current = true;
      const el = queryClosest(evt.target, anchorQuery);
      if (el) {
        console.log(`el ${el.classList}`);
        anchorElementRef.current = el;
        mouseEnterTimerRef.current = window.setTimeout(showTooltip, 800);
      }
    },
    [anchorQuery, showTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    hideTooltip(200);
  }, [hideTooltip]);

  const anchorProps = {
    "aria-describedby": `${id}-tooltip`,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return {
    anchorProps,
    hideTooltip,
    showTooltip,
    tooltipProps,
  };
};
