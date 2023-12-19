import { useId } from "@finos/vuu-utils";
import { MouseEvent, ReactNode, useCallback, useRef, useState } from "react";
import { TooltipProps } from "./Tooltip";
import { TooltipPlacement } from "./useAnchoredPosition";

export interface TooltipHookProps {
  id: string;
  placement?: TooltipPlacement;
  tooltipContent: ReactNode;
}

export const useTooltip = ({
  id: idProp,
  placement = "right",
  tooltipContent,
}: TooltipHookProps) => {
  const hideTooltipRef = useRef<() => void>();
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

  const showTooltip = useCallback(() => {
    const { current: anchorEl } = anchorElementRef;
    if (anchorEl) {
      setTooltipProps({
        anchorElement: anchorElementRef,
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
  }, [
    escapeListener,
    handleMouseEnterTooltip,
    handleMouseLeaveTooltip,
    id,
    placement,
    tooltipContent,
  ]);

  const handleMouseEnter = useCallback(
    (evt: MouseEvent) => {
      const el = evt.target as HTMLElement;
      if (el) {
        anchorElementRef.current = el;
        mouseEnterTimerRef.current = window.setTimeout(showTooltip, 800);
      }
    },
    [showTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    if (anchorElementRef.current)
      if (mouseEnterTimerRef.current) {
        window.clearTimeout(mouseEnterTimerRef.current);
        mouseEnterTimerRef.current = undefined;
      } else {
        if (hideTooltipRef.current) {
          mouseLeaveTimerRef.current = window.setTimeout(
            hideTooltipRef.current,
            200
          );
        }
      }
  }, []);

  const anchorProps = {
    "aria-describedby": `${id}-tooltip`,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return {
    anchorProps,
    tooltipProps,
  };
};
