import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import { useAsDropTarget } from "./useAsDropTarget";

import gridPlaceholderCss from "./GridPlaceholder.css";

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

  const dragDropHandlers = useAsDropTarget();

  return (
    <div
      {...htmlAttributes}
      {...dragDropHandlers}
      className={`${classBase} vuuGridLayoutItem`}
      data-drop-target
    />
  );
};
