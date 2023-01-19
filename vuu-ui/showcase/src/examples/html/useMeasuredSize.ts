import { RefObject, useCallback, useRef, useState } from "react";
import { useResizeObserver, ResizeHandler } from "./useResizeObserver";

const FullAndClientWidthHeight = [
  "clientHeight",
  "clientWidth",
  "height",
  "width",
];

export interface ClientSize {
  clientHeight: number;
  clientWidth: number;
}

export interface UnmeasuredSize {
  clientHeight: undefined;
  clientWidth: undefined;
  height: number | "100%";
  isMeasured: false;
  width: number | "100%";
}

export interface MeasuredSize extends ClientSize {
  height: number | "100%";
  isMeasured: true;
  width: number | "100%";
}

export type Size = MeasuredSize | UnmeasuredSize;

const isNumber = (val: unknown): val is number => Number.isFinite(val);

export const useMeasuredSize = (
  containerRef: RefObject<HTMLDivElement>,
  height?: number,
  width?: number,
  defaultHeight = 0,
  defaultWidth = 0
): Size => {
  const [size, setSize] = useState<Size>({
    height: height ?? "100%",
    isMeasured: false,
    width: width ?? "100%",
  } as UnmeasuredSize);

  const onResize: ResizeHandler = useCallback(
    ({ clientWidth, clientHeight }: Partial<ClientSize>) => {
      setSize((currentSize) =>
        isNumber(clientHeight) &&
        isNumber(clientWidth) &&
        (clientWidth !== currentSize.clientWidth ||
          clientHeight !== currentSize.clientHeight)
          ? {
              ...currentSize,
              isMeasured: true,
              clientWidth: Math.floor(clientWidth) || defaultWidth,
              clientHeight: Math.floor(clientHeight) || defaultHeight,
            }
          : currentSize
      );
    },
    [defaultHeight, defaultWidth]
  );

  useResizeObserver(containerRef, FullAndClientWidthHeight, onResize, true);

  return size;
};
