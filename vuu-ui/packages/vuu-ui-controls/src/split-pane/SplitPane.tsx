import {
  type FlexAlignment,
  type FlexContentAlignment,
  type ResponsiveProp,
  resolveResponsiveValue,
  useBreakpoint,
  useForkRef,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  Children,
  type CSSProperties,
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Splitter } from "./Splitter";
import {
  type SplitPaneDirection,
  type SplitterMovedHandler,
  useSplitPane,
} from "./useSplitPane";

import splitPaneCss from "./SplitPane.css";

const classBase = "vuuSplitPane";

export interface SplitPaneProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Defines the default behavior for how flex items are laid out along the cross axis, default is "stretch".
   */
  align?: FlexAlignment | "stretch" | "baseline";
  /**
   * Exactly two children, typically Salt `FlexItem` components. A Splitter
   * will be rendered between them. A single child is also accepted (e.g. when
   * one pane is conditionally rendered), in which case no Splitter is rendered.
   */
  children: ReactElement | [ReactNode, ReactNode];
  /**
   * Establishes the main-axis, defining the direction children are placed. Default is "row".
   */
  direction?: ResponsiveProp<SplitPaneDirection>;
  /**
   * Controls the space between each item and the Splitter, default is 0.
   */
  gap?: ResponsiveProp<number | string>;
  /**
   * Defines the alignment along the main axis, default is "start".
   */
  justify?: FlexContentAlignment;
  /**
   * Defines the margin around the component. It can be specified as a number (which acts as a multiplier) or a string representing the margin value. Default is `0`.
   */
  margin?: ResponsiveProp<number | string>;
  /**
   * Invoked when user has finished moving the Splitter, receives the new sizes (px) of both panes.
   */
  onSplitterMoved?: SplitterMovedHandler;
  /**
   * Defines the padding within the component. It can be specified as a number (which acts as a multiplier) or a string representing the padding value. Default is `0`.
   */
  padding?: ResponsiveProp<number | string>;
  /**
   * Size (thickness) of the Splitter, in px. Default is 3.
   */
  splitterSize?: number;
}

const parseSpacing = (value: number | string | undefined) =>
  typeof value === "number"
    ? `calc(var(--salt-spacing-100) * ${value})`
    : value;

const parseAlignment = (value: string | undefined) =>
  value === "start" || value === "end" ? `flex-${value}` : value;

export const SplitPane = forwardRef(function SplitPane(
  {
    align,
    children,
    className,
    direction = "row",
    gap = 0,
    justify,
    margin = 0,
    onSplitterMoved,
    padding = 0,
    splitterSize,
    style,
    ...htmlAttributes
  }: SplitPaneProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-split-pane",
    css: splitPaneCss,
    window: targetWindow,
  });

  const { matchedBreakpoints } = useBreakpoint();
  const flexDirection =
    resolveResponsiveValue(direction, matchedBreakpoints) ?? "row";
  const flexGap = resolveResponsiveValue(gap, matchedBreakpoints);
  const flexMargin = resolveResponsiveValue(margin, matchedBreakpoints);
  const flexPadding = resolveResponsiveValue(padding, matchedBreakpoints);

  const panes = Children.toArray(children);
  if (panes.length > 2) {
    throw Error(
      `[SplitPane] supports a maximum of two children, ${panes.length} were provided`,
    );
  }

  const { beginResize, endResize, resize, rootRef, splitterPosition } =
    useSplitPane({
      direction: flexDirection,
      onSplitterMoved,
      paneCount: panes.length,
    });

  const splitPaneStyle = {
    ...style,
    "--vuuSplitPane-align": parseAlignment(align),
    "--vuuSplitPane-direction": flexDirection,
    "--vuuSplitPane-gap": parseSpacing(flexGap),
    "--vuuSplitPane-justify": parseAlignment(justify),
    "--vuuSplitPane-margin": parseSpacing(flexMargin),
    "--vuuSplitPane-padding": parseSpacing(flexPadding),
    "--vuuSplitPane-splitterSize":
      splitterSize === undefined ? undefined : `${splitterSize}px`,
  } as CSSProperties;

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${flexDirection}`, className)}
      ref={useForkRef(rootRef, forwardedRef)}
      style={splitPaneStyle}
    >
      {panes[0]}
      {panes.length === 2 ? (
        <Splitter
          direction={flexDirection}
          onResize={resize}
          onResizeEnd={endResize}
          onResizeStart={beginResize}
          position={splitterPosition}
        />
      ) : null}
      {panes[1]}
    </div>
  );
});
