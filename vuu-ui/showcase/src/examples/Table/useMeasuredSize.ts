import { RefObject, useCallback, useState } from "react";
import { useResizeObserver, ResizeHandler } from "./useResizeObserver";

const FullAndClientWidthHeight = [
  "clientHeight",
  "clientWidth",
  "height",
  "width",
];

export type Size = {
  pixelHeight: number;
  pixelWidth: number;
  clientHeight?: number;
  clientWidth?: number;
  height: number | "100%";
  width: number | "100%";
};

export type FullSize = {
  clientHeight?: number;
  clientWidth?: number;
  height: "100%";
  width: "100%";
};

export type MeasuredSize = {
  clientHeight: number;
  clientWidth: number;
  height: number | "100%";
  width: number | "100%";
};

export const isMeasured = (size: Size | MeasuredSize): size is MeasuredSize =>
  typeof size.clientHeight === "number" && typeof size.clientWidth === "number";

export const isFullSize = (
  size: Size | MeasuredSize | FullSize
): size is FullSize => size.height === "100%" && size.width === "100%";

export const useMeasuredSize = (
  containerRef: RefObject<HTMLDivElement>,
  height?: number,
  width?: number
): Size => {
  const [size, setSize] = useState<Size>({
    pixelHeight: height ?? 0,
    pixelWidth: width ?? 0,
    height: height ?? "100%",
    width: width ?? "100%",
  });
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
      setSize((currentSize) =>
        typeof clientHeight === "number" &&
        typeof clientWidth === "number" &&
        (clientWidth !== currentSize.clientWidth ||
          clientHeight !== currentSize.clientHeight)
          ? {
              ...currentSize,
              pixelWidth: Math.floor(clientWidth),
              pixelHeight: Math.floor(clientHeight),
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
