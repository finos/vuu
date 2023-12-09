import React, { HTMLAttributes, useRef } from "react";
import cx from "classnames";
import { ColResizer } from "./ColResizer";
import { Heading } from "@finos/vuu-table-types";
import { resizePhase } from "../gridTypes";
import { useCellResize } from "./useCellResize";

export interface HeadingCellProps extends HTMLAttributes<HTMLDivElement> {
  heading: Heading;
  onResize: (phase: resizePhase, headingName: string, width?: number) => void;
}

export const HeadingCell = function HeaderCell({
  className,
  heading,
  onResize,
}: HeadingCellProps) {
  const rootRef = useRef(null);
  const col = useRef(heading);

  // essential that handlers for resize do not use stale column
  // we could mitigate this by only passing column key and passing delta,
  // so we don't rely on current width in column
  col.current = heading;

  const { isResizing, ...resizeProps } = useCellResize({
    column: heading,
    onResize,
    rootRef,
  });

  // const handleResizeStart = useCallback(() => {
  //   console.log({ heading });
  //   onResize("begin", heading);
  // }, [heading, onResize]);

  // const handleResize = useCallback(
  //   (e) => {
  //     if (rootRef.current) {
  //       const width = getWidthFromMouseEvent(e, rootRef.current);
  //       if (width > 0 && width !== col.current.width) {
  //         onResize("resize", col.current, width);
  //       }
  //     }
  //   },
  //   [onResize]
  // );

  // const handleResizeEnd = (e) => {
  //   if (rootRef.current) {
  //     onResize("end", col.current, getWidthFromMouseEvent(e, rootRef.current));
  //   }
  // };

  // const getWidthFromMouseEvent = (e, el: HTMLDivElement) => {
  //   const right = e.pageX;
  //   const left = el.getBoundingClientRect().left;
  //   return right - left;
  // };

  // TODO could we just wrap the whole header in a draggable ?
  const { label, resizing, width } = heading;
  return (
    <div
      className={cx("hwHeaderCell", className, { resizing })}
      ref={rootRef}
      style={{ width }}
    >
      <div className={"innerHeaderCell"}>
        <div className={"cellWrapper"}>{label}</div>
      </div>
      {heading.resizeable !== false && <ColResizer {...resizeProps} />}
    </div>
  );
};
