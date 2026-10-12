export const createEl = (
  elementType: "div" | "p" | "span",
  className?: string,
  textContent?: string,
): HTMLElement => {
  const el = document.createElement(elementType);
  if (className) {
    el.className = className;
  }
  if (textContent) {
    el.textContent = textContent;
  }
  return el;
};

export const getFocusableElement = (
  el: HTMLElement | null,
  tabIndex?: number,
) => {
  if (el) {
    if (el.hasAttribute("tabindex")) {
      const rootTabIndex = parseInt(el.getAttribute("tabindex") as string);
      if (
        !isNaN(rootTabIndex) &&
        (tabIndex === undefined || rootTabIndex === tabIndex)
      ) {
        return el;
      }
    }
    const focusableEl =
      typeof tabIndex === "number"
        ? (el.querySelector(`[tabindex="${tabIndex}"]`) as HTMLElement)
        : (el.querySelector("[tabindex]") as HTMLElement);
    if (focusableEl) {
      return focusableEl as HTMLElement;
    }
  }
};

export const getElementDataIndex = (el: HTMLElement | null) => {
  if (el) {
    const index = parseInt(el.dataset.index || "");
    if (!isNaN(index)) {
      return index;
    }
  }
  return -1;
};

export function queryClosest<T extends HTMLElement = HTMLElement>(
  el: HTMLElement | EventTarget | null,
  cssQueryString: string,
  throwIfNotFound?: false,
): T | null;
export function queryClosest<T extends HTMLElement = HTMLElement>(
  el: HTMLElement | EventTarget | null,
  cssQueryString: string,
  throwIfNotFound: true,
): T;
export function queryClosest<T extends HTMLElement = HTMLElement>(
  el: HTMLElement | EventTarget | null,
  cssQueryString: string,
  throwIfNotFound?: boolean,
) {
  if (el) {
    const result = (el as HTMLElement).closest(cssQueryString) as T;
    if (result) {
      return result;
    }
  }
  if (throwIfNotFound) {
    throw Error(`no element found to match '${cssQueryString}'`);
  } else {
    return null;
  }
}

export const getClosest = (el: HTMLElement, dataProperty: string) =>
  queryClosest(el, `[data-${dataProperty}]`);

export const getClosestIndexItem = (el: HTMLElement) => getClosest(el, "index");

export function getElementByDataIndex(
  c: HTMLElement | null | undefined,
  i: number | string,
  throwIfNotFound: true,
): HTMLElement;
export function getElementByDataIndex(
  c: HTMLElement | null | undefined,
  i: number | string,
  throwIfNotFound?: false,
): HTMLElement | undefined;
export function getElementByDataIndex(
  container: HTMLElement | null | undefined,
  index: number | string,
  throwIfNotFound = false,
) {
  if (container == null && throwIfNotFound) {
    throw Error("html-utils getElementByDataIndex, container is null");
  }
  const element = container?.querySelector(
    `[data-index="${index}"]`,
  ) as HTMLElement;
  if (element) {
    return element;
  } else if (throwIfNotFound) {
    throw Error(
      "html-utils getElementByDataIndex, Item not found with data-index='${index}'",
    );
  } else {
    return undefined;
  }
}

export const focusFirstFocusableElement = (
  el: HTMLElement | null,
  tabIndex?: number,
) => {
  // TODO test el for focusable
  requestAnimationFrame(() => {
    const focusableElement = getFocusableElement(el, tabIndex);
    if (focusableElement) {
      focusableElement.focus();
    }
  });
};

export const isSelectableElement = (el?: HTMLElement | null) => {
  const item = el?.closest("[data-index]") as HTMLElement;
  if (
    !item ||
    item.ariaDisabled ||
    item.dataset.selectable === "false" ||
    item.querySelector('[data-selectable="false"],[aria-disabled="true"]')
  ) {
    return false;
  } else {
    return true;
  }
};

export const isInputElement = (
  el: HTMLElement | EventTarget | null,
): el is HTMLInputElement => {
  if (el === null) {
    return false;
  } else {
    return (el as HTMLElement).tagName === "INPUT";
  }
};

export const isDateInput = (
  el: HTMLElement | EventTarget | null,
): el is HTMLInputElement =>
  isInputElement(el) && el.classList.contains("saltDateInput-input");

