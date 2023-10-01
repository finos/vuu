import { HTMLAttributes, ReactNode } from "react";

import "./Tooltip.css";

// interface TooltipProps extends HTMLAttributes<HTMLDivElement> {}
export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Tooltip = ({ children, ...props }: TooltipProps) => {
  // TODO check that a tooltip is not already present in page
  return (
    <div className="vuuTooltip" id="vuu-tooltip" {...props}>
      {children}
    </div>
  );
};
