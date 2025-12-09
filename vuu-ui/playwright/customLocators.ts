import { selectors } from "@playwright/test";

type SelectorRoot = Element | Document;

type CustomSelectorEngine = {
  query(root: SelectorRoot, selector: string): Element | null;
  queryAll(root: SelectorRoot, selector: string): Element[];
};

/**
 * Registers a custom locator so tests can do:
 * `page.locator('aria-selected')` or `page.locator('aria-selected=true')`
 */
export function registerAriaSelectedLocator(): void {
  const engine: CustomSelectorEngine = {
    query(root, selector) {
      const [element] = queryAllByAriaSelected(root, selector ?? undefined);
      return element ?? null;
    },
    queryAll(root, selector) {
      return queryAllByAriaSelected(root, selector ?? undefined);
    },
  };

  selectors.register("aria-selected", () => engine);
}

function queryAllByAriaSelected(
  root: Element | Document,
  selector: string | undefined,
): Element[] {
  const normalized = normalizeSelector(selector);
  const css =
    normalized === undefined
      ? "[aria-selected]"
      : `[aria-selected='${escapeAttributeValue(normalized)}']`;

  return Array.from(root.querySelectorAll(css));
}

function normalizeSelector(selector?: string): string | undefined {
  const trimmed = selector?.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Fallback for CSS.escape in environments where it is unavailable.
 */
function escapeAttributeValue(value: string): string {
  const cssEscape = (CSS as { escape?: (s: string) => string }).escape;
  if (typeof cssEscape === "function") {
    return cssEscape(value);
  }

  return value.replace(/['\\]/g, "\\$&");
}
