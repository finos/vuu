import { RefObject, useCallback, useState } from "react";
import { useResizeObserver, ResizeHandler } from "../utils";

const FullAndClientWidthHeight = [
  "clientHeight",
  "clientWidth",
  "height",
  "width",
];

export type Size = {
  clientHeight?: number;
  clientWidth?: number;
  height?: number;
  width?: number;
};

export type MeasuredSize = {
  clientHeight: number;
  clientWidth: number;
  height: number;
  width: number;
};

export const isMeasured = (size: Size | MeasuredSize): size is MeasuredSize =>
  typeof size.height === "number" && typeof size.width === "number";

export const useMeasuredSize = (
  containerRef: RefObject<HTMLDivElement>,
  height?: number,
  width?: number
): Size => {
  const [size, setSize] = useState<Size>({ height, width });

  const onResize: ResizeHandler = useCallback(
    ({
      clientWidth,
      clientHeight,
      height,
      width,
    }: {
      clientWidth?: number;
      clientHeight?: number;
      height?: number;
      width?: number;
    }) => {
      // Note: we know here that these values will be returned as numbers, we can enforce
      // this by typing useResizeObserver with generics
      if (
        typeof clientHeight === "number" &&
        typeof clientWidth === "number" &&
        typeof height === "number" &&
        typeof width === "number" &&
        (clientWidth !== size.clientWidth ||
          clientHeight !== size.clientHeight ||
          height !== size.height ||
          width !== size.width)
      ) {
        setSize({
          clientWidth: Math.floor(clientWidth),
          clientHeight: Math.floor(clientHeight),
          height: Math.floor(height),
          width: Math.floor(width),
        });
      }
    },
    [size, setSize]
  );

  useResizeObserver(containerRef, FullAndClientWidthHeight, onResize, true);

  return size;
};
