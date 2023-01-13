import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useResizeObserver } from "./useResizeObserver";
import {
  BreakPointRamp,
  breakpointRamp,
  getBreakPoints as getDocumentBreakpoints,
} from "./breakpoints";
import { BreakPoint, BreakPointsProp } from "../flexbox/flexboxTypes";

const EMPTY_ARRAY: BreakPoint[] = [];

export interface BreakpointsHookProps {
  breakPoints?: BreakPointsProp;
  smallerThan?: string;
}

// TODO how do we cater for smallerThan/greaterThan breakpoints
export const useBreakpoints = (
  { breakPoints: breakPointsProp, smallerThan }: BreakpointsHookProps,
  ref: RefObject<HTMLElement>
) => {
  const [breakpointMatch, setBreakpointmatch] = useState(
    smallerThan ? false : "lg"
  );
  const bodyRef = useRef(document.body);
  const breakPointsRef = useRef<BreakPointRamp[]>(
    breakPointsProp ? breakpointRamp(breakPointsProp) : getDocumentBreakpoints()
  );

  // TODO how do we identify the default
  const sizeRef = useRef("lg");

  const stopFromMinWidth = useCallback(
    (w) => {
      if (breakPointsRef.current) {
        for (const [name, size] of breakPointsRef.current) {
          if (w >= size) {
            return name;
          }
        }
      }
    },
    [breakPointsRef]
  );

  const matchSizeAgainstBreakpoints = useCallback(
    (width) => {
      if (smallerThan) {
        const breakPointRamp = breakPointsRef.current.find(
          ([name]: BreakPointRamp) => name === smallerThan
        );
        if (breakPointRamp) {
          const [, , maxValue] = breakPointRamp;
          return width < maxValue;
        }
      } else {
        return stopFromMinWidth(width);
      }
      // is this right ?
      return width;
    },
    [smallerThan, stopFromMinWidth]
  );

  // TODO need to make the dimension a config
  useResizeObserver(
    ref || bodyRef,
    breakPointsRef.current ? ["width"] : EMPTY_ARRAY,
    ({ width: measuredWidth }: { width?: number }) => {
      const result = matchSizeAgainstBreakpoints(measuredWidth);
      if (result !== sizeRef.current) {
        sizeRef.current = result;
        setBreakpointmatch(result);
      }
    },
    true
  );

  useEffect(() => {
    const target = ref || bodyRef;
    if (target.current) {
      const prevSize = sizeRef.current;
      if (breakPointsRef.current) {
        // We're measuring here when the resizeObserver has also measured
        // There isn't a convenient way to get the Resizeobserver to
        // notify initial size - that's not really its job, unless we
        // set a flag ?
        const { clientWidth } = target.current;
        const result = matchSizeAgainstBreakpoints(clientWidth);
        sizeRef.current = result;
        // If initial size of ref does not match the default, notify client after render
        if (result !== prevSize) {
          setBreakpointmatch(result);
        }
      }
    }
  }, [setBreakpointmatch, matchSizeAgainstBreakpoints, ref]);

  // No, just ass the class directly to the ref, no need to render
  return breakpointMatch;
};
