import cx from "classnames";
import { useThemeAttributes } from "@finos/vuu-shell";
import { HTMLAttributes, RefObject } from "react";
import { useAnchoredPosition } from "./useAnchoredPosition";

import "./Popup.css";

export type PopupPlacement =
  | "below"
  | "below-center"
  | "below-full-width"
  | "center"
  | "right";

export interface PopupComponentProps extends HTMLAttributes<HTMLDivElement> {
  placement: PopupPlacement;
  anchorElement: RefObject<HTMLElement>;
  minWidth?: number;
  offsetLeft?: number;
  offsetTop?: number;
}

export const PopupComponent = ({
  children,
  className,
  anchorElement,
  minWidth,
  placement,
}: PopupComponentProps) => {
  const [themeClass, densityClass, dataMode] = useThemeAttributes();
  const position = useAnchoredPosition({ anchorElement, minWidth, placement });
  return position === undefined ? null : (
    <div
      className={cx(`vuuPortal`, className, themeClass, densityClass)}
      data-mode={dataMode}
      style={position}
    >
      {children}
    </div>
  );
};
