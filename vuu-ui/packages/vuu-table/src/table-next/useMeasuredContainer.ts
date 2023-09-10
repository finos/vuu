import { isValidNumber } from "@finos/vuu-utils";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
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
  css: CssSize;
  outer: Size;
  inner?: MeasuredSize;
}

const isNumber = (val: unknown): val is number => Number.isFinite(val);

export type CssSize = {
  height: string;
  width: string;
};
const FULL_SIZE: CssSize = { height: "100%", width: "100%" };

export interface MeasuredContainerHookResult {
  containerRef: RefObject<HTMLDivElement>;
  cssSize: CssSize;
  outerSize: Size;
  innerSize?: MeasuredSize;
}

// If (outer) height and width are known at initialisation (i.e. they
// were passed as props), use as initial values for inner size. If there
// is no border on Table, these values will not change. If there is a border,
// inner values will be updated once measured.
const getInitialCssSize = (height: unknown, width: unknown): CssSize => {
  if (isValidNumber(height) && isValidNumber(width)) {
    return {
      height: `${height}px`,
      width: `${width}px`,
    };
  } else {
    return FULL_SIZE;
  }
};

const getInitialInnerSize = (
  height: unknown,
  width: unknown
): MeasuredSize | undefined => {
  if (isValidNumber(height) && isValidNumber(width)) {
    return {
      height,
      width,
    };
  }
};

export const useMeasuredContainer = ({
  defaultHeight = 0,
  defaultWidth = 0,
  height,
  width,
}: MeasuredProps): MeasuredContainerHookResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<MeasuredState>({
    css: getInitialCssSize(height, width),
    inner: getInitialInnerSize(height, width),
    outer: {
      height: height ?? "100%",
      width: width ?? "100%",
    },
  });

  useMemo(() => {
    setSize((currentSize) => {
      const { inner, outer } = currentSize;
      if (isValidNumber(height) && isValidNumber(width) && inner && outer) {
        const { height: innerHeight, width: innerWidth } = inner;
        const { height: outerHeight, width: outerWidth } = outer;

        if (outerHeight !== height || outerWidth !== width) {
          const heightDiff = isValidNumber(outerHeight)
            ? outerHeight - innerHeight
            : 0;
          const widthDiff = isValidNumber(outerWidth)
            ? outerWidth - innerWidth
            : 0;
          return {
            ...currentSize,
            outer: { height, width },
            inner: { height: height - heightDiff, width: width - widthDiff },
          };
        }
      }
      return currentSize;
    });
  }, [height, width]);

  const onResize: ResizeHandler = useCallback(
    ({ clientWidth, clientHeight }: Partial<ClientSize>) => {
      console.log(`onResize ${clientHeight}`);
      setSize((currentSize) => {
        const { css, inner, outer } = currentSize;
        return isNumber(clientHeight) &&
          isNumber(clientWidth) &&
          (clientWidth !== inner?.width || clientHeight !== inner?.height)
          ? {
              css,
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
    cssSize: size.css,
    outerSize: size.outer,
    innerSize: size.inner,
  };
};
