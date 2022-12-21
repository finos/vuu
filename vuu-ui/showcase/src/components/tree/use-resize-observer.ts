import { RefObject, useCallback, useEffect, useRef } from "react";

export const WidthHeight = ["height", "width"];
export const WidthOnly = ["width"];

export type measurements<T = string | number> = {
  height?: T;
  clientHeight?: number;
  clientWidth?: number;
  contentHeight?: number;
  contentWidth?: number;
  scrollHeight?: number;
  scrollWidth?: number;
  width?: T;
};
type measuredDimension = keyof measurements<number>;

export type ResizeHandler = (measurements: measurements<number>) => void;

type observedDetails = {
  onResize?: ResizeHandler;
  measurements: measurements<number>;
};
const observedMap = new Map<HTMLElement, observedDetails>();

const getTargetSize = (
  element: HTMLElement,
  size: {
    height: number;
    width: number;
    contentHeight: number;
    contentWidth: number;
  },
  dimension: measuredDimension
): number => {
  switch (dimension) {
    case "height":
      return size.height;
    case "clientHeight":
      return element.clientHeight;
    case "clientWidth":
      return element.clientWidth;
    case "contentHeight":
      return size.contentHeight;
    case "contentWidth":
      return size.contentWidth;
    case "scrollHeight":
      return Math.ceil(element.scrollHeight);
    case "scrollWidth":
      return Math.ceil(element.scrollWidth);
    case "width":
      return size.width;
    default:
      return 0;
  }
};

const isScrollAttribute = {
  scrollHeight: true,
  scrollWidth: true,
};

// TODO should we make this create-on-demand
const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { target, borderBoxSize, contentBoxSize } = entry;
    const observedTarget = observedMap.get(target as HTMLElement);
    if (observedTarget) {
      const [{ blockSize: height, inlineSize: width }] = borderBoxSize;
      const [{ blockSize: contentHeight, inlineSize: contentWidth }] =
        contentBoxSize;
      const { onResize, measurements } = observedTarget;
      let sizeChanged = false;
      for (let [dimension, size] of Object.entries(measurements)) {
        const newSize = getTargetSize(
          target as HTMLElement,
          { height, width, contentHeight, contentWidth },
          dimension as measuredDimension
        );

        if (newSize !== size) {
          sizeChanged = true;
          measurements[dimension as measuredDimension] = newSize;
        }
      }
      if (sizeChanged) {
        // TODO only return measured sizes
        onResize && onResize(measurements);
      }
    }
  }
});

// TODO use an optional lag (default to false) to ask to fire onResize
// with initial size
export function useResizeObserver(
  ref: RefObject<Element | HTMLElement | null>,
  dimensions: string[],
  onResize: ResizeHandler,
  reportInitialSize = false
) {
  const dimensionsRef = useRef(dimensions);

  const measure = useCallback((target: HTMLElement): measurements<number> => {
    const { width, height } = target.getBoundingClientRect();
    const { clientWidth: contentWidth, clientHeight: contentHeight } = target;
    return dimensionsRef.current.reduce(
      (map: { [key: string]: number }, dim) => {
        map[dim] = getTargetSize(
          target,
          { width, height, contentHeight, contentWidth },
          dim as measuredDimension
        );
        return map;
      },
      {}
    );
  }, []);

  // TODO use ref to store resizeHandler here
  // resize handler registered with REsizeObserver will never change
  // use ref to store user onResize callback here
  // resizeHandler will call user callback.current

  // Keep this effect separate in case user inadvertently passes different
  // dimensions or callback instance each time - we only ever want to
  // initiate new observation when ref changes.
  useEffect(() => {
    const target = ref.current as HTMLElement;
    async function registerObserver() {
      // Create the map entry immediately. useEffect may fire below
      // before fonts are ready and attempt to update entry
      observedMap.set(target, { measurements: {} as measurements<number> });
      await document.fonts.ready;
      const observedTarget = observedMap.get(target);
      if (observedTarget) {
        const measurements = measure(target);
        observedTarget.measurements = measurements;
        resizeObserver.observe(target);
        if (reportInitialSize) {
          onResize(measurements);
        }
      } else {
        console.log(
          `%cuseResizeObserver an target expected to be under observation wa snot found. This warrants investigation`,
          "font-weight:bold; color:red;"
        );
      }
    }

    if (target) {
      // TODO might we want multiple callers to attach a listener to the same element ?
      if (observedMap.has(target)) {
        throw Error(
          "useResizeObserver attemping to observe same element twice"
        );
      }
      // TODO set a pending entry on map
      registerObserver();
    }
    return () => {
      if (target && observedMap.has(target)) {
        resizeObserver.unobserve(target);
        observedMap.delete(target);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ref]);

  useEffect(() => {
    const target = ref.current as HTMLElement;
    const record = observedMap.get(target);
    if (record) {
      if (dimensionsRef.current !== dimensions) {
        dimensionsRef.current = dimensions;
        const measurements = measure(target);
        record.measurements = measurements;
      }
      // Might not have changed, but no harm ...
      record.onResize = onResize;
    }
  }, [dimensions, measure, ref, onResize]);
}
