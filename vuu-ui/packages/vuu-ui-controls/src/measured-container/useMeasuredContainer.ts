import { isValidNumber } from "@vuu-ui/vuu-utils";
import {
  CSSProperties,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MeasuredContainerProps } from "./MeasuredContainer";
import { useResizeObserver, ResizeHandler } from "./useResizeObserver";

const ClientWidthHeight = ["clientHeight", "clientWidth"];
const WidthOnly = ["clientWidth"];
const HeightOnly = ["clientHeight"];
const NO_MEASUREMENT = [] as const;

export interface ClientSize {
  clientHeight: number;
  clientWidth: number;
}

const NullClientSize: Partial<ClientSize> = {
  clientHeight: -1,
  clientWidth: -1,
};

export interface MeasuredProps
  extends Pick<
    MeasuredContainerProps,
    "height" | "onResize" | "resizeStrategy" | "width"
  > {
  defaultHeight?: number;
  defaultWidth?: number;
}

export type CssSize = Pick<CSSProperties, "height" | "width">;

export interface MeasuredSize {
  height: number;
  width: number;
}

interface MeasuredState {
  css: CssSize;
  outer: CssSize;
  inner?: MeasuredSize;
}

const isNumber = (val: unknown): val is number => Number.isFinite(val);

export interface MeasuredContainerHookResult {
  containerRef: RefObject<HTMLDivElement | null>;
  cssSize: CssSize;
  outerSize: CssSize;
  innerSize?: MeasuredSize;
}

export const reduceSizeHeight = (
  size: MeasuredSize,
  value: number,
): MeasuredSize => {
  if (value === 0) {
    return size;
  } else {
    return {
      height: size.height - value,
      width: size.width,
    };
  }
};

const getInitialValue = (
  value: number | string | undefined,
  defaultValue: "auto" | "100%",
) => {
  if (isValidNumber(value)) {
    return `${value}px`;
  } else if (typeof value === "string") {
    return value;
  } else {
    return defaultValue;
  }
};

// If (outer) height and width are known at initialisation (i.e. they
// were passed as props), use as initial values for inner size. If there
// is no border on Table, these values will not change. If there is a border,
// inner values will be updated once measured.
const getInitialCssSize = (
  height?: number | string,
  width?: number | string,
): CssSize => {
  return {
    height: getInitialValue(height, "100%"),
    width: getInitialValue(width, "auto"),
  };
};

const getInitialInnerSize = (
  height: unknown,
  width: unknown,
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
  onResize: onResizeProp,
  resizeStrategy = "responsive",
  width,
}: MeasuredProps): MeasuredContainerHookResult => {
  const deferResize = resizeStrategy === "defer";
  const sizeRef = useRef<Partial<ClientSize>>(NullClientSize);
  const resizeHandleRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<MeasuredState>({
    css: getInitialCssSize(height, width),
    inner: getInitialInnerSize(height, width),
    outer: {
      height: height ?? "100%",
      width: width ?? "auto",
    },
  });

  const fixedHeight = typeof height === "number";
  const fixedWidth = typeof width === "number";

  const dimensions =
    fixedHeight && fixedWidth
      ? NO_MEASUREMENT
      : fixedHeight
        ? WidthOnly
        : fixedWidth
          ? HeightOnly
          : ClientWidthHeight;

  useMemo(() => {
    // TODO why call state from memo.
    // Why not calculate size first inline, then assign that to state
    // on first pass
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

  const handleResize = useCallback(
    (clientWidth: number | undefined, clientHeight: number | undefined) => {
      const { css, inner, outer } = size;
      let newState: MeasuredState = size;
      if (
        fixedHeight &&
        isNumber(clientWidth) &&
        Math.floor(clientWidth) !== inner?.width
      ) {
        newState = {
          css,
          outer,
          inner: {
            width: Math.floor(clientWidth) || defaultWidth,
            height,
          },
        };
      } else if (
        fixedWidth &&
        isNumber(clientHeight) &&
        Math.floor(clientHeight) !== inner?.height
      ) {
        newState = {
          css,
          outer,
          inner: {
            height: Math.floor(clientHeight) || defaultHeight,
            width,
          },
        };
      } else if (
        isNumber(clientHeight) &&
        isNumber(clientWidth) &&
        (clientWidth !== inner?.width || clientHeight !== inner?.height)
      ) {
        newState = {
          css,
          outer,
          inner: {
            width: Math.floor(clientWidth) || defaultWidth,
            height: Math.floor(clientHeight) || defaultHeight,
          },
        };
      }

      if (newState !== size) {
        setSize(newState);
      }
    },
    [defaultHeight, defaultWidth, fixedHeight, fixedWidth, height, size, width],
  );

  const onResize: ResizeHandler = useCallback(
    ({ clientHeight, clientWidth }: Partial<ClientSize>) => {
      if (deferResize) {
        sizeRef.current.clientHeight = clientHeight;
        sizeRef.current.clientWidth = clientWidth;
        //
        if (resizeHandleRef.current !== null) {
          clearTimeout(resizeHandleRef.current);
        }
        resizeHandleRef.current = setTimeout(() => {
          handleResize(clientWidth, clientHeight);
        }, 40);
      } else {
        handleResize(clientWidth, clientHeight);
      }
    },
    [deferResize, handleResize],
  );

  useEffect(() => {
    if (size.inner) {
      if (containerRef.current) {
        if (typeof height !== "number" || height === 0) {
          size.inner.height = containerRef.current.clientHeight;
        }
        size.inner.width = containerRef.current.clientWidth;
        onResizeProp?.(size.inner);
      }
    }
  }, [height, onResizeProp, size.inner]);

  useResizeObserver(containerRef, dimensions, onResize, true);

  return {
    containerRef,
    cssSize: size.css,
    outerSize: size.outer,
    innerSize: size.inner,
  };
};
