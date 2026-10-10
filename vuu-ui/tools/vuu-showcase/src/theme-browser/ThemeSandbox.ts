import type { ThemeModel } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import type { Axes } from "./model-utils";

const HIDDEN =
  "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict";

/**
 * The theme under observation is loaded into an isolated shadow root, never
 * into the document. The browser chrome does not inherit from it, it only
 * renders values resolved here (via getComputedStyle on probe elements that
 * carry the theme classes and axis attributes).
 *
 * Custom properties do inherit across the shadow boundary, so every property
 * named by the theme is reset on the host. Otherwise a token the theme does
 * not declare could resolve to a value from the showcase's own theme.
 */
export class ThemeSandbox {
  readonly #host: HTMLDivElement;
  readonly #root: ShadowRoot;
  readonly #probes = new Map<string, HTMLDivElement>();
  readonly #resolved = new Map<string, string>();
  readonly #measured = new Map<string, number>();

  constructor(
    readonly model: ThemeModel,
    stylesheet: string,
    readonly rootClasses: string[],
  ) {
    this.#host = document.createElement("div");
    this.#host.className = "vuuThemeBrowser-sandbox";
    this.#host.setAttribute("aria-hidden", "true");
    this.#host.style.cssText = HIDDEN;
    this.#root = this.#host.attachShadow({ mode: "open" });

    const names = new Set(stylesheet.match(/--[\w-]+/g));
    for (const token of Object.values(model.tokens)) {
      names.add(token.name);
      token.references.forEach((name) => names.add(name));
    }
    const isolation = new CSSStyleSheet();
    isolation.replaceSync(
      `:host { ${[...names].map((name) => `${name}: initial;`).join(" ")} }`,
    );
    const theme = new CSSStyleSheet();
    theme.replaceSync(stylesheet);
    this.#root.adoptedStyleSheets = [isolation, theme];

    document.body.append(this.#host);
  }

  #probe(axes: Axes) {
    const key = JSON.stringify(axes);
    let probe = this.#probes.get(key);
    if (!probe) {
      probe = document.createElement("div");
      probe.style.cssText = "position:absolute;width:0;height:0";
      probe.classList.add(...this.rootClasses);
      for (const axis of this.model.axes) {
        const value = axes[axis.name];
        if (value === undefined) continue;
        if (axis.source.startsWith(".")) {
          probe.classList.add(axis.source.slice(1).replace("*", value));
        } else {
          probe.setAttribute(axis.source, value);
        }
      }
      this.#root.append(probe);
      this.#probes.set(key, probe);
    }
    return probe;
  }

  /** computed value of a custom property under the given axes */
  resolve(name: string, axes: Axes) {
    const key = `${JSON.stringify(axes)}${name}`;
    let value = this.#resolved.get(key);
    if (value === undefined) {
      value = getComputedStyle(this.#probe(axes)).getPropertyValue(name).trim();
      this.#resolved.set(key, value);
    }
    return value;
  }

  /** evaluate a length token (including calc()) to px under the given axes */
  measure(name: string, axes: Axes) {
    const key = `${JSON.stringify(axes)}${name}`;
    let px = this.#measured.get(key);
    if (px === undefined) {
      const ruler = document.createElement("div");
      ruler.style.cssText = `position:absolute;height:0;width:var(${name})`;
      this.#probe(axes).append(ruler);
      px = parseFloat(getComputedStyle(ruler).width) || 0;
      ruler.remove();
      this.#measured.set(key, px);
    }
    return px;
  }

  dispose() {
    this.#host.remove();
    this.#probes.clear();
    this.#resolved.clear();
    this.#measured.clear();
  }
}
