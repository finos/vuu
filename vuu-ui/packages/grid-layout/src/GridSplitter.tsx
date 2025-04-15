import { HTMLAttributes } from "react";
import { AriaOrientation } from "./GridModel";
import { ResizeOrientation } from "./grid-dom-utils";

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
    />
  );
};
