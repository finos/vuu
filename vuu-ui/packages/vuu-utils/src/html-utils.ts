export const createEl = (
  elementType: "div" | "p" | "span",
  className?: string,
  textContent?: string
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
  tabIndex?: number
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

export const queryClosest = <T extends HTMLElement = HTMLElement>(
  el: HTMLElement | EventTarget | null,
  cssQueryString: string
) => (el === null ? null : ((el as HTMLElement).closest(cssQueryString) as T));

export const getClosest = (el: HTMLElement, dataProperty: string) =>
  queryClosest(el, `[data-${dataProperty}]`);

export const getClosestIndexItem = (el: HTMLElement) => getClosest(el, "index");

export function getElementByDataIndex(
  c: HTMLElement | null,
  i: number | string,
  throwIfNotFound: true
): HTMLElement;
export function getElementByDataIndex(
  c: HTMLElement | null,
  i: number | string,
  throwIfNotFound?: false
): HTMLElement | undefined;
export function getElementByDataIndex(
  container: HTMLElement | null,
  index: number | string,
  throwIfNotFound = false
) {
  if (container === null && throwIfNotFound) {
    throw Error("html-utils getElementByDataIndex, container is null");
  }
  const element = container?.querySelector(
    `[data-index="${index}"]`
  ) as HTMLElement;
  if (element) {
    return element;
  } else if (throwIfNotFound) {
    throw Error(
      "html-utils getElementByDataIndex, Item not found with data-index='${index}'"
    );
  } else {
    return undefined;
  }
}

export const focusFirstFocusableElement = (
  el: HTMLElement | null,
  tabIndex?: number
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

export type MouseEventTypes = "dblclick" | "click";

export const dispatchMouseEvent = (el: HTMLElement, type: MouseEventTypes) => {
  const evt = new MouseEvent(type, {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(evt);
};

export type VuuDomEventType = "vuu-commit" | "vuu-dropped";

export const dispatchCustomEvent = (el: HTMLElement, type: VuuDomEventType) => {
  const evt = new Event(type, {
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(evt);
};
