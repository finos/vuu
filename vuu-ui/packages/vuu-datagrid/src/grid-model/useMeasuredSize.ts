import { RefObject, useCallback, useState } from "react";
import { useResizeObserver, ResizeHandler } from "../utils";

const FullAndClientWidthHeight = ["clientHeight", "clientWidth"];

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
  typeof size.clientHeight === "number" && typeof size.clientWidth === "number";

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
    }: {
      clientWidth?: number;
      clientHeight?: number;
    }) => {
      // Note: we know here that these values will be returned as numbers, we can enforce
      // this by typing useResizeObserver with generics
      setSize((currentSize) =>
        typeof clientHeight === "number" &&
        typeof clientWidth === "number" &&
        (clientWidth !== currentSize.clientWidth ||
          clientHeight !== currentSize.clientHeight)
          ? {
              ...currentSize,
              clientWidth: Math.floor(clientWidth),
              clientHeight: Math.floor(clientHeight),
            }
          : currentSize
      );
    },
    [setSize]
  );

  useResizeObserver(containerRef, FullAndClientWidthHeight, onResize, true);

  return size;
};
