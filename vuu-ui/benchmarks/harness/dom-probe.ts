/**
 * Counts calls to the DOM APIs React and the Table use to build and update
 * the page. The runner installs the probe with page.addInitScript in the
 * instrumented pass only, before any page script runs; the timing pass
 * runs on unpatched prototypes.
 *
 * installDomProbe is serialised into the page by Playwright, so it must not
 * refer to anything outside its own body.
 */
import type { DomApiCounts } from "./types";

export const installDomProbe = () => {
  const counts: DomApiCounts = {
    createElement: 0,
    createTextNode: 0,
    appendChild: 0,
    insertBefore: 0,
    removeChild: 0,
    replaceChild: 0,
    setAttribute: 0,
    removeAttribute: 0,
    styleSetProperty: 0,
    textContentSet: 0,
    nodeValueSet: 0,
  };

  const wrapMethod = (
    proto: object,
    name: string,
    counter: keyof DomApiCounts,
  ) => {
    const original = Reflect.get(proto, name) as (
      ...args: unknown[]
    ) => unknown;
    Object.defineProperty(proto, name, {
      configurable: true,
      writable: true,
      value: function (this: unknown, ...args: unknown[]) {
        counts[counter] += 1;
        return original.apply(this, args);
      },
    });
  };

  const wrapSetter = (
    proto: object,
    name: string,
    counter: keyof DomApiCounts,
  ) => {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
    const set = descriptor?.set;
    if (!descriptor || !set) return;
    Object.defineProperty(proto, name, {
      ...descriptor,
      set(this: unknown, value: unknown) {
        counts[counter] += 1;
        set.call(this, value);
      },
    });
  };

  wrapMethod(Document.prototype, "createElement", "createElement");
  wrapMethod(Document.prototype, "createTextNode", "createTextNode");
  wrapMethod(Node.prototype, "appendChild", "appendChild");
  wrapMethod(Node.prototype, "insertBefore", "insertBefore");
  wrapMethod(Node.prototype, "removeChild", "removeChild");
  wrapMethod(Node.prototype, "replaceChild", "replaceChild");
  wrapMethod(Element.prototype, "setAttribute", "setAttribute");
  wrapMethod(Element.prototype, "removeAttribute", "removeAttribute");
  wrapMethod(CSSStyleDeclaration.prototype, "setProperty", "styleSetProperty");
  wrapSetter(Node.prototype, "textContent", "textContentSet");
  // React updates the text of an existing text node through nodeValue
  wrapSetter(Node.prototype, "nodeValue", "nodeValueSet");

  window.__vuuDomProbe = {
    reset: () => {
      for (const key of Object.keys(counts) as Array<keyof DomApiCounts>) {
        counts[key] = 0;
      }
    },
    read: () => ({ ...counts }),
  };
};
