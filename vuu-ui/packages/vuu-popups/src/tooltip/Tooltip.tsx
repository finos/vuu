import { MouseEventHandler, ReactNode, RefObject } from "react";
import { Portal } from "../portal";
import { TooltipPlacement, useAnchoredPosition } from "./useAnchoredPosition";

import "./Tooltip.css";

const classBase = "vuuTooltip";

export interface TooltipProps {
  anchorElement: RefObject<HTMLElement>;
  children: ReactNode;
  id?: string;
  onMouseEnter: MouseEventHandler;
  onMouseLeave: MouseEventHandler;
  placement: TooltipPlacement;
}

export const Tooltip = ({
  anchorElement,
  children,
  id,
  onMouseEnter,
  onMouseLeave,
  placement,
}: TooltipProps) => {
  const position = useAnchoredPosition({ anchorElement, placement });
  if (position === undefined) {
    return null;
  }
  return (
    <Portal>
      <div
        className={classBase}
        data-align={placement}
        id={id}
        style={position}
      >
        <span
          className={`${classBase}-content`}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {children}
        </span>
      </div>
    </Portal>
  );
};