export const hasOpenOptionList = (el: HTMLElement | EventTarget | null) => {
  if (el !== null) {
    return (el as HTMLElement).ariaExpanded === "true";
  }
};

let size: number;

export function getScrollbarSize() {
  if (size === undefined) {
    let outer: HTMLElement | null = document.createElement("div");
    outer.className = "scrollable-content";
    outer.style.width = "50px";
    outer.style.height = "50px";
    outer.style.overflowY = "scroll";
    outer.style.position = "absolute";
    outer.style.top = "-200px";
    outer.style.left = "-200px";
    const inner = document.createElement("div");
    inner.style.height = "100px";
    inner.style.width = "100%";
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const outerWidth = outer.offsetWidth;
    const innerWidth = inner.offsetWidth;
    document.body.removeChild(outer);
    size = outerWidth - innerWidth;
    outer = null;
  }

  return size;
}

/**
 * Used when the max scroll height cannot be measured, e.g. outside a browser.
 */
export const DEFAULT_MAX_SCROLL_HEIGHT = 33_000_000;

// Larger than the limit of any current browser engine.
const MAX_PROBE_HEIGHT = 2 ** 26;

const maxScrollHeightByDevicePixelRatio = new Map<number, number>();

/**
 * Measure the largest scrollHeight (in CSS pixels) the browser supports for a
 * scrollable element. Engines have an internal layout limit, which shrinks in
 * CSS pixels as browser zoom increases, e.g.
 *   Chromium/WebKit: ~33.5M at 100%, ~11.18M at 300%
 *   Firefox:         ~17.9M at 100%, ~5.97M at 300%
 * Chromium/WebKit clamp heights above the limit, Firefox ignores them entirely,
 * so a single oversized probe cannot be used. Instead we binary search for the
 * largest height that is honoured. Browser zoom changes devicePixelRatio, so
 * results are cached per ratio.
 */
export function getMaxScrollHeight(
  doc: Document | undefined = globalThis.document,
) {
  if (doc?.body === undefined || doc.body === null) {
    return DEFAULT_MAX_SCROLL_HEIGHT;
  }

  const devicePixelRatio = doc.defaultView?.devicePixelRatio ?? 1;
  const cachedValue = maxScrollHeightByDevicePixelRatio.get(devicePixelRatio);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const outer = doc.createElement("div");
  outer.style.cssText =
    "position:absolute;top:-200px;left:-200px;width:50px;height:50px;overflow:scroll;visibility:hidden;";
  const inner = doc.createElement("div");
  inner.style.width = "1px";
  outer.appendChild(inner);
  doc.body.appendChild(outer);

  const isHonoured = (height: number) => {
    inner.style.height = `${height}px`;
    // allow for sub-pixel rounding of layout units
    return outer.scrollHeight >= height - 1;
  };

  let lo = 0;
  let hi = MAX_PROBE_HEIGHT;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (isHonoured(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  inner.style.height = `${lo}px`;
  const maxScrollHeight = Math.min(lo, outer.scrollHeight);
  outer.remove();

  // zero means no layout engine (e.g. non-browser test environment)
  if (maxScrollHeight > 0) {
    maxScrollHeightByDevicePixelRatio.set(devicePixelRatio, maxScrollHeight);
    return maxScrollHeight;
  }

  return DEFAULT_MAX_SCROLL_HEIGHT;
}

export type MouseEventTypes = "dblclick" | "click";
export type KeyboardEventTypes = "keydown" | "keypress" | "keyup";

export const dispatchMouseEvent = (el: HTMLElement, type: MouseEventTypes) => {
  const evt = new MouseEvent(type, {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(evt);
};
export const dispatchKeyboardEvent = (
  el: HTMLElement,
  type: KeyboardEventTypes,
  key: string,
) => {
  const evt = new KeyboardEvent(type, {
    key,
    view: window,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(evt);
};

export type VuuDomEventType =
  | "vuu-commit"
  | "vuu-dropped"
  | "vuu-begin-edit"
  | "vuu-enter-edit-mode"
  | "vuu-exit-edit-mode";

export const dispatchCustomEvent = (el: HTMLElement, type: VuuDomEventType) => {
  const evt = new Event(type, {
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(evt);
};
