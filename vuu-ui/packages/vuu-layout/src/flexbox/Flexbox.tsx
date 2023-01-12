import cx from "classnames";
import { CSSProperties, forwardRef } from "react";
import { FlexboxProps } from "./flexboxTypes";
import { useSplitterResizing } from "./useSplitterResizing";

import "./Flexbox.css";

const classBase = "hwFlexbox";

const Flexbox = forwardRef(function Flexbox(
  props: FlexboxProps,
) {
  const {
    breakPoints,
    children,
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

  const { content } = useSplitterResizing({
    children,
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
      data-resizeable={resizeable || undefined}
      id={id}
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
