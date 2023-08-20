import cx from "classnames";
import { useThemeAttributes } from "@finos/vuu-shell";
import { HTMLAttributes, RefObject, useLayoutEffect, useState } from "react";

import "./Popup.css";

export type PopupPlacement = "above" | "below";

export interface PopupComponentProps extends HTMLAttributes<HTMLDivElement> {
  placement: PopupPlacement;
  anchorElement: RefObject<HTMLElement>;
}

export const PopupComponent = ({
  children,
  className,
  anchorElement,
  placement,
}: PopupComponentProps) => {
  const [themeClass, densityClass, dataMode] = useThemeAttributes();
  const [position, setPosition] = useState<
    { x: number; y: number } | undefined
  >();

  // maybe better as useMemo ?
  useLayoutEffect(() => {
    if (anchorElement.current) {
      const { left, bottom } = anchorElement.current.getBoundingClientRect();
      setPosition({ x: left, y: bottom });
    }
  }, [anchorElement, placement]);

  return position === undefined ? null : (
    <div
      className={cx(`vuuPortal`, className, themeClass, densityClass)}
      data-mode={dataMode}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {children}
    </div>
  );
};
