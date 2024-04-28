import { CSSProperties, MouseEventHandler, ReactNode, RefObject } from "react";
import { Portal } from "../portal";
import { TooltipPlacement, useAnchoredPosition } from "./useAnchoredPosition";
import cx from "clsx";

import "./Tooltip.css";

const classBase = "vuuTooltip";

export type TooltipStatus = "warning" | "error" | "info";
export interface TooltipProps {
  anchorElement: RefObject<HTMLElement>;
  children: ReactNode;
  className?: string;
  id?: string;
  onMouseEnter: MouseEventHandler;
  onMouseLeave: MouseEventHandler;
  placement: TooltipPlacement | TooltipPlacement[];
  status?: TooltipStatus;
  style?: CSSProperties;
}

export const Tooltip = ({
  anchorElement,
  children,
  className,
  id,
  onMouseEnter,
  onMouseLeave,
  placement: placementProp,
  status,
  style: styleProp,
}: TooltipProps) => {
  const ref = useAnchoredPosition({
    anchorElement,
    placement: placementProp,
  });
  return (
    <Portal>
      <div
        className={cx(classBase, className, "vuuHidden", {
          [`${classBase}-error`]: status === "error",
        })}
        id={id}
        ref={ref}
        style={{ ...styleProp, left: 0, top: 0 }}
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
