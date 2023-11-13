import { MouseEventHandler, ReactNode, RefObject } from "react";
import { Portal } from "../portal";
import { TooltipPlacement, useAnchoredPosition } from "./useAnchoredPosition";
import cx from "classnames";

import "./Tooltip.css";

const classBase = "vuuTooltip";

export type TooltipStatus = "warning" | "error" | "info";
export interface TooltipProps {
  anchorElement: RefObject<HTMLElement>;
  children: ReactNode;
  id?: string;
  onMouseEnter: MouseEventHandler;
  onMouseLeave: MouseEventHandler;
  placement: TooltipPlacement;
  status?: TooltipStatus;
}

export const Tooltip = ({
  anchorElement,
  children,
  id,
  onMouseEnter,
  onMouseLeave,
  placement,
  status,
}: TooltipProps) => {
  const position = useAnchoredPosition({ anchorElement, placement });
  if (position === undefined) {
    return null;
  }
  return (
    <Portal>
      <div
        className={cx(classBase, {
          [`${classBase}-error`]: status === "error",
        })}
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
