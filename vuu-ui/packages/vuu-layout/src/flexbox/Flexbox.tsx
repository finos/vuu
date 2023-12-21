import { useForkRef } from "@salt-ds/core";
import cx from "clsx";
import { CSSProperties, ForwardedRef, forwardRef } from "react";
import { FlexboxProps } from "./flexboxTypes";
import { useSplitterResizing } from "./useSplitterResizing";

import "./Flexbox.css";

const classBase = "hwFlexbox";

const Flexbox = forwardRef(function Flexbox(
  props: FlexboxProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    breakPoints,
    children,
    // cols: colsProp,
    column,
    className: classNameProp,
    flexFill,
    gap,
    fullPage,
    id,
    onSplitterMoved,
    resizeable,
    row,
    spacing,
    splitterSize,
    style,
    ...rest
  } = props;

  const { content, rootRef } = useSplitterResizing({
    children,
    // cols: colsProp,
    onSplitterMoved,
    style,
  });

  const className = cx(classBase, classNameProp, {
    [`${classBase}-column`]: column,
    [`${classBase}-row`]: row,
    "flex-fill": flexFill,
    "full-page": fullPage,
  });

  return (
    <div
      {...rest}
      className={className}
      // data-cols={cols}
      data-resizeable={resizeable || undefined}
      id={id}
      ref={useForkRef(rootRef, ref)}
      style={
        {
          ...style,
          gap,
          "--spacing": spacing,
        } as CSSProperties
      }
    >
      {content}
    </div>
  );
});
Flexbox.displayName = "Flexbox";

export default Flexbox;
