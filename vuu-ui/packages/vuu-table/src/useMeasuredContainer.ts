import { RefObject, useCallback, useRef, useState } from "react";
import { useResizeObserver, ResizeHandler } from "./useResizeObserver";

const ClientWidthHeight = ["clientHeight", "clientWidth"];

export interface ClientSize {
  clientHeight: number;
  clientWidth: number;
}

export interface MeasuredProps {
  defaultHeight?: number;
  defaultWidth?: number;
  height?: number;
  width?: number;
}

export interface Size {
  height: number | "100%";
  width: number | "100%";
}

export interface MeasuredSize {
  height: number;
  width: number;
}

interface MeasuredState {
  outer: Size;
  inner?: MeasuredSize;
}

const isNumber = (val: unknown): val is number => Number.isFinite(val);

export interface MeasuredContainerHookResult {
  containerRef: RefObject<HTMLDivElement>;
  outerSize: Size;
  innerSize?: MeasuredSize;
}

export const useMeasuredContainer = ({
  defaultHeight = 0,
  defaultWidth = 0,
  height,
  width,
}: MeasuredProps): MeasuredContainerHookResult => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState<MeasuredState>({
    outer: {
      height: height ?? "100%",
      width: width ?? "100%",
    },
  });

  const onResize: ResizeHandler = useCallback(
    ({ clientWidth, clientHeight }: Partial<ClientSize>) => {
      setSize((currentSize) => {
        const { inner, outer } = currentSize;
        return isNumber(clientHeight) &&
          isNumber(clientWidth) &&
          (clientWidth !== inner?.width || clientHeight !== inner?.height)
          ? {
              outer,
              inner: {
                width: Math.floor(clientWidth) || defaultWidth,
                height: Math.floor(clientHeight) || defaultHeight,
              },
            }
          : currentSize;
      });
    },
    [defaultHeight, defaultWidth]
  );

  useResizeObserver(containerRef, ClientWidthHeight, onResize, true);

  return {
    containerRef,
    outerSize: size.outer,
    innerSize: size.inner,
  };
};
