import { HTMLAttributes, useRef } from "react";
import { Component } from "./Component";
import { useMeasuredSize } from "./useMeasuredSize";

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  height?: number;
  maxHeight?: number;
  maxWidth?: number;
  padding?: number;
  width?: number;
}

export const Box = ({ height, width }: BoxProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const defaultHeight = 200;
  const defaultWidth = 400;

  const size = useMeasuredSize(
    rootRef,
    height,
    width,
    defaultHeight,
    defaultWidth
  );
  console.log(`size ${JSON.stringify(size, null, 2)}`);

  return (
    <div
      className="vuuBox"
      ref={rootRef}
      style={{
        background: "red",
        border: "solid red 3px",
        width: "100%",
        height: "100%",
      }}
    >
      {size.isMeasured ? (
        <Component width={size.clientWidth} height={size.clientHeight} />
      ) : null}
    </div>
  );
};
