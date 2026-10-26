import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { HTMLAttributes } from "react";
import { useAsDropTarget } from "./useAsDropTarget";

import gridPlaceholderCss from "./GridPlaceholder.css";
import { registerComponent } from "@vuu-ui/vuu-utils";

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

  // Empty: a drop anywhere fills it, not only in the centre.
  const dragDropHandlers = useAsDropTarget({ fill: true });

  return (
    <div
      {...htmlAttributes}
      {...dragDropHandlers}
      className={`${classBase} vuuGridLayoutItem`}
      data-drop-target
    />
  );
};

registerComponent("GridPlaceholder", GridPlaceholder, "component");
