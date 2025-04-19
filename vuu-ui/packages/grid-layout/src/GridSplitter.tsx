import { HTMLAttributes } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { AriaOrientation } from "./GridModel";
import { ResizeOrientation } from "./grid-dom-utils";

import gridSplitterCss from "./GridSplitter.css";

export interface GridSplitterProps extends HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  ariaOrientation: AriaOrientation;
  orientation: ResizeOrientation;
}

export const GridSplitter = ({
  "aria-controls": ariaControls,
  ariaOrientation,
  orientation,
  ...htmlAttributes
}: GridSplitterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-splitter",
    css: gridSplitterCss,
    window: targetWindow,
  });

  const id = `${ariaControls}-splitter-${orientation[0]}`;
  return (
    <div
      {...htmlAttributes}
      aria-controls={ariaControls}
      aria-orientation={ariaOrientation}
      className="vuuGridSplitter"
      draggable
      id={id}
      role="separator"
    >
      <div className={`vuu-grab-zone`} />
    </div>
  );
};
