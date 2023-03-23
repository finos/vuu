import { MeasuredProps, useMeasuredContainer } from "@finos/vuu-table";
import { HTMLAttributes } from "react";
import { Component } from "./Component";

interface BoxProps extends MeasuredProps, HTMLAttributes<HTMLDivElement> {
  maxHeight?: number;
  maxWidth?: number;
}

export const Box = ({ height, width }: BoxProps) => {
  const {
    containerRef: measuredRef,
    outerSize: containerSize,
    innerSize: contentSize,
  } = useMeasuredContainer({
    defaultHeight: 200,
    defaultWidth: 400,
    height,
    width,
  });
  console.log(`measuredRef ${measuredRef.current}`);

  return (
    <div
      className="vuuBox"
      ref={measuredRef}
      style={{
        background: "red",
        border: "solid red 3px",
        ...containerSize,
      }}
    >
      {contentSize ? <Component {...contentSize} /> : null}
    </div>
  );
};
