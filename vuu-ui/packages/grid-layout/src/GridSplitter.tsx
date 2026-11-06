import { HTMLAttributes } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { AriaOrientation } from "./GridModel";
import { ResizeOrientation } from "./grid-dom-utils";

import gridSplitterCss from "./GridSplitter.css";

export interface GridSplitterProps extends HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  ariaOrientation: AriaOrientation;
  offsetStart?: boolean;
  orientation: ResizeOrientation;
}

export const GridSplitter = ({
  "aria-controls": ariaControls,
  ariaOrientation,
  offsetStart,
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
      className={`vuuGridSplitter${offsetStart ? " vuuGridSplitter-offset-start" : ""}`}
      draggable
      id={id}
      // aria-valuenow/min/max depend on measured item sizes, so
      // useGridSplitterResizing sets them when the splitter receives focus.
      // biome-ignore lint/a11y/useAriaPropsForRole: values are set on focus
      role="separator"
      tabIndex={-1}
    >
      <div className={`vuu-grab-zone`} />
    </div>
  );
};
