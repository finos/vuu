import { GridLayoutDropPosition } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { useAsDropTarget } from "./useAsDropTarget";

import gridPlaceholderCss from "./GridPlaceholder.css";

export type GridLayoutDropHandler = (
  targetId: string,
  payload: string | object,
  position: GridLayoutDropPosition
) => void;

const classBase = "vuuGridPlaceholder";

export interface GridPlaceholderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onDrop"> {
  debugLabel?: string;
}

export const GridPlaceholder = ({
  ...htmlAttributes
}: GridPlaceholderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout-placeholder",
    css: gridPlaceholderCss,
    window: targetWindow,
  });

  const { dropTargetClassName, ...dragDropHandlers } = useAsDropTarget();

  return (
    <div
      {...htmlAttributes}
      {...dragDropHandlers}
      className={cx(classBase, dropTargetClassName)}
    />
  );
};
