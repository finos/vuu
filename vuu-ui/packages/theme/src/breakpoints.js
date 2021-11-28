// should we have some global; defaults ?

function breakpointReader(themeName, defaultBreakpoints) {
  //TODO ownerDocument
  const themeRoot = document.body.querySelector(`.${themeName}`);
  const handler = {
    get: function (style, stopName) {
      const val = style.getPropertyValue(
        // lets assume we have the following naming convention
        `--${themeName}-breakpoint-${stopName}`
      );
      return val ? parseInt(val) : undefined;
    }
  };

  return themeRoot ? new Proxy(getComputedStyle(themeRoot), handler) : defaultBreakpoints ?? {};
}

const byAsscendingStopSize = ([, s1], [, s2]) => s1 - s2;

// These are assumed to be min-width (aka mobile-first) stops, we could take a
// paramneter to support max-width as well ?
// return [stopName, minWidth, maxWidth]
export const breakpointRamp = (breakpoints) =>
  Object.entries(breakpoints)
    .sort(byAsscendingStopSize)
    .map(([name, value], i, all) => [name, value, i < all.length - 1 ? all[i + 1][1] : 9999]);

let documentBreakpoints = null;

const loadBreakpoints = (themeName = 'uitk') => {
  // TODO would be nice to read these breakpoint labels from a css variable to
  // avoid hard-coding them here ?
  const { xs, sm, md, lg, xl } = breakpointReader(themeName);
  return breakpointRamp({ xs, sm, md, lg, xl });
};

//TODO support multiple themes loaded
export const getBreakPoints = (themeName) => {
  if (documentBreakpoints === null) {
    documentBreakpoints = loadBreakpoints(themeName);
  }
  return documentBreakpoints;
};
