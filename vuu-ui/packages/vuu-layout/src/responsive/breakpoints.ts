// should we have some global; defaults ?

import { BreakPointsProp } from "../flexbox/flexboxTypes";

export type BreakPointRamp = [string, number, number];

function breakpointReader(
  themeName: string,
  defaultBreakpoints?: BreakPointsProp
) {
  //TODO ownerDocument
  const themeRoot = document.body.querySelector(`.${themeName}`);
  const handler = {
    get: function (style: CSSStyleDeclaration, stopName: string) {
      const val = style.getPropertyValue(
        // lets assume we have the following naming convention
        `--${themeName}-breakpoint-${stopName}`
      );
      return val ? parseInt(val) : undefined;
    },
  };

  return themeRoot
    ? new Proxy(getComputedStyle(themeRoot), handler)
    : defaultBreakpoints ?? {};
}

const byDescendingStopSize = (
  [, s1]: [string, number],
  [, s2]: [string, number]
) => s2 - s1;

// These are assumed to be min-width (aka mobile-first) stops, we could take a
// paramneter to support max-width as well ?
// return [stopName, minWidth, maxWidth]
export const breakpointRamp = (
  breakpoints: BreakPointsProp
): BreakPointRamp[] =>
  Object.entries(breakpoints)
    .sort(byDescendingStopSize)
    .map(([name, value], i, all) => [
      name,
      value,
      i < all.length - 1 ? all[i + 1][1] : 9999,
    ]);

let documentBreakpoints: BreakPointRamp[] | null = null;

const loadBreakpoints = (themeName = "salt") => {
  // TODO would be nice to read these breakpoint labels from a css variable to
  // avoid hard-coding them here ?
  const { xs, sm, md, lg, xl } = breakpointReader(themeName) as BreakPointsProp;
  return breakpointRamp({ xs, sm, md, lg, xl });
};

//TODO support multiple themes loaded
export const getBreakPoints = (themeName?: string) => {
  if (documentBreakpoints === null) {
    documentBreakpoints = loadBreakpoints(themeName);
  }
  return documentBreakpoints;
};
