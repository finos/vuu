import { asReactElements } from "@finos/vuu-utils";
import { useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { ForwardedRef, forwardRef, useMemo } from "react";
import { useBreakpoints } from "../responsive";
import { FlexboxProps } from "./flexboxTypes";
import { useResponsiveSizing } from "./useResponsiveSizing";

import fluidGridCss from "./FluidGrid.css";

const classBase = "hwFluidGrid";

export interface FluidGridProps extends FlexboxProps {
  showGrid?: boolean;
}

export const FluidGrid = forwardRef(function FluidGrid(
  props: FluidGridProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    breakPoints,
    children: childrenProp,
    column,
    cols: colsProp = 12,
    className: classNameProp,
    flexFill,
    gap = 3,
    fullPage,
    id,
    onSplitterMoved,
    resizeable,
    row,
    showGrid,
    spacing,
    splitterSize,
    style: styleProp,
    ...rest
  } = props;

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-fluid-grid",
    css: fluidGridCss,
    window: targetWindow,
  });

  //TODO does thie useMemo serve any actual purpose or will childrenProp
  // always be new anyway ?
  const children = useMemo(() => {
    return asReactElements(childrenProp);
  }, [childrenProp]);

  const { cols, content, rootRef } = useResponsiveSizing({
    children,
    cols: colsProp,
    style: styleProp,
  });

  const breakpoint = useBreakpoints(
    {
      breakPoints,
    },
    rootRef
  );

  const className = cx(classBase, classNameProp, {
    [`${classBase}-column`]: column,
    [`${classBase}-row`]: row,
    [`${classBase}-show-grid`]: showGrid,
    "flex-fill": flexFill,
    "full-page": fullPage,
  });

  const style = {
    ...styleProp,
    "--spacing": spacing,
    "--grid-col-count": cols,
    "--grid-gap": gap,
  };

  return (
    <div
      {...rest}
      className={className}
      data-breakpoint={breakpoint}
      data-cols={cols}
      data-resizeable={resizeable || undefined}
      id={id}
      ref={useForkRef(rootRef, ref)}
      style={style}
    >
      {content}
    </div>
  );
});
FluidGrid.displayName = "FluidGrid";
